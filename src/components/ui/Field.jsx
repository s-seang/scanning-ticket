import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

const CONTROL =
  'w-full rounded-xl border border-black/12 bg-white px-3.5 text-sm text-black placeholder:text-black/35 ' +
  'transition focus:border-transparent dark:border-white/20 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/35';

export function Field({ label, hint, error, children, className, htmlFor }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[13px] text-fail">{error}</p>
      ) : (
        hint && <p className="muted text-[13px]">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, hint, error, className, id, ...props }, ref) {
  const generated = useId();
  const inputId = id || generated;
  const control = (
    <input
      ref={ref}
      id={inputId}
      className={cn(CONTROL, 'h-10', error && 'border-fail', className)}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    />
  );
  if (!label && !hint && !error) return control;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId}>
      {control}
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea({ label, hint, error, className, id, ...props }, ref) {
  const generated = useId();
  const inputId = id || generated;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId}>
      <textarea ref={ref} id={inputId} className={cn(CONTROL, 'py-2.5', className)} {...props} />
    </Field>
  );
});

export const Select = forwardRef(function Select({ label, hint, className, id, children, ...props }, ref) {
  const generated = useId();
  const inputId = id || generated;
  const control = (
    <select ref={ref} id={inputId} className={cn(CONTROL, 'h-10 pr-8', className)} {...props}>
      {children}
    </select>
  );
  if (!label && !hint) return control;
  return (
    <Field label={label} hint={hint} htmlFor={inputId}>
      {control}
    </Field>
  );
});
