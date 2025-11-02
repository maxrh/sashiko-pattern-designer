import { createContext, useContext, useMemo, useState } from 'react';
import { cn } from '../../lib/utils.js';

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value: valueProp, onValueChange, className, children }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = valueProp ?? internalValue;

  const contextValue = useMemo(() => ({
    value: currentValue,
    onSelect: (nextValue) => {
      if (valueProp === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
  }), [currentValue, onValueChange, valueProp]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('flex flex-col', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-slate-900/60 p-1', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children }) {
  const ctx = useContext(TabsContext);
  const isActive = ctx?.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx?.onSelect?.(value)}
      className={cn(
  'min-w-20 rounded-md px-3 py-2 text-sm font-medium transition',
        isActive
          ? 'bg-slate-800 text-white shadow'
          : 'text-slate-400 hover:text-slate-200',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }) {
  const ctx = useContext(TabsContext);
  if (ctx?.value !== value) return null;

  return (
    <div className={cn('mt-4', className)}>
      {children}
    </div>
  );
}
