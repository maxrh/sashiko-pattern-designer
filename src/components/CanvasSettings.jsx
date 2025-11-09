import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
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
import { ColorPickerComponent } from './ui/color-picker';
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
  onExportPattern,
  onImportPattern,
  onExportImage,
  onCopyPatternToClipboard,
}) {
  const [isArtboardSettingsOpen, setIsArtboardSettingsOpen] = useState(true);
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
        <CardTitle>Canvas Settings</CardTitle>
      </CardHeader> */}
      <CardContent className="space-y-5 text-sm">
        <div className="space-y-2">
          <Label htmlFor="pattern-name">Pattern Name</Label>
          <input
            type="text"
            id="pattern-name"
            value={patternName}
            onChange={(e) => onPatternNameChange(e.target.value)}
            placeholder="Untitled pattern"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pattern-description">Pattern Description</Label>
          <textarea
            id="pattern-description"
            value={patternDescription}
            onChange={(e) => onPatternDescriptionChange(e.target.value)}
            placeholder="Describe your pattern..."
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
          />
        </div>

        <ColorPickerComponent
          label="Fabric Color"
          id="background-color"
          value={backgroundColor}
          onChange={onBackgroundColorChange}
        />

        <div className="space-y-2">
          <Label htmlFor="artboard-size">Artboard Size</Label>
          <input
            type="text"
            id="artboard-size"
            value={`${formatValueNumber(artboardWidth, displayUnit, displayUnit === UNITS.MM ? 0 : undefined)}×${formatValueNumber(artboardHeight, displayUnit, displayUnit === UNITS.MM ? 0 : undefined)}${displayUnit}`}
            disabled
            className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground"
          />
        </div>
       
        <ButtonGroup className="w-full">
          <Button
            variant={displayUnit === UNITS.PX ? "default" : "outline"}
            onClick={() => onDisplayUnitChange(UNITS.PX)}
            className="flex-1"
          >
            px
          </Button>
          <Button
            variant={displayUnit === UNITS.MM ? "default" : "outline"}
            onClick={() => onDisplayUnitChange(UNITS.MM)}
            className="flex-1"
          >
            mm
          </Button>
          <Button
            variant={displayUnit === UNITS.CM ? "default" : "outline"}
            onClick={() => onDisplayUnitChange(UNITS.CM)}
            className="flex-1"
          >
            cm
          </Button>
        </ButtonGroup>
           

        

        

        <Collapsible open={isArtboardSettingsOpen} onOpenChange={setIsArtboardSettingsOpen} className="space-y-2">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
            <span>Artboard Settings</span>
            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isArtboardSettingsOpen ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">

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

          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={isGridAppearanceOpen} onOpenChange={setIsGridAppearanceOpen} className="space-y-2">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
            <span>Grid Appearance</span>
            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isGridAppearanceOpen ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <ColorPickerComponent
              label="Grid Color"
              id="grid-color"
              value={gridColor}
              onChange={onGridColorChange}
            />

            <ColorPickerComponent
              label="Tile Outline Color"
              id="tile-outline-color"
              value={tileOutlineColor}
              onChange={onTileOutlineColorChange}
            />

            <ColorPickerComponent
              label="Artboard Outline Color"
              id="artboard-outline-color"
              value={artboardOutlineColor}
              onChange={onArtboardOutlineColorChange}
            />
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
