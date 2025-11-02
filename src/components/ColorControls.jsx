import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Separator } from './ui/separator.jsx';
import { Badge } from './ui/badge.jsx';

export function ColorControls({
  defaultThreadColor,
  onDefaultThreadColorChange,
  backgroundColor,
  onBackgroundColorChange,
  selectedStitchColor,
  onSelectedStitchColorChange,
  onApplySelectedColor,
  onClearColors,
  colorPresets,
  hasSelection,
  selectedCount,
}) {
  return (
    <Card className="bg-slate-900/70">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Thread & Colors
          <Badge variant={hasSelection ? 'success' : 'outline'}>
            {hasSelection ? `${selectedCount} selected` : 'No selection'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="default-thread">Default Thread</Label>
          <Input
            id="default-thread"
            type="color"
            value={defaultThreadColor}
            onChange={(event) => onDefaultThreadColorChange(event.target.value)}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="background-color">Canvas Background</Label>
          <Input
            id="background-color"
            type="color"
            value={backgroundColor}
            onChange={(event) => onBackgroundColorChange(event.target.value)}
            className="h-12"
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="selected-stitch">Selected Stitches</Label>
          <div className="flex items-center gap-2">
            <Input
              id="selected-stitch"
              type="color"
              value={selectedStitchColor}
              onChange={(event) => onSelectedStitchColorChange(event.target.value)}
              className="h-12"
            />
            <Button
              type="button"
              onClick={() => onApplySelectedColor(selectedStitchColor)}
              disabled={!hasSelection}
            >
              Apply
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Color Presets</Label>
          <div className="flex flex-wrap gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  onSelectedStitchColorChange(preset.value);
                  onApplySelectedColor(preset.value);
                }}
                disabled={!hasSelection}
                className="h-10 w-10 rounded-full border border-slate-700 shadow-sm transition hover:scale-105 disabled:opacity-50"
                style={{ backgroundColor: preset.value }}
                aria-label={`Apply ${preset.label}`}
                title={preset.label}
              />
            ))}
          </div>
        </div>

        <Separator />

        <Button type="button" variant="secondary" onClick={onClearColors}>
          Clear Colors
        </Button>
      </CardContent>
    </Card>
  );
}
