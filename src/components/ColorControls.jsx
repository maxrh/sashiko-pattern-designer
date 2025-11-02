import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Separator } from './ui/separator.jsx';
import { Badge } from './ui/badge.jsx';

export function ColorControls({
  defaultThreadColor,
  onDefaultThreadColorChange,
}) {
  return (
    <Card className="bg-slate-900/70">
      <CardHeader>
        <CardTitle>Thread Color</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="default-thread">Default Thread Color</Label>
          <div className="flex gap-2">
            <input
              type="color"
              id="default-thread"
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
