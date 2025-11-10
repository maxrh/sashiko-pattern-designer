import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { ButtonGroup } from './ui/button-group';
import { Slider } from './ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Spinner } from './ui/spinner';
import { ColorPicker } from './ui/color-picker';
import { ChevronRight, Info, Download, Upload, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { formatValueNumber, UNITS } from '../lib/unitConverter.js';

export function CanvasSettings({
  patternTiles,
  onPatternTilesChange,
  backgroundColor,
  onBackgroundColorChange,
  patternName,
  onPatternNameChange,
  patternDescription,
  onPatternDescriptionChange,
  tileSize,
  onTileSizeChange,
  gridSize,
  onGridSizeChange,
  displayUnit,
  onDisplayUnitChange,
  artboardWidth,
  artboardHeight,
  onNewPattern,
  onSavePattern,
  saveState = 'idle',
  onResetSettings,
  gridColor,
  onGridColorChange,
  tileOutlineColor,
  onTileOutlineColorChange,
  artboardOutlineColor,
  onArtboardOutlineColorChange,
  colorPresets,
  onAddColorPreset,
  onRemoveColorPreset,
  onExportPattern,
  onImportPattern,
  onExportImage,
  onCopyPatternToClipboard,
}) {
  const [isGridAppearanceOpen, setIsGridAppearanceOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const [file] = event.target.files ?? [];
    if (file) {
      onImportPattern(file);
      event.target.value = '';
    }
  };

  const handleNewPatternClick = () => {
    toast.warning('Clear artboard?', {
      description: 'Current pattern will be lost if not saved to library.',
      duration: Infinity,
      action: {
        label: 'OK',
        onClick: () => onNewPattern(),
      },
      cancel: {
        label: 'Cancel',
      },
    });
  };

  const handleCopyForPatternsJson = () => {
    onCopyPatternToClipboard()
      .then(() => {
        toast.success('Copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard');
      });
  };

  return (
    <Card>
      {/* <CardHeader className="space-y-2">
        <CardTitle>Pattern Settings</CardTitle>
      </CardHeader> */}
      <CardContent className="space-y-5 text-sm">
        <div className="space-y-2">
          <Label htmlFor="pattern-name">Pattern Name</Label>
          <Input
            type="text"
            id="pattern-name"
            value={patternName}
            onChange={(e) => onPatternNameChange(e.target.value)}
            placeholder="Untitled pattern"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pattern-description">Description</Label>
          <Textarea
            id="pattern-description"
            value={patternDescription}
            onChange={(e) => onPatternDescriptionChange(e.target.value)}
            placeholder="Describe your pattern..."
            rows={2}
            className="resize-none"
          />
        </div>

        

        <div className="space-y-2">
          <Label htmlFor="artboard-size">Artboard Size</Label>
          <ButtonGroup className="w-full">
            <Input
              type="text"
              id="artboard-size"
              value={`${formatValueNumber(artboardWidth, displayUnit, displayUnit === UNITS.MM ? 0 : undefined)}×${formatValueNumber(artboardHeight, displayUnit, displayUnit === UNITS.MM ? 0 : undefined)}`}
              disabled
              className="bg-muted disabled:cursor-default disabled:opacity-100 flex-1 rounded-r-none"
            />
            <Select value={displayUnit} onValueChange={onDisplayUnitChange}>
              <SelectTrigger className="w-20 rounded-l-none border-l-0 hover:bg-accent hover:text-accent-foreground ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNITS.PX}>px</SelectItem>
                <SelectItem value={UNITS.MM}>mm</SelectItem>
                <SelectItem value={UNITS.CM}>cm</SelectItem>
              </SelectContent>
            </Select>
          </ButtonGroup>
        </div>
       
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="pattern-tiles-x">Columns (X): {patternTiles.x} </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Controls how many times the pattern repeats horizontally on the artboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Slider
            id="pattern-tiles-x"
            min={1}
            max={10}
            step={1}
            value={[patternTiles.x]}
            onValueChange={(value) => onPatternTilesChange('x', value[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="pattern-tiles-y">Rows (Y): {patternTiles.y} </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Controls how many times the pattern repeats vertically on the artboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Slider
            id="pattern-tiles-y"
            min={1}
            max={10}
            step={1}
            value={[patternTiles.y]}
            onValueChange={(value) => onPatternTilesChange('y', value[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="tile-size-x">Column Width (X): {tileSize.x}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of grid cells horizontally per pattern tile</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Slider
            id="tile-size-x"
            min={5}
            max={20}
            step={1}
            value={[tileSize.x]}
            onValueChange={(value) => onTileSizeChange('x', value[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="tile-size-y">Row Height (Y): {tileSize.y}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of grid cells vertically per pattern tile</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Slider
            id="tile-size-y"
            min={5}
            max={20}
            step={1}
            value={[tileSize.y]}
            onValueChange={(value) => onTileSizeChange('y', value[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="grid-size">
              Grid Size: {formatValueNumber(gridSize, displayUnit, displayUnit === UNITS.CM ? 2 : undefined)}{displayUnit}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Size of each grid cell ({gridSize}px)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Slider
            id="grid-size"
            min={10}
            max={50}
            step={1}
            value={[gridSize]}
            onValueChange={(value) => onGridSizeChange(value[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="background-color">Fabric Color</Label>
          <ButtonGroup className="w-full">
            <ColorPicker
              value={backgroundColor}
              onChange={onBackgroundColorChange}
              presetColors={colorPresets}
              onAddPreset={onAddColorPreset}
              onRemovePreset={onRemoveColorPreset}
            />
            <Input
              id="background-color"
              type="text"
              value={backgroundColor.toUpperCase()}
              onChange={(e) => {
                const newValue = e.target.value;
                const pattern = /^#[0-9A-F]{0,6}$/i;
                if (pattern.test(newValue)) {
                  onBackgroundColorChange(newValue);
                }
              }}
              className="flex-1 text-xs uppercase font-mono rounded-l-none border-l-0"
              placeholder="#000000"
              maxLength={7}
            />
          </ButtonGroup>
        </div>

        <Collapsible open={isGridAppearanceOpen} onOpenChange={setIsGridAppearanceOpen} className="space-y-2">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
            <span>Grid Appearance</span>
            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isGridAppearanceOpen ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="grid-color">Grid Color</Label>
              <ButtonGroup className="w-full">
                <ColorPicker
                  value={gridColor}
                  onChange={onGridColorChange}
                  showAlpha={true}
                />
                <Input
                  id="grid-color"
                  type="text"
                  value={gridColor.toUpperCase()}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    const pattern = /^#[0-9A-F]{0,6}$/i;
                    if (pattern.test(newValue)) {
                      onGridColorChange(newValue);
                    }
                  }}
                  className="flex-1 text-xs uppercase font-mono rounded-l-none border-l-0"
                  placeholder="#000000"
                  maxLength={7}
                />
              </ButtonGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tile-outline-color">Tile Outline Color</Label>
              <ButtonGroup className="w-full">
                <ColorPicker
                  value={tileOutlineColor}
                  onChange={onTileOutlineColorChange}
                  showAlpha={true}
                />
                <Input
                  id="tile-outline-color"
                  type="text"
                  value={tileOutlineColor.toUpperCase()}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    const pattern = /^#[0-9A-F]{0,6}$/i;
                    if (pattern.test(newValue)) {
                      onTileOutlineColorChange(newValue);
                    }
                  }}
                  className="flex-1 text-xs uppercase font-mono rounded-l-none border-l-0"
                  placeholder="#000000"
                  maxLength={7}
                />
              </ButtonGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="artboard-outline-color">Artboard Outline Color</Label>
              <ButtonGroup className="w-full">
                <ColorPicker
                  value={artboardOutlineColor}
                  onChange={onArtboardOutlineColorChange}
                  showAlpha={true}
                />
                <Input
                  id="artboard-outline-color"
                  type="text"
                  value={artboardOutlineColor.toUpperCase()}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    const pattern = /^#[0-9A-F]{0,6}$/i;
                    if (pattern.test(newValue)) {
                      onArtboardOutlineColorChange(newValue);
                    }
                  }}
                  className="flex-1 text-xs uppercase font-mono rounded-l-none border-l-0"
                  placeholder="#000000"
                  maxLength={7}
                />
              </ButtonGroup>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={handleNewPatternClick} className="w-full">
              New
            </Button>
            <Button 
              type="button" 
              onClick={onSavePattern} 
              className={`w-full transition-colors duration-300 ${saveState === 'saved' ? 'bg-emerald-700 hover:bg-emerald-700' : ''}`}
              variant="default"
              disabled={saveState === 'saving'}
            >
              {saveState === 'saving' && <Spinner className="mr-1 h-4 w-4" />}
              {saveState === 'saved' && <Check className="mr-1 h-4 w-4" />}
              {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved!' : 'Save'}
            </Button>
          </div>
          <Button type="button" onClick={onResetSettings} variant="outline" className="w-full">
            Reset to Defaults
          </Button>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export / Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={onExportPattern}>
                <Download className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Download className="mr-2 h-4 w-4" />
                  Export as PNG
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => onExportImage(1)}>
                    1x (Standard)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExportImage(2)}>
                    2x (High Quality)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExportImage(3)}>
                    3x (Print Quality)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExportImage(4)}>
                    4x (Ultra HD)
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem disabled>
                <Download className="mr-2 h-4 w-4" />
                Export as SVG
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyForPatternsJson}>
                <Copy className="mr-2 h-4 w-4" />
                Copy JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Import JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
