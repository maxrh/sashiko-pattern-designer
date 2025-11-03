import { forwardRef } from 'react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
});
