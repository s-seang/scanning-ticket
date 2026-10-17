import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { XIcon } from './Icons';

/**
 * A dialog that behaves: escape closes it, the backdrop closes it, focus starts
 * inside and stays inside, and the page behind it stops scrolling.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    const timer = setTimeout(() => {
      const target = panelRef.current?.querySelector('[data-autofocus], input, button');
      target?.focus();
    }, 20);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      clearTimeout(timer);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px] dark:bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full animate-rise overflow-hidden rounded-t-xl3 bg-white shadow-lift sm:rounded-xl3 dark:bg-[#0d0d0d]',
          'max-h-[92vh] overflow-y-auto',
          size === 'sm' && 'sm:max-w-sm',
          size === 'md' && 'sm:max-w-lg',
          size === 'lg' && 'sm:max-w-2xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
          <div>
            <h2 className="text-title font-semibold">{title}</h2>
            {description && <p className="muted mt-1.5 text-sm">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <XIcon />
          </Button>
        </div>

        <div className="p-5 sm:p-6">{children}</div>

        {footer && (
          <div className="hairline flex flex-wrap justify-end gap-2 border-t bg-black/[0.02] p-4 sm:px-6 dark:bg-white/[0.03]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  loading,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Keep it</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="muted text-sm">This cannot be undone.</p>
    </Modal>
  );
}
