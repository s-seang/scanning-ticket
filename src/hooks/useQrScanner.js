import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const CAMERA_KEY = 'scanflow.camera';

/**
 * Drives one full-frame camera scanner.
 *
 * Two decisions worth knowing about:
 *  - `qrbox` is left undefined on purpose. html5-qrcode then decodes the whole
 *    frame instead of a centre crop, which is what makes a code scan from any
 *    corner of the screen without a target box on screen.
 *  - the native BarcodeDetector is used where the browser has it (Chrome, Edge),
 *    falling back to the bundled WASM decoder elsewhere. It is several times
 *    faster, which is the difference between a queue moving and a queue waiting.
 */
export function useQrScanner({ elementId, onDecode, cooldownMs = 1500 }) {
  const scannerRef = useRef(null);
  const busyRef = useRef(false);
  const lastRef = useRef({ text: '', at: 0 });
  const decodeRef = useRef(onDecode);

  const [status, setStatus] = useState('idle'); // idle | starting | running | error
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState(null);
  const [mirrored, setMirrored] = useState(false);

  decodeRef.current = onDecode;

  const handleDecode = useCallback(
    (text) => {
      const now = Date.now();
      // The same badge sits in frame for many frames; only act on the first.
      if (text === lastRef.current.text && now - lastRef.current.at < cooldownMs) return;
      lastRef.current = { text, at: now };
      decodeRef.current?.(text);
    },
    [cooldownMs],
  );

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      await scanner.clear();
    } catch {
      /* already torn down */
    }
    setStatus('idle');
  }, []);

  const start = useCallback(
    async (preferredId) => {
      if (busyRef.current || scannerRef.current) return;
      busyRef.current = true;
      setStatus('starting');
      setError(null);

      try {
        // getCameras() is what triggers the browser permission prompt.
        const devices = await Html5Qrcode.getCameras();
        if (!devices.length) throw new Error('NO_CAMERA');
        setCameras(devices);

        const stored = preferredId || safeGet(CAMERA_KEY);
        const device = devices.find((d) => d.id === stored) || devices[0];
        setCameraId(device.id);
        safeSet(CAMERA_KEY, device.id);
        setMirrored(/front|user|face/i.test(device.label || ''));

        const scanner = new Html5Qrcode(elementId, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        });
        scannerRef.current = scanner;

        await scanner.start(
          device.id,
          {
            fps: 15,
            qrbox: undefined, // whole frame, no crop
            disableFlip: false,
            aspectRatio: window.innerWidth / window.innerHeight,
          },
          handleDecode,
          () => {
            /* a frame with no code — the common case, stays silent */
          },
        );

        setStatus('running');
      } catch (err) {
        scannerRef.current = null;
        setError(describe(err));
        setStatus('error');
      } finally {
        busyRef.current = false;
      }
    },
    [elementId, handleDecode],
  );

  const switchCamera = useCallback(
    async (id) => {
      await stop();
      await start(id);
    },
    [start, stop],
  );

  useEffect(
    () => () => {
      stop();
    },
    [stop],
  );

  return { status, error, cameras, cameraId, mirrored, start, stop, switchCamera };
}

function describe(error) {
  const name = error?.name || '';
  const message = String(error?.message || error || '');

  if (message.includes('NO_CAMERA')) {
    return { title: 'No camera found', detail: 'Connect a webcam, then start the scanner again.' };
  }
  if (name === 'NotAllowedError' || /permission|denied/i.test(message)) {
    return {
      title: 'Camera permission is blocked',
      detail: 'Allow camera access in the address bar, then start the scanner again.',
    };
  }
  if (name === 'NotReadableError' || /in use|busy/i.test(message)) {
    return {
      title: 'The camera is busy',
      detail: 'Another app or tab is using it. Close that, then start the scanner again.',
    };
  }
  if (!window.isSecureContext) {
    return {
      title: 'Camera needs a secure connection',
      detail: 'Open ScanFlow over https or on localhost.',
    };
  }
  return { title: 'The camera did not start', detail: message || 'Try again in a moment.' };
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
