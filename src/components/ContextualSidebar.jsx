import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Label } from './ui/label.jsx';
import { Select } from './ui/select.jsx';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';

export function ContextualSidebar({
  selectedCount,
  stitchSize,
  onStitchSizeChange,
  repeatPattern,
  onRepeatPatternChange,
  selectedStitchColor,
  onSelectedStitchColorChange,
  onClearColors,
  onDeleteSelected,
  colorPresets,
}) {
  const hasSelection = selectedCount > 0;

  return (
    <Card className="bg-slate-900/70">
      <CardHeader className="space-y-2">
        <CardTitle>Stitch Options</CardTitle>
        {hasSelection ? (
          <Badge>{selectedCount} stitch{selectedCount !== 1 ? 'es' : ''} selected</Badge>
        ) : (
          <p className="text-xs text-slate-400">Default settings for draw tool</p>
        )}
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {/* Stitch Size - Same for both modes */}
        <div className="space-y-2">
          <Label htmlFor="sidebar-stitch-size">Stitch Length</Label>
          <Select
            id="sidebar-stitch-size"
            value={stitchSize}
            onChange={(event) => {
              if (event.target.value) {
                onStitchSizeChange(event.target.value);
              }
            }}
          >
            <option value="medium">Medium (1/2 cell)</option>
            <option value="large">Large (1 cell)</option>
            <option value="xlarge">XLarge (2 cells)</option>
          </Select>
        </div>

        {/* Repeat Pattern - Same for both modes */}
        <div className="space-y-2">
          <Label htmlFor="sidebar-repeat">Repeat Pattern</Label>
          <button
            type="button"
            id="sidebar-repeat"
            onClick={() => onRepeatPatternChange(!repeatPattern)}
            className={`w-full rounded border px-3 py-2 text-sm font-medium transition-colors ${
              repeatPattern
                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-300'
            }`}
          >
            Repeat: {repeatPattern ? 'On' : 'Off'}
          </button>
          <p className="text-xs text-slate-500">
            {repeatPattern 
              ? 'Lines appear in all tiles' 
              : 'Lines appear only where drawn'}
          </p>
        </div>

        {/* Color Options - Same for both modes */}
        <div className="space-y-2">
          <Label htmlFor="stitch-color">Stitch Color</Label>
          <input
            type="color"
            id="stitch-color"
            value={selectedStitchColor}
            onChange={(e) => onSelectedStitchColorChange(e.target.value)}
            className="h-10 w-full cursor-pointer rounded border border-slate-700 bg-slate-800"
          />
          
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

        {/* Delete Button - Only when selection exists */}
        {hasSelection && (
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
        )}
      </CardContent>
    </Card>
  );
}
