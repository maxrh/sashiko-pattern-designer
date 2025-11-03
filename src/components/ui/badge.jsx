import { cn } from '@/lib/utils';

export function Badge({ className, variant = 'default', ...props }) {
  const variants = {
    default: 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40',
    outline: 'border border-slate-700 text-slate-300',
    success: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide',
        variants[variant] ?? variants.default,
        className
      )}
      {...props}
    />
  );
}
