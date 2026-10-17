import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { cn } from '../lib/utils';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, { tone = 'neutral', duration = 4000 } = {}) => {
      const id = (counter.current += 1);
      setToasts((list) => [...list, { id, message, tone }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (message, options) => push(message, { ...options, tone: 'pass' }),
      error: (message, options) => push(message, { ...options, tone: 'fail' }),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismiss(toast.id)}
            className={cn(
              'pointer-events-auto max-w-sm animate-rise rounded-xl2 px-4 py-3 text-left text-sm shadow-lift',
              toast.tone === 'pass' && 'bg-pass text-white',
              toast.tone === 'fail' && 'bg-fail text-white',
              toast.tone === 'neutral' && 'bg-black text-white dark:bg-white dark:text-black',
            )}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
