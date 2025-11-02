import { Children, cloneElement, createContext, useContext } from 'react';
import { cn } from '../../lib/utils.js';

const RadioGroupContext = createContext(null);

export function RadioGroup({ value, onValueChange, className, children }) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn('flex gap-2', className)}>
        {Children.map(children, (child) => {
          if (!child) return null;
          return cloneElement(child, {
            checked: child.props.value === value,
          });
        })}
      </div>
    </RadioGroupContext.Provider>
  );
}

export function RadioGroupItem({ value, checked, children, className, ...props }) {
  const ctx = useContext(RadioGroupContext);
  const isChecked = checked ?? ctx?.value === value;

  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition hover:border-slate-500',
        isChecked && 'border-sky-400 bg-slate-800/70 text-white',
        className
      )}
    >
      <input
        type="radio"
        value={value}
        checked={isChecked}
        onChange={() => ctx?.onValueChange?.(value)}
        className="h-4 w-4 cursor-pointer accent-sky-500"
        {...props}
      />
      <span>{children}</span>
    </label>
  );
}
