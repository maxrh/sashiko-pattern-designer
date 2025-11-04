import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

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
  isHydrated = true,
}) {
  const hasSelection = selectedCount > 0;

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Stitch Options</CardTitle>
        {hasSelection ? (
          <Badge>{selectedCount} stitch{selectedCount !== 1 ? 'es' : ''} selected</Badge>
        ) : (
          <p className="text-xs text-muted-foreground">Default settings for draw tool</p>
        )}
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {/* Stitch Size - Same for both modes */}
        <div className="space-y-2">
          <Label htmlFor="sidebar-stitch-size">Stitch Length</Label>
          <Select value={stitchSize} onValueChange={onStitchSizeChange}>
            <SelectTrigger id="sidebar-stitch-size" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="medium">Medium (1/2 cell)</SelectItem>
              <SelectItem value="large">Large (1 cell)</SelectItem>
              <SelectItem value="xlarge">XLarge (2 cells)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Repeat Pattern - Same for both modes */}
        <div className="space-y-2">
          <Label htmlFor="sidebar-repeat">Repeat Pattern</Label>
          <button
            type="button"
            id="sidebar-repeat"
            onClick={() => onRepeatPatternChange(!repeatPattern)}
            className={`w-full rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              repeatPattern
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-border bg-muted/50 text-muted-foreground hover:border-border/80 hover:bg-muted hover:text-foreground'
            }`}
            suppressHydrationWarning
          >
            Repeat: {isHydrated ? (repeatPattern ? 'On' : 'Off') : 'On'}
          </button>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {isHydrated
              ? (repeatPattern 
                  ? 'Lines appear in all tiles' 
                  : 'Lines appear only where drawn')
              : 'Lines appear in all tiles'}
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
            className="h-10 w-full cursor-pointer rounded-md border border-input bg-background"
          />
          
          <div className="mt-2 flex flex-wrap gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  onSelectedStitchColorChange(preset.value);
                }}
                className="h-8 w-8 rounded border-2 border-border transition-transform hover:scale-110"
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
          <div className="border-t border-border pt-4">
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
