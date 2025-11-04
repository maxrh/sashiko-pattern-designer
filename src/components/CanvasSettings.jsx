import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

const TILE_OPTIONS = [2, 3, 4, 5, 6, 8, 10];

export function CanvasSettings({
  patternTiles,
  onPatternTilesChange,
  backgroundColor,
  onBackgroundColorChange,
  defaultThreadColor,
  onDefaultThreadColorChange,
  patternName,
  onPatternNameChange,
  canvasInfo,
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
          <Label htmlFor="default-thread-color">Default Thread Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              id="default-thread-color"
              value={defaultThreadColor}
              onChange={(e) => onDefaultThreadColorChange(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded-md border border-input bg-background"
            />
            <div className="flex flex-1 items-center rounded-md border border-input bg-background px-3 text-xs text-foreground">
              {defaultThreadColor.toUpperCase()}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This color will be used for new stitches
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
