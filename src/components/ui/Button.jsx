import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const VARIANTS = {
  // Ink on paper, inverted in dark mode — the one primary action per view.
  primary:
    'bg-black text-white hover:bg-black/85 active:bg-black dark:bg-white dark:text-black dark:hover:bg-white/85',
  // Carries the event's own colour. Used where the event is the subject.
  accent: 'bg-accent text-white hover:brightness-110 active:brightness-95',
  subtle:
    'border border-black/12 bg-white text-black hover:bg-black/[0.04] dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10',
  ghost:
    'text-black/70 hover:bg-black/[0.05] hover:text-black dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white',
  danger: 'bg-fail text-white hover:brightness-110',
};

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-[15px]',
  icon: 'h-10 w-10 rounded-xl justify-center',
};

export const Button = forwardRef(function Button(
  { variant = 'subtle', size = 'md', className, loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition',
        'disabled:pointer-events-none disabled:opacity-45',
        'active:scale-[0.985] motion-reduce:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="-ml-0.5" />}
      {children}
    </button>
  );
});

export function Spinner({ className }) {
  return (
    <span
      className={cn(
        'h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent',
        className,
      )}
      aria-hidden="true"
    />
  );
}
