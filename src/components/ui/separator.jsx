import { cn } from '../../lib/utils.js';

export function Separator({ className, orientation = 'horizontal' }) {
  return (
    <div
      className={cn(
        'bg-slate-800',
        orientation === 'vertical' ? 'w-px h-full' : 'h-px w-full',
        className
      )}
    />
  );
}
