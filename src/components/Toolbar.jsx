import { MousePointer, Edit3, Hand, Grip, Eye, EyeOff, Undo2, Redo2, ChevronDown } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { ButtonGroup, ButtonGroupSeparator } from './ui/button-group';
import { Button } from './ui/button';
import { SidebarTrigger } from './ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { ColorPicker } from './ui/color-picker';
import { STITCH_WIDTHS } from './Stitches.jsx';
import { formatValueNumber } from '../lib/unitConverter.js';

export function Toolbar({
  drawingMode,
  onModeChange,
  repeatPattern,
  onRepeatPatternChange,
  selectedStitchColor,
  onSelectedStitchColorChange,
  colorPresets,
  onAddColorPreset,
  onRemoveColorPreset,
  stitchSize,
  onStitchSizeChange,
  stitchWidth,
  onStitchWidthChange,
  gapSize,
  onGapSizeChange,
  showGrid,
  onShowGridChange,
  displayUnit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  // Memoize gap size callback to prevent recreating on every render
  const handleGapSizeChange = useCallback((value) => {
    onGapSizeChange(value[0]);
  }, [onGapSizeChange]);

  // Memoize display values to avoid recalculating on every render
  const gapDisplayValue = useMemo(() => {
    const value = formatValueNumber(gapSize, displayUnit, displayUnit === 'cm' ? 2 : 1);
    // Format to always show decimals
    if (displayUnit === 'mm') {
      return Number(value).toFixed(1);
    } else if (displayUnit === 'cm') {
      return Number(value).toFixed(2);
    }
    return value;
  }, [gapSize, displayUnit]);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        <ButtonGroup>
          <SidebarTrigger />
        </ButtonGroup>

        <ButtonGroupSeparator />

        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={drawingMode === 'select' ? 'default' : 'outline'}
                size="icon"
                onClick={() => onModeChange('select')}
              >
                <MousePointer />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Select Tool (V)</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={drawingMode === 'draw' ? 'default' : 'outline'}
                size="icon"
                onClick={() => onModeChange('draw')}
              >
                <Edit3 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pen Tool (P)</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={drawingMode === 'pan' ? 'default' : 'outline'}
                size="icon"
                onClick={() => onModeChange('pan')}
              >
                <Hand />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pan Tool (Spacebar)</p>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>

        <ButtonGroupSeparator />

        

        <ButtonGroup>

          <ColorPicker
            value={selectedStitchColor}
            onChange={onSelectedStitchColorChange}
            presetColors={colorPresets}
            onAddPreset={onAddColorPreset}
            onRemovePreset={onRemoveColorPreset}
            tooltip="Stitch Color"
          />

          <Select value={stitchSize} onValueChange={onStitchSizeChange}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger className="hover:bg-accent hover:text-accent-foreground">
                  <SelectValue />
                </SelectTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stitch Length</p>
              </TooltipContent>
            </Tooltip>
            <SelectContent onCloseAutoFocus={e => e.preventDefault()}>
              <SelectItem value="small">
                Small (≈{displayUnit === 'px' ? '5px' : displayUnit === 'mm' ? '1.3mm' : '0.13cm'})
              </SelectItem>
              <SelectItem value="medium">
                Medium (≈{displayUnit === 'px' ? '16px' : displayUnit === 'mm' ? '4.2mm' : '0.42cm'})
              </SelectItem>
              <SelectItem value="large">
                Large (≈{displayUnit === 'px' ? '28px' : displayUnit === 'mm' ? '7.4mm' : '0.74cm'})
              </SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="font-normal justify-between">
                    {`${gapDisplayValue}${displayUnit}`}
                    <ChevronDown className="text-muted-foreground h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stitch Gap</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Slider
                    id="gap-size-slider"
                    min={1}
                    max={30}
                    step={1}
                    value={[gapSize]}
                    onValueChange={handleGapSizeChange}
                  />
               
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={stitchWidth} onValueChange={onStitchWidthChange}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger className="hover:bg-accent hover:text-accent-foreground">
                  <SelectValue>
                    {stitchWidth === 'thin' && <span className="block w-4 bg-foreground rounded-full" style={{ height: `${STITCH_WIDTHS.thin}px` }} />}
                    {stitchWidth === 'normal' && <span className="block w-4 bg-foreground rounded-full" style={{ height: `${STITCH_WIDTHS.normal}px` }} />}
                    {stitchWidth === 'bold' && <span className="block w-4 bg-foreground rounded-full" style={{ height: `${STITCH_WIDTHS.bold}px` }} />}
                  </SelectValue>
                </SelectTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stitch Width</p>
              </TooltipContent>
            </Tooltip>
            <SelectContent onCloseAutoFocus={e => e.preventDefault()}>
              <SelectItem value="thin">
                <div className="flex items-center gap-2">
                  <span className="block w-4 bg-foreground rounded-full" style={{ height: `${STITCH_WIDTHS.thin}px` }} />
                  <span>Thin</span>
                </div>
              </SelectItem>
              <SelectItem value="normal">
                <div className="flex items-center gap-2">
                  <span className="block w-4 bg-foreground rounded-full" style={{ height: `${STITCH_WIDTHS.normal}px` }} />
                  <span>Medium</span>
                </div>
              </SelectItem>
              <SelectItem value="bold">
                <div className="flex items-center gap-2">
                  <span className="block w-4 bg-foreground rounded-full" style={{ height: `${STITCH_WIDTHS.bold}px` }} />
                  <span>Bold</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={repeatPattern ? 'default' : 'outline'}
                size="icon"
                onClick={() => onRepeatPatternChange(!repeatPattern)}
              >
                <Grip />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Repeat Pattern (R)</p>
            </TooltipContent>
          </Tooltip>
          
          
        </ButtonGroup>

        <ButtonGroupSeparator />

        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo (Ctrl+Y)</p>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>

        <ButtonGroupSeparator />

        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showGrid ? 'default' : 'outline'}
                size="icon"
                onClick={() => onShowGridChange(!showGrid)}
              >
                {showGrid ? <Eye /> : <EyeOff />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show/Hide Grid (H)</p>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </div>
    </TooltipProvider>
  );
}
