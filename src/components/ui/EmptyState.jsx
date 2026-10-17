import { cn } from '../../lib/utils';

/** An empty screen is an invitation to act, so it always carries the action. */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      {Icon && (
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-black/[0.05] text-black/50 dark:bg-white/10 dark:text-white/50">
          <Icon size={22} />
        </span>
      )}
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {description && <p className="muted mt-1.5 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
