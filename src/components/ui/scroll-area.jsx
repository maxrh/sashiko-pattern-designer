import { forwardRef } from 'react';
import * as React from 'react';
import { cn } from '@/lib/utils';

const ScrollArea = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <style jsx>{`
      .scroll-content::-webkit-scrollbar {
        width: 8px;
      }
      .scroll-content::-webkit-scrollbar-track {
        background: rgba(30, 41, 59, 0.5);
        border-radius: 9999px;
      }
      .scroll-content::-webkit-scrollbar-thumb {
        background: rgb(71, 85, 105);
        border-radius: 9999px;
      }
      .scroll-content::-webkit-scrollbar-thumb:hover {
        background: rgb(100, 116, 139);
      }
      .scroll-content {
        scrollbar-width: thin;
        scrollbar-color: rgb(71, 85, 105) rgba(30, 41, 59, 0.5);
      }
    `}</style>
    <div className="scroll-content h-full w-full overflow-y-auto">
      <div className="p-4">{children}</div>
    </div>
  </div>
));

ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
