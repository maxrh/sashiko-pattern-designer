import { useState, useEffect, useRef, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { ButtonGroup } from './button-group';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { Pipette, Plus, X } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void; // Called when color picker closes
  onOpenChange?: (open: boolean) => void; // Called when open state changes
  presetColors?: string[];
  onAddPreset?: (color: string) => void;
  onRemovePreset?: (color: string) => void;
  tooltip?: string;
  showAlpha?: boolean;
}

// Convert hex to RGBA
function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: result[4] ? parseInt(result[4], 16) / 255 : 1,
  };
}

// Convert RGBA to hex
function rgbaToHex(r: number, g: number, b: number, a: number, includeAlpha: boolean): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  if (includeAlpha) {
    const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / diff + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / diff + 2) / 6; break;
      case b: h = ((r - g) / diff + 4) / 6; break;
    }
  }

  return { h, s, v };
}

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function ColorPicker({
  value,
  onChange,
  onClose,
  onOpenChange,
  presetColors,
  onAddPreset,
  onRemovePreset,
  tooltip,
  showAlpha = false,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const rgba = hexToRgba(value);
  const hsv = rgbToHsv(rgba.r, rgba.g, rgba.b);
  
  const [hue, setHue] = useState(hsv.h);
  const [saturation, setSaturation] = useState(hsv.s);
  const [brightness, setBrightness] = useState(hsv.v);
  const [alpha, setAlpha] = useState(rgba.a);
  const [hexInput, setHexInput] = useState(value);

  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update internal state when value prop changes
  useEffect(() => {
    const rgba = hexToRgba(value);
    const hsv = rgbToHsv(rgba.r, rgba.g, rgba.b);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setBrightness(hsv.v);
    setAlpha(rgba.a);
    setHexInput(value);
  }, [value]);

  // Update color when HSV/Alpha changes
  const updateColor = useCallback((h: number, s: number, v: number, a: number) => {
    const rgb = hsvToRgb(h, s, v);
    const hex = rgbaToHex(rgb.r, rgb.g, rgb.b, a, showAlpha);
    onChange(hex);
  }, [onChange, showAlpha]);

  const handleSaturationMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = saturationRef.current?.getBoundingClientRect();
    if (!rect) return;

    const handleMove = (e: MouseEvent) => {
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      const s = x / rect.width;
      const v = 1 - y / rect.height;
      setSaturation(s);
      setBrightness(v);
      updateColor(hue, s, v, alpha);
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    handleMove(e.nativeEvent);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect) return;

    const handleMove = (e: MouseEvent) => {
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const h = x / rect.width;
      setHue(h);
      updateColor(h, saturation, brightness, alpha);
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    handleMove(e.nativeEvent);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handleAlphaMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = alphaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const handleMove = (e: MouseEvent) => {
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const a = x / rect.width;
      setAlpha(a);
      updateColor(hue, saturation, brightness, a);
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    handleMove(e.nativeEvent);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexInput(e.target.value);
  };

  const handleHexInputBlur = () => {
    const cleaned = hexInput.trim();
    const hexRegex = showAlpha 
      ? /^#?([0-9A-Fa-f]{8})$/
      : /^#?([0-9A-Fa-f]{6})$/;
    
    const match = cleaned.match(hexRegex);
    if (match) {
      const normalizedHex = `#${match[1]}`;
      onChange(normalizedHex);
    } else {
      setHexInput(value);
    }
  };

  const handleEyeDropper = async () => {
    // @ts-ignore
    if (!window.EyeDropper) {
      alert('EyeDropper API is not supported in your browser');
      return;
    }

    try {
      // @ts-ignore
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      onChange(result.sRGBHex);
    } catch (error) {
      console.log('EyeDropper cancelled or error:', error);
    }
  };

  const currentColor = rgbaToHex(
    hsvToRgb(hue, saturation, brightness).r,
    hsvToRgb(hue, saturation, brightness).g,
    hsvToRgb(hue, saturation, brightness).b,
    alpha,
    showAlpha
  );

  const saturationBgColor = rgbaToHex(hsvToRgb(hue, 1, 1).r, hsvToRgb(hue, 1, 1).g, hsvToRgb(hue, 1, 1).b, 1, false);
  const isInPresets = presetColors && presetColors.some(c => c.toLowerCase() === currentColor.toLowerCase());

  const triggerButton = (
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant='outline'
        className="aspect-square h-9 p-0 rounded-md"
        // style={isClient ? { backgroundColor: value, backgroundImage: 'none' } : {}}
        aria-label="Pick color"
      >
        <span className="sr-only">Pick color</span>
        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: value }} />
      </Button>
    </PopoverTrigger>
  );

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      // Call external onOpenChange handler
      if (onOpenChange) {
        onOpenChange(newOpen);
      }
      // Call onClose when popover closes
      if (!newOpen && onClose) {
        onClose();
      }
    }}>
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
        <div className="w-52 space-y-3">
          {/* Saturation/Brightness picker */}
          <div className="space-y-2">
            <div
              ref={saturationRef}
              className="relative w-full aspect-3/2 rounded-md overflow-hidden cursor-crosshair"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${saturationBgColor})`,
              }}
              onMouseDown={handleSaturationMouseDown}
            >
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
                style={{
                  left: `${saturation * 100}%`,
                  top: `${(1 - brightness) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>

            {/* Hue slider */}
            <div
              ref={hueRef}
              className="relative w-full h-3 rounded-full cursor-pointer"
              style={{
                background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
              }}
              onMouseDown={handleHueMouseDown}
            >
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
                style={{
                  left: `${hue * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>

            {/* Alpha slider */}
            {showAlpha && (
              <div
                ref={alphaRef}
                className="relative w-full h-3 rounded-full cursor-pointer overflow-hidden"
                style={{
                  background: `linear-gradient(to right, transparent, ${rgbaToHex(hsvToRgb(hue, saturation, brightness).r, hsvToRgb(hue, saturation, brightness).g, hsvToRgb(hue, saturation, brightness).b, 1, false)}), repeating-conic-gradient(#dfdfdf 0% 25%, transparent 0% 50%) 50% / 8px 8px`,
                }}
                onMouseDown={handleAlphaMouseDown}
              >
                <div
                  className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
                  style={{
                    left: `${alpha * 100}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Hex input */}
          <div className="flex items-center gap-2">
            <ButtonGroup>
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
                  style={{ backgroundColor: currentColor }}
                />
                <Pipette className="h-4 w-4" />
              </Button>

              <input
                type="text"
                value={hexInput}
                onChange={handleHexInputChange}
                onBlur={handleHexInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="flex h-9 w-full uppercase rounded-r-md border border-l-0 border-input bg-transparent px-3 py-1 text-sm font-mono transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/10"
                placeholder={showAlpha ? "#RRGGBBAA" : "#RRGGBB"}
              />
            </ButtonGroup>
          </div>

          {/* Preset colors */}
          {presetColors && presetColors.length > 0 && (
            <div className="p-1.5">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, auto)', gridTemplateRows: 'auto', justifyContent: 'space-between', rowGap: '0.5rem' }}>
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full hover:scale-110 transition-transform ${
                      color.toLowerCase() === currentColor.toLowerCase()
                        ? 'ring-2 ring-ring/20 ring-offset-2 ring-offset-background' 
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => onChange(color)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add/Remove preset buttons */}
          {(onAddPreset || onRemovePreset) && (
            <div className="flex gap-2">
              {onAddPreset && !isInPresets && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onAddPreset(currentColor)}
                  className="flex-1 font-normal"
                >
                  Add to Swatches
                </Button>
              )}
              {onRemovePreset && isInPresets && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onRemovePreset(currentColor)}
                  className="flex-1 font-normal"
                >
                  Remove from Swatches
                </Button>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
