import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const TILE_OPTIONS = [2, 3, 4, 5, 6, 8, 10];

export function CanvasSettings({
  patternTiles,
  onPatternTilesChange,
  backgroundColor,
  onBackgroundColorChange,
  defaultStitchColor,
  onDefaultStitchColorChange,
  patternName,
  onPatternNameChange,
  canvasInfo,
  onNewPattern,
  onSavePattern,
  onResetSettings,
}) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Canvas Settings</CardTitle>
        <Badge variant="outline">{canvasInfo}</Badge>
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
          <Label htmlFor="pattern-tiles">Pattern Tiles</Label>
          <Select value={String(patternTiles)} onValueChange={(value) => onPatternTilesChange(Number(value))}>
            <SelectTrigger id="pattern-tiles" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TILE_OPTIONS.map((tiles) => (
                <SelectItem key={tiles} value={String(tiles)}>
                  {tiles}×{tiles}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Controls how many times the pattern repeats on the canvas
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
