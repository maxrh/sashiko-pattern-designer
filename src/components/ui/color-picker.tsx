import { useState, useEffect, Suspense, lazy } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

// Lazy load SketchPicker to avoid SSR issues
// @ts-ignore
const SketchPicker = lazy(() => 
  import('react-color').then(module => ({ default: module.SketchPicker }))
);

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  presetColors?: string[];
  onAddPreset?: (color: string) => void;
  onRemovePreset?: (color: string) => void;
  tooltip?: string;
}

export function ColorPicker({ value, onChange, presetColors, onAddPreset, onRemovePreset, tooltip }: ColorPickerProps) {
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
    // Convert RGB to hex (6-char hex, no alpha)
    const { r, g, b } = color.rgb;
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    onChange(hexColor);
  };

  const handleAddToPresets = () => {
    if (onAddPreset && displayValue) {
      onAddPreset(displayValue);
    }
  };

  const handleRemoveFromPresets = () => {
    if (onRemovePreset && displayValue) {
      onRemovePreset(displayValue);
    }
  };

  const isInPresets = presetColors && presetColors.includes(displayValue);
  const canAddToPresets = onAddPreset && !isInPresets;
  const canRemoveFromPresets = onRemovePreset && isInPresets;

  const triggerButton = (
    <PopoverTrigger asChild>
      <Button
        key={displayValue}
        type="button"
        className="aspect-square h-9 p-0 border border-input rounded-l-md rounded-r-none hover:opacity-90 transition-opacity outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={isClient ? { backgroundColor: displayValue, backgroundImage: 'none' } : {}}
        aria-label="Pick color"
      >
        <span className="sr-only">Pick color</span>
      </Button>
    </PopoverTrigger>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            {triggerButton}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        triggerButton
      )}
      <PopoverContent 
        className="w-auto p-4 rounded-md border shadow-md" 
        align="start"
        sideOffset={5}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Suspense fallback={<div className="w-52 h-64 flex items-center justify-center">Loading...</div>}>
          <SketchPicker
            color={displayValue}
            onChange={handleColorChange}
            disableAlpha={true}
            presetColors={presetColors}
            styles={{
              default: {
                picker: {
                  boxShadow: 'none',
                  border: 'none',
                  borderRadius: '0',
                  padding: '0',
                },
              },
            }}
          />
        </Suspense>
        {(onAddPreset || onRemovePreset) && (
          <div className="pt-2 border-t border-border ">
            {canAddToPresets && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddToPresets}
                className="w-full"
              >
                Add to Presets
              </Button>
            )}
            {canRemoveFromPresets && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveFromPresets}
                className="w-full"
              >
                Remove from Presets
              </Button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
