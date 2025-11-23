import { MousePointer, Edit3, Hand, Grip, Eye, EyeOff, Undo2, Redo2, ChevronDown, Settings2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { ButtonGroup, ButtonGroupSeparator } from './ui/button-group';
import { Button } from './ui/button';
import { SidebarTrigger } from './ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { ColorPicker } from './ui/color-picker';
import { STITCH_WIDTHS } from './Stitches.jsx';
import { formatValueNumber } from '../lib/unitConverter.js';

export function Toolbar({
  drawingMode,
  onModeChange,
  repeatPattern,
  onRepeatPatternChange,
  selectedStitchColor,
  tempStitchColor,
  onSelectedStitchColorChange,
  onColorPickerOpenChange,
  colorPresets,
  onAddColorPreset,
  onRemoveColorPreset,
  stitchSize,
  tempStitchSize,
  onStitchSizeChange,
  stitchWidth,
  tempStitchWidth,
  onStitchWidthChange,
  tempCurvature,
  onCurvatureChange,
  onCurvatureSliderStart,
  onCurvatureSliderCommit,
  gapSize,
  tempGapSize,
  onGapSizeChange,
  onGapSliderStart,
  onGapSliderCommit,
  showGrid,
  onShowGridChange,
  displayUnit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedStitch,
}) {
  // Memoize gap size callback to prevent recreating on every render
  const handleGapSizeChange = useCallback((value) => {
    onGapSizeChange(value[0]);
  }, [onGapSizeChange]);

  // Memoize display values to avoid recalculating on every render
  const gapDisplayValue = useMemo(() => {
    const currentGap = tempGapSize ?? gapSize;
    const value = formatValueNumber(currentGap, displayUnit, displayUnit === 'cm' ? 2 : 1);
    // Format to always show decimals
    if (displayUnit === 'mm') {
      return Number(value).toFixed(1);
    } else if (displayUnit === 'cm') {
      return Number(value).toFixed(2);
    }
    return value;
  }, [gapSize, tempGapSize, displayUnit]);

  // Calculate stitch preview parameters
  const stitchPreviewParams = useMemo(() => {
    const sizeMultipliers = { small: 0.25, medium: 1.25, large: 2.5 };
    const currentStitchSize = tempStitchSize ?? stitchSize;
    const currentStitchWidth = tempStitchWidth ?? stitchWidth;
    
    const baseDashLength = 8 * sizeMultipliers[currentStitchSize];
    const baseGapLength = (tempGapSize ?? gapSize) * 1; // Use temp value for live preview
    const strokeWidth = STITCH_WIDTHS[currentStitchWidth];
    
    return { baseDashLength, baseGapLength, strokeWidth };
  }, [stitchSize, tempStitchSize, gapSize, tempGapSize, stitchWidth, tempStitchWidth]);

  const currentCurvature = tempCurvature ?? (selectedStitch?.curvature || 0);

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
              <p>Stitch Tool (P)</p>
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
            value={tempStitchColor || selectedStitchColor}
            onChange={onSelectedStitchColorChange}
            onOpenChange={onColorPickerOpenChange}
            presetColors={colorPresets}
            onAddPreset={onAddColorPreset}
            onRemovePreset={onRemoveColorPreset}
            tooltip="Stitch Color"
          />

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="outline"  className="w-20 px-2 justify-center">
                    <svg width="56" height="16" viewBox="0 0 56 16" preserveAspectRatio="none" className="w-full! overflow-visible">
                      <line
                        x1="0"
                        y1="8"
                        x2="56"
                        y2="8"
                        stroke="currentColor"
                        strokeWidth={stitchPreviewParams.strokeWidth}
                        strokeDasharray={`${stitchPreviewParams.baseDashLength} ${stitchPreviewParams.baseGapLength}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stitch Settings</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="">Stitch Length</Label>
                  <ButtonGroup className="w-full">
                    <Button
                      variant={stitchSize === 'small' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        onStitchSizeChange('small');
                      }}
                    >
                      Small
                    </Button>
                    <Button
                      variant={stitchSize === 'medium' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        onStitchSizeChange('medium');
                      }}
                    >
                      Medium
                    </Button>
                    <Button
                      variant={stitchSize === 'large' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        onStitchSizeChange('large');
                      }}
                    >
                      Large
                    </Button>
                  </ButtonGroup>
                </div>

                <div className="space-y-2">
                  <Label className="">Stitch Width</Label>
                  <ButtonGroup className="w-full">
                    <Button
                      variant={stitchWidth === 'thin' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        onStitchWidthChange('thin');
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="block w-4 bg-current rounded-full" style={{ height: `${STITCH_WIDTHS.thin}px` }} />
                        <span>Thin</span>
                      </div>
                    </Button>
                    <Button
                      variant={stitchWidth === 'normal' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        onStitchWidthChange('normal');
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="block w-4 bg-current rounded-full" style={{ height: `${STITCH_WIDTHS.normal}px` }} />
                        <span>Medium</span>
                      </div>
                    </Button>
                    <Button
                      variant={stitchWidth === 'thick' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        onStitchWidthChange('thick');
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="block w-4 bg-current rounded-full" style={{ height: `${STITCH_WIDTHS.thick}px` }} />
                        <span>Thick</span>
                      </div>
                    </Button>
                  </ButtonGroup>
                </div>

                <div className="space-y-2">
                  <Label className="">Stitch Gap: {gapDisplayValue}{displayUnit}</Label>
                  <Slider
                    id="gap-size-slider"
                    min={1}
                    max={30}
                    step={1}
                    value={[tempGapSize ?? gapSize]}
                    onValueChange={handleGapSizeChange}
                    onPointerDown={onGapSliderStart}
                    onValueCommit={onGapSliderCommit}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="">Bend: {currentCurvature}%</Label>
                  <Slider
                    id="curvature-slider"
                    min={-50}
                    max={50}
                    step={1}
                    value={[currentCurvature]}
                    onValueChange={(vals) => onCurvatureChange(vals[0])}
                    onPointerDown={onCurvatureSliderStart}
                    onValueCommit={onCurvatureSliderCommit}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

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
