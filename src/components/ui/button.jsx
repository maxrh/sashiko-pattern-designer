import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

const variants = {
  default: 'bg-sky-500 text-white hover:bg-sky-400 focus-visible:ring-sky-300',
  outline: 'border border-slate-600 text-slate-100 hover:bg-slate-800',
  ghost: 'text-slate-200 hover:bg-slate-800',
  destructive: 'bg-rose-500 text-white hover:bg-rose-400 focus-visible:ring-rose-300',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
};

const sizes = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

export const Button = forwardRef(function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-60',
        variants[variant] ?? variants.default,
        sizes[size] ?? sizes.default,
        className
      )}
      {...props}
    />
  );
});
