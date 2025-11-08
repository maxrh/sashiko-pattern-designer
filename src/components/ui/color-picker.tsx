import { useState, useEffect, Suspense, lazy } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

// Lazy load SketchPicker to avoid SSR issues
// @ts-ignore
const SketchPicker = lazy(() => 
  import('react-color').then(module => ({ default: module.SketchPicker }))
);

interface ColorPickerComponentProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
}

export function ColorPickerComponent({ value, onChange, label, id }: ColorPickerComponentProps) {
  const [open, setOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const [isClient, setIsClient] = useState(false);
  
  // Mark as client-side after hydration to prevent SSR mismatch
  useEffect(() => {
    setIsClient(true);
    setDisplayValue(value);
  }, []);
  
  // Update displayValue when value prop changes (e.g., from localStorage)
  useEffect(() => {
    if (isClient) {
      setDisplayValue(value);
    }
  }, [value, isClient]);

  const handleColorChange = (color: any) => {
    // Convert RGBA to hex with alpha (8-char hex)
    const { r, g, b, a } = color.rgb;
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    const alphaHex = toHex(a * 255);
    const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
    onChange(hexColor);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium leading-none">
          {label}
        </Label>
      )}
      <div className="flex gap-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              key={displayValue}
              type="button"
              className="aspect-square h-9 p-0 border border-input border-r-0 rounded-none rounded-l-lg hover:opacity-90 transition-opacity outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={isClient ? { backgroundColor: displayValue, backgroundImage: 'none' } : {}}
              aria-label="Pick color"
            >
              <span className="sr-only">Pick color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-0" align="start">
            <Suspense fallback={<div className="w-52 h-64 flex items-center justify-center">Loading...</div>}>
              <SketchPicker
                color={displayValue}
                onChange={handleColorChange}
              />
            </Suspense>
          </PopoverContent>
        </Popover>
        <Input
          id={id}
          type="text"
          value={displayValue.toUpperCase()}
          onChange={(e) => {
            const newValue = e.target.value;
            const pattern = /^#[0-9A-F]{0,8}$/i;
            if (pattern.test(newValue)) {
              onChange(newValue);
            }
          }}
          className="flex-1 text-xs uppercase font-mono rounded-none rounded-r-lg border-l-0"
          placeholder="#000000FF"
          maxLength={9}
        />
      </div>
    </div>
  );
}
