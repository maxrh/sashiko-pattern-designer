import { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { ButtonGroup } from './button-group';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { Pipette, Plus, X } from 'lucide-react';

// Custom pointer component for saturation picker
const SaturationPointer = () => {
  return (
    <div className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-3 border-white shadow-[0_0px_4px_rgba(0,0,0,0.25)] transform -translate-x-1/2 -translate-y-1/2" />
  );
};

// Custom pointer component for hue slider
const HuePointer = () => {
  return (
    <div className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-3 border-white shadow-[0_0px_4px_rgba(0,0,0,0.25)] transform -translate-x-1/2 -translate-y-0.5"  />
  );
};

interface CustomColorPickerProps {
  hex?: string;
  rgb?: { r: number; g: number; b: number; a: number };
  hsl?: { h: number; s: number; l: number; a: number };
  onChange?: any;
  presetColors?: string[];
  onAddPreset?: (color: string) => void;
  onRemovePreset?: (color: string) => void;
  showAlpha?: boolean;
}

// Custom color picker component wrapped with CustomPicker HOC
const CustomColorPickerComponent = ({ 
  hex, 
  rgb,
  onChange, 
  presetColors, 
  onAddPreset, 
  onRemovePreset,
  showAlpha = false,
  ...props 
}: CustomColorPickerProps) => {
  const [hexInput, setHexInput] = useState('');
  const [showAlphaSlider, setShowAlphaSlider] = useState(false);

  // Only show alpha slider after rgb is initialized
  useEffect(() => {
    if (showAlpha && rgb) {
      // Small delay to ensure rgb is fully initialized
      const timer = setTimeout(() => setShowAlphaSlider(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShowAlphaSlider(false);
    }
  }, [showAlpha, rgb]);

  // Calculate full hex value including alpha when showAlpha is true
  const displayHex = showAlpha && rgb ? (() => {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    const alphaHex = Math.round((rgb.a !== undefined ? rgb.a : 1) * 255).toString(16).padStart(2, '0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}${alphaHex}`;
  })() : hex;

  // Update hexInput when displayHex changes
  useEffect(() => {
    if (displayHex) {
      setHexInput(displayHex);
    }
  }, [displayHex]);

  const isInPresets = presetColors && displayHex && presetColors.includes(displayHex);
  const canAddToPresets = onAddPreset && !isInPresets;
  const canRemoveFromPresets = onRemovePreset && isInPresets;

  const handleAddToPresets = () => {
    if (onAddPreset && displayHex) {
      onAddPreset(displayHex);
    }
  };

  const handleRemoveFromPresets = () => {
    if (onRemovePreset && displayHex) {
      onRemovePreset(displayHex);
    }
  };

  const handleChange = (data: any) => {
    if (onChange) {
      onChange(data);
    }
  };

  const handleEyeDropper = async () => {
    // Check if EyeDropper API is supported
    // @ts-ignore
    if (!window.EyeDropper) {
      alert('EyeDropper API is not supported in your browser');
      return;
    }

    try {
      // @ts-ignore
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      handleChange(result.sRGBHex);
    } catch (error) {
      // User cancelled or error occurred
      console.log('EyeDropper cancelled or error:', error);
    }
  };

  return (
    <div className="w-52 space-y-3">
      {/* Saturation/Brightness picker */}
      <div className='w-full space-y-1'>
      <div className="relative w-full aspect-3/2 rounded-md overflow-hidden">
        <Saturation {...props} onChange={handleChange} pointer={SaturationPointer} />
      </div>

      {/* Hue slider */}
      <div className="hue-slider relative w-full h-4 rounded-full">
        <Hue {...props} onChange={handleChange} direction="horizontal" pointer={HuePointer} />
      </div>

      {/* Alpha slider - only render after initialization to prevent rgb undefined error */}
      {showAlphaSlider && (
        <div className="alpha-slider relative w-full h-4 rounded-full overflow-hidden">
          <Alpha {...props} onChange={handleChange} pointer={HuePointer} />
        </div>
      )}
  </div>
      {/* Hex input */}
      <div className='flex items-center gap-2 '>
        <ButtonGroup>
          {/* Eyedropper button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleEyeDropper}
            className="h-9 w-auto pl-1.5 pr-3"
            title="Pick color from screen"
          >
            <div 
              className="w-6 h-6 rounded-full shrink-0 mr-1"
              style={{ backgroundColor: displayHex }}
            />
            <Pipette className="h-4 w-4" />
          </Button>

          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={() => {
              // Validate and apply hex color on blur
              const cleaned = hexInput.trim();
              const hexRegex = showAlpha 
                ? /^#?([0-9A-Fa-f]{8})$/  // 8-char hex with alpha
                : /^#?([0-9A-Fa-f]{6})$/; // 6-char hex without alpha
              
              const match = cleaned.match(hexRegex);
              if (match) {
                const normalizedHex = `#${match[1]}`;
                handleChange(normalizedHex);
              } else {
                // Invalid hex, reset to current value
                setHexInput(displayHex || '');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="h-9 w-full rounded-r-md border border-l-0 border-input bg-transparent px-3 py-1 text-sm font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={showAlpha ? "#RRGGBBAA" : "#RRGGBB"}
          />
        </ButtonGroup>
      </div>

      {/* Preset colors */}
      {presetColors && presetColors.length > 0 && (
        <div className="p-1.5">
          <div className="grid grid-cols-6 gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                className={`aspect-square w-full rounded-full hover:scale-110 transition-transform ${
                  color.toLowerCase() === displayHex?.toLowerCase() 
                    ? 'ring-2 ring-ring/20 ring-offset-2 ring-offset-background' 
                    : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleChange(color)}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add/Remove preset buttons */}
      {(onAddPreset || onRemovePreset) && (
        <div className="">
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
    </div>
  );
};

// Wrap with CustomPicker HOC
const WrappedColorPicker = CustomPicker(CustomColorPickerComponent);

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  presetColors?: string[];
  onAddPreset?: (color: string) => void;
  onRemovePreset?: (color: string) => void;
  tooltip?: string;
  showAlpha?: boolean;
}

export function ColorPicker({ 
  value, 
  onChange, 
  presetColors, 
  onAddPreset, 
  onRemovePreset, 
  tooltip,
  showAlpha = false,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Mark as client-side after hydration to prevent SSR mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Parse color value and extract alpha if present
  const parseColorWithAlpha = (colorValue: string) => {
    if (showAlpha && colorValue.length === 9) {
      // 8-char hex with alpha
      const baseHex = colorValue.slice(0, 7); // #RRGGBB
      const alpha = parseInt(colorValue.slice(7, 9), 16) / 255;
      return { hex: baseHex, alpha };
    }
    return { hex: colorValue, alpha: 1 };
  };

  const { hex: baseHex, alpha: initialAlpha } = parseColorWithAlpha(value);
  const [currentAlpha, setCurrentAlpha] = useState(initialAlpha);

  // Update alpha when value prop changes
  useEffect(() => {
    const { alpha } = parseColorWithAlpha(value);
    setCurrentAlpha(alpha);
  }, [value, showAlpha]);

  const colorValue = baseHex;

  const handleColorChange = (color: any) => {
    // Update alpha if changed
    if (color.rgb && color.rgb.a !== undefined) {
      setCurrentAlpha(color.rgb.a);
    }

    // When showAlpha is true, use 8-char hex with alpha, otherwise use 6-char hex
    if (showAlpha && color.rgb) {
      const { r, g, b } = color.rgb;
      const a = color.rgb.a !== undefined ? color.rgb.a : currentAlpha;
      const toHex = (n: number) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
      const hex8 = `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
      onChange(hex8);
    } else if (color.hex) {
      onChange(color.hex);
    }
  };

  const triggerButton = (
    <PopoverTrigger asChild>
      <Button
        key={value}
        type="button"
        className="aspect-square h-9 p-0 border border-input rounded-l-md rounded-r-none hover:opacity-90 transition-opacity outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={isClient ? { backgroundColor: value, backgroundImage: 'none' } : {}}
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
        {isClient && (
          <WrappedColorPicker
            color={colorValue}
            onChange={handleColorChange}
            presetColors={presetColors}
            onAddPreset={onAddPreset}
            onRemovePreset={onRemovePreset}
            showAlpha={showAlpha}
          />
        )}
        {!isClient && (
          <div className="w-52 h-64 flex items-center justify-center">Loading...</div>
        )}
      </PopoverContent>
    </Popover>
  );
}
