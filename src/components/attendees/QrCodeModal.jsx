import { useEffect, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { DownloadIcon } from '../ui/Icons';
import { buildPayload, toCanvas, toDataUrl } from '../../lib/qr';
import { downloadBlob, slugify } from '../../lib/utils';

/** One attendee's badge, big enough to scan straight off the screen. */
export function QrCodeModal({ open, onClose, attendee, event }) {
  const canvasRef = useRef(null);
  const [payload, setPayload] = useState('');

  useEffect(() => {
    if (!open || !attendee) return;
    const value = attendee.qrCode || buildPayload(event.id, attendee.id);
    setPayload(value);
    // The canvas mounts with the modal, so paint on the next frame.
    const id = requestAnimationFrame(() => {
      if (canvasRef.current) toCanvas(canvasRef.current, value, { width: 288 }).catch(() => {});
    });
    return () => cancelAnimationFrame(id);
  }, [open, attendee, event]);

  const download = async () => {
    const dataUrl = await toDataUrl(payload);
    const blob = await (await fetch(dataUrl)).blob();
    downloadBlob(blob, `${slugify(attendee.name)}-qr.png`);
  };

  if (!attendee) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={attendee.name}
      description={attendee.email || event.name}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={download}>
            <DownloadIcon size={16} />
            Download PNG
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-xl2 bg-white p-4 shadow-card">
          <canvas ref={canvasRef} width={288} height={288} className="block h-72 w-72" />
        </div>
        <code className="muted break-all text-center font-mono text-[12px]">{payload}</code>
      </div>
    </Modal>
  );
}
