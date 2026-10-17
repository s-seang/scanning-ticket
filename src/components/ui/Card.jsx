import { cn } from '../../lib/utils';

export function Card({ className, as: Tag = 'div', ...props }) {
  return <Tag className={cn('surface', className)} {...props} />;
}

export function CardHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
        {description && <p className="muted mt-1 max-w-prose text-sm">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Divider({ className }) {
  return <hr className={cn('hairline border-t', className)} />;
}
