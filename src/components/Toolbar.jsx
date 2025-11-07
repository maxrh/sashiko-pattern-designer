import { MousePointer, Edit3, Hand, Grip, Eye, EyeOff, Undo2, Redo2 } from 'lucide-react';
import { ButtonGroup, ButtonGroupSeparator } from './ui/button-group';
import { Button } from './ui/button';
import { Toggle } from './ui/toggle';
import { SidebarTrigger } from './ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';

export function Toolbar({
  drawingMode,
  onModeChange,
  onSelectAll,
  onDeselectAll,
  repeatPattern,
  onRepeatPatternChange,
  selectedStitchColor,
  onSelectedStitchColorChange,
  onClearColors,
  colorPresets,
  stitchSize,
  onStitchSizeChange,
  stitchWidth,
  onStitchWidthChange,
  gapSize,
  onGapSizeChange,
  showGrid,
  onShowGridChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
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

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                  >
                    <div 
                      className="w-4 h-4 rounded "
                      style={{ backgroundColor: selectedStitchColor }}
                    />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stitch Color</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="toolbar-stitch-color">Stitch Color</Label>
                  <input
                    type="color"
                    id="toolbar-stitch-color"
                    value={selectedStitchColor}
                    onChange={(e) => onSelectedStitchColorChange(e.target.value)}
                    className="h-10 w-full cursor-pointer rounded-md border border-input bg-background"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => onSelectedStitchColorChange(preset.value)}
                        className="h-8 w-8 rounded border-2 border-border transition-transform hover:scale-110"
                        style={{ backgroundColor: preset.value }}
                        title={preset.label}
                      />
                    ))}
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClearColors}
                  className="w-full"
                >
                  Clear Custom Colors
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Select value={stitchSize} onValueChange={onStitchSizeChange}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stitch Length</p>
              </TooltipContent>
            </Tooltip>
            <SelectContent onCloseAutoFocus={e => e.preventDefault()}>
              <SelectItem value="small">Small (≈2mm)</SelectItem>
              <SelectItem value="medium">Medium (≈4mm)</SelectItem>
              <SelectItem value="large">Large (≈8mm)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stitchWidth} onValueChange={onStitchWidthChange}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stitch Width</p>
              </TooltipContent>
            </Tooltip>
            <SelectContent onCloseAutoFocus={e => e.preventDefault()}>
              <SelectItem value="thin">Thin</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-20 font-normal">
                    {gapSize}px
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Gap Size</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gap-size-slider">Gap Size: {gapSize}px</Label>
                  <Slider
                    id="gap-size-slider"
                    min={1}
                    max={30}
                    step={1}
                    value={[gapSize]}
                    onValueChange={(value) => onGapSizeChange(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1px</span>
                    <span>30px</span>
                  </div>
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
