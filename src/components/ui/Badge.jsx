import { cn } from '../../lib/utils';

const TONES = {
  neutral: 'bg-black/[0.06] text-black/70 dark:bg-white/10 dark:text-white/70',
  pass: 'bg-pass/12 text-pass',
  fail: 'bg-fail/12 text-fail',
  accent: 'bg-accent/12 text-accent',
};

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = 'neutral', pulse }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {pulse && (
        <span
          className={cn(
            'absolute inset-0 animate-pulse-ring rounded-full',
            tone === 'pass' ? 'bg-pass' : tone === 'fail' ? 'bg-fail' : 'bg-accent',
          )}
        />
      )}
      <span
        className={cn(
          'relative h-2 w-2 rounded-full',
          tone === 'pass' ? 'bg-pass' : tone === 'fail' ? 'bg-fail' : 'bg-accent',
        )}
      />
    </span>
  );
}
