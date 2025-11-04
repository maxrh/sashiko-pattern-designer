import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

export function CanvasSettings({
  patternTiles,
  onPatternTilesChange,
  backgroundColor,
  onBackgroundColorChange,
  defaultStitchColor,
  onDefaultStitchColorChange,
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
}) {
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
          <Label htmlFor="pattern-tiles">Pattern Tiles: {patternTiles}×{patternTiles}</Label>
          <Slider
            id="pattern-tiles"
            min={1}
            max={10}
            step={1}
            value={[patternTiles]}
            onValueChange={(value) => onPatternTilesChange(value[0])}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Controls how many times the pattern repeats on the artboard
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tile-size">Tile Size: {tileSize}×{tileSize} grid</Label>
          <Slider
            id="tile-size"
            min={5}
            max={20}
            step={1}
            value={[tileSize]}
            onValueChange={(value) => onTileSizeChange(value[0])}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Number of grid cells per pattern tile
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="grid-size">Grid Size: {gridSize}px</Label>
          <Slider
            id="grid-size"
            min={10}
            max={50}
            step={1}
            value={[gridSize]}
            onValueChange={(value) => onGridSizeChange(value[0])}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Pixel size of each grid cell
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="background-color">Background Color</Label>
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

        <div className="space-y-2">
          <Label htmlFor="default-stitch-color">Default Stitch Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              id="default-stitch-color"
              value={defaultStitchColor}
              onChange={(e) => onDefaultStitchColorChange(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-md border border-input bg-background"
            />
            <div className="flex flex-1 items-center rounded-md border border-input bg-background px-3 text-xs text-foreground">
              {defaultStitchColor.toUpperCase()}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This color will be used for new stitches
          </p>
        </div>

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
      </CardContent>
    </Card>
  );
}
