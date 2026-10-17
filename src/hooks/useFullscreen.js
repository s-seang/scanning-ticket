import { useCallback, useEffect, useState } from 'react';

/**
 * Kiosk mode. F11 is the browser's own shortcut and can't be intercepted
 * reliably, so we offer an in-page control that uses the Fullscreen API and
 * keep F as a shortcut once the scanner has focus.
 */
export function useFullscreen(targetRef) {
  const [isFullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const enter = useCallback(async () => {
    const node = targetRef?.current || document.documentElement;
    try {
      await node.requestFullscreen?.({ navigationUI: 'hide' });
      await screen.orientation?.lock?.('landscape').catch(() => {});
    } catch {
      /* the browser refused — the page still works windowed */
    }
  }, [targetRef]);

  const exit = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => (document.fullscreenElement ? exit() : enter()), [enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}
