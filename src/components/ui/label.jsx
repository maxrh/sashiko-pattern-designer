import { cn } from '@/lib/utils';

export function Label({ className, ...props }) {
  return <label className={cn('text-xs font-medium uppercase tracking-wide text-slate-400', className)} {...props} />;
}
