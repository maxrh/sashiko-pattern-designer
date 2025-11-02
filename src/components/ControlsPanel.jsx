import { useRef } from 'react';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { RadioGroup, RadioGroupItem } from './ui/radio-group.jsx';
import { Select } from './ui/select.jsx';
import { Separator } from './ui/separator.jsx';
import { Badge } from './ui/badge.jsx';

const CANVAS_OPTIONS = [400, 600, 800, 1000];

export function ControlsPanel({
  canvasSize,
  onCanvasSizeChange,
  drawingMode,
  onModeChange,
  stitchSize,
  onStitchSizeChange,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  patternInfo,
  onNewPattern,
  patternName,
  onPatternNameChange,
  selectedCount,
  onExportPattern,
  onImportPattern,
  onExportImage,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const [file] = event.target.files ?? [];
    if (file) {
      onImportPattern(file);
      event.target.value = '';
    }
  };

  return (
    <Card className="bg-slate-900/70">
      <CardHeader className="space-y-2">
        <CardTitle>Pattern Controls</CardTitle>
        <Badge>{patternInfo}</Badge>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <div className="space-y-2">
          <Label htmlFor="pattern-name">Pattern Name</Label>
          <Input
            id="pattern-name"
            value={patternName}
            onChange={(event) => onPatternNameChange(event.target.value)}
            placeholder="Untitled pattern"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="canvas-size">Canvas Size</Label>
          <Select
            id="canvas-size"
            value={String(canvasSize)}
            onChange={(event) => onCanvasSizeChange(Number(event.target.value))}
          >
            {CANVAS_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Interaction Mode</Label>
          <RadioGroup value={drawingMode} onValueChange={onModeChange}>
            <RadioGroupItem value="select">Select Mode</RadioGroupItem>
            <RadioGroupItem value="draw">Draw Mode ✏️</RadioGroupItem>
          </RadioGroup>
        </div>

        {drawingMode === 'draw' && (
          <div className="space-y-2">
            <Label htmlFor="stitch-size">Stitch Length</Label>
            <Select
              id="stitch-size"
              value={stitchSize}
              onChange={(event) => onStitchSizeChange(event.target.value)}
            >
              <option value="small">Small (1/3 cell)</option>
              <option value="medium">Medium (1/2 cell)</option>
              <option value="large">Large (1 cell)</option>
              <option value="xlarge">X-Large (2 cells)</option>
            </Select>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onSelectAll}>
            Select All
          </Button>
          <Button type="button" variant="secondary" onClick={onDeselectAll}>
            Deselect All
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDeleteSelected}
            disabled={selectedCount === 0}
          >
            Delete Selected ({selectedCount})
          </Button>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onNewPattern}>
            New Pattern
          </Button>
          <Button type="button" variant="secondary" onClick={onExportPattern}>
            Export JSON
          </Button>
          <Button type="button" variant="secondary" onClick={onExportImage}>
            Export PNG
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON
          </Button>
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
