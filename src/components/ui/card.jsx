import { cn } from '@/lib/utils';

export function Card({ className, ...props }) {
  return (
    <div
      className={cn('rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm backdrop-blur', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div className={cn('p-4 pb-2', className)} {...props} />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3 className={cn('text-lg font-semibold text-white', className)} {...props} />
  );
}

export function CardContent({ className, ...props }) {
  return (
    <div className={cn('p-4 pt-0 text-sm text-slate-200', className)} {...props} />
  );
}
