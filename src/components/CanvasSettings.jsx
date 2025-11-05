import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ChevronRight, Info, Download, Upload } from 'lucide-react';

export function CanvasSettings({
  patternTiles,
  onPatternTilesChange,
  backgroundColor,
  onBackgroundColorChange,
  patternName,
  onPatternNameChange,
  tileSize,
  onTileSizeChange,
  gridSize,
  onGridSizeChange,
  artboardSize,
  canvasInfo,
  onNewPattern,
  onSavePattern,
  onResetSettings,
  gridColor,
  onGridColorChange,
  gridOpacity,
  onGridOpacityChange,
  tileOutlineColor,
  onTileOutlineColorChange,
  tileOutlineOpacity,
  onTileOutlineOpacityChange,
  artboardOutlineColor,
  onArtboardOutlineColorChange,
  artboardOutlineOpacity,
  onArtboardOutlineOpacityChange,
  onExportPattern,
  onImportPattern,
  onExportImage,
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

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Canvas Settings</CardTitle>
        <p className="text-sm text-muted-foreground">Artboard: {artboardSize}×{artboardSize}px</p>
      </CardHeader>
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
          <div className="flex items-center gap-1">
            <Label htmlFor="pattern-tiles">Pattern Tiles: {patternTiles}×{patternTiles}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Controls how many times the pattern repeats on the artboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Slider
            id="pattern-tiles"
            min={1}
            max={10}
            step={1}
            value={[patternTiles]}
            onValueChange={(value) => onPatternTilesChange(value[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="tile-size">Tile Size: {tileSize}×{tileSize} grid</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of grid cells per pattern tile</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Slider
            id="tile-size"
            min={5}
            max={20}
            step={1}
            value={[tileSize]}
            onValueChange={(value) => onTileSizeChange(value[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="grid-size">Grid Size: {gridSize}px</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pixel size of each grid cell</p>
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
          <div className="flex gap-2">
            <input
              type="color"
              id="background-color"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-md border border-input bg-background"
            />
            <div className="flex flex-1 items-center rounded-md border border-input bg-background px-3 text-xs text-foreground">
              {backgroundColor.toUpperCase()}
            </div>
          </div>
        </div>

        <Collapsible open={isGridAppearanceOpen} onOpenChange={setIsGridAppearanceOpen} className="space-y-2">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
            <span>Grid Appearance</span>
            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isGridAppearanceOpen ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="grid-color">Grid Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="grid-color"
                  value={gridColor}
                  onChange={(e) => onGridColorChange(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-md border border-input bg-background"
                />
                <div className="flex flex-1 items-center rounded-md border border-input bg-background px-3 text-xs text-foreground">
                  {gridColor.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grid-opacity">Grid Opacity: {Math.round(gridOpacity * 100)}%</Label>
              <Slider
                id="grid-opacity"
                min={0}
                max={100}
                step={1}
                value={[gridOpacity * 100]}
                onValueChange={(value) => onGridOpacityChange(value[0] / 100)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tile-outline-color">Tile Outline Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="tile-outline-color"
                  value={tileOutlineColor}
                  onChange={(e) => onTileOutlineColorChange(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-md border border-input bg-background"
                />
                <div className="flex flex-1 items-center rounded-md border border-input bg-background px-3 text-xs text-foreground">
                  {tileOutlineColor.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tile-outline-opacity">Tile Outline Opacity: {Math.round(tileOutlineOpacity * 100)}%</Label>
              <Slider
                id="tile-outline-opacity"
                min={0}
                max={100}
                step={1}
                value={[tileOutlineOpacity * 100]}
                onValueChange={(value) => onTileOutlineOpacityChange(value[0] / 100)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artboard-outline-color">Artboard Outline Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="artboard-outline-color"
                  value={artboardOutlineColor}
                  onChange={(e) => onArtboardOutlineColorChange(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-md border border-input bg-background"
                />
                <div className="flex flex-1 items-center rounded-md border border-input bg-background px-3 text-xs text-foreground">
                  {artboardOutlineColor.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="artboard-outline-opacity">Artboard Outline Opacity: {Math.round(artboardOutlineOpacity * 100)}%</Label>
              <Slider
                id="artboard-outline-opacity"
                min={0}
                max={100}
                step={1}
                value={[artboardOutlineOpacity * 100]}
                onValueChange={(value) => onArtboardOutlineOpacityChange(value[0] / 100)}
                className="w-full"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-2 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={onNewPattern} className="w-full">
              New
            </Button>
            <Button type="button" onClick={onSavePattern} className="w-full" variant="default">
              Save
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
              <DropdownMenuItem onClick={onExportImage}>
                <Download className="mr-2 h-4 w-4" />
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Download className="mr-2 h-4 w-4" />
                Export as SVG
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
