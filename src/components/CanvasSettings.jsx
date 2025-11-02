import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Label } from './ui/label.jsx';
import { Select } from './ui/select.jsx';
import { Badge } from './ui/badge.jsx';

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
    <Card className="bg-slate-900/70">
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
            className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pattern-tiles">Pattern Tiles</Label>
          <Select
            id="pattern-tiles"
            value={String(patternTiles)}
            onChange={(event) => onPatternTilesChange(Number(event.target.value))}
          >
            {TILE_OPTIONS.map((tiles) => (
              <option key={tiles} value={tiles}>{tiles}×{tiles}</option>
            ))}
          </Select>
          <p className="text-xs text-slate-500">
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
              className="h-10 w-16 cursor-pointer rounded border border-slate-700 bg-slate-800"
            />
            <div className="flex flex-1 items-center rounded border border-slate-700 bg-slate-800 px-3 text-xs">
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
              className="h-10 w-16 cursor-pointer rounded border border-slate-700 bg-slate-800"
            />
            <div className="flex flex-1 items-center rounded border border-slate-700 bg-slate-800 px-3 text-xs">
              {defaultThreadColor.toUpperCase()}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            This color will be used for new stitches
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
