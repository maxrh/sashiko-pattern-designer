import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Label } from './ui/label.jsx';
import { Select } from './ui/select.jsx';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';

export function ContextualSidebar({
  selectedCount,
  selectedStitchColor,
  onSelectedStitchColorChange,
  onApplySelectedColor,
  onClearColors,
  onChangeSelectedStitchSize,
  onDeleteSelected,
  colorPresets,
}) {
  if (selectedCount === 0) {
    return (
      <Card className="bg-slate-900/70">
        <CardHeader>
          <CardTitle>Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-slate-400">No stitches selected</p>
          <p className="text-xs text-slate-500">
            Click on stitches in select mode to modify their properties
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/70">
      <CardHeader className="space-y-2">
        <CardTitle>Selected Stitches</CardTitle>
        <Badge>{selectedCount} stitch{selectedCount !== 1 ? 'es' : ''} selected</Badge>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <div className="space-y-2">
          <Label htmlFor="selected-color">Stitch Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              id="selected-color"
              value={selectedStitchColor}
              onChange={(e) => onSelectedStitchColorChange(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded border border-slate-700 bg-slate-800"
            />
            <Button
              type="button"
              onClick={onApplySelectedColor}
              className="flex-1"
            >
              Apply Color
            </Button>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  onSelectedStitchColorChange(preset.value);
                }}
                className="h-8 w-8 rounded border-2 border-slate-700 transition-transform hover:scale-110"
                style={{ backgroundColor: preset.value }}
                title={preset.label}
              />
            ))}
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

        <div className="space-y-2">
          <Label htmlFor="selected-stitch-size">Stitch Length</Label>
          <Select
            id="selected-stitch-size"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                onChangeSelectedStitchSize(event.target.value);
              }
            }}
          >
            <option value="">Change size...</option>
            <option value="medium">Medium (1/2 cell)</option>
            <option value="large">Large (1 cell)</option>
            <option value="xlarge">XLarge (2 cells)</option>
          </Select>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <Button
            type="button"
            variant="destructive"
            onClick={onDeleteSelected}
            className="w-full"
          >
            Delete Selected ({selectedCount})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
