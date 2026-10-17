import { useEffect } from 'react';

/** Keeps the laptop awake while the door is open. Silently unsupported on Safari. */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;
    let sentinel = null;
    let cancelled = false;

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch {
        /* denied or battery saver */
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) request();
    };

    request();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      sentinel?.release?.().catch(() => {});
    };
  }, [active]);
}
