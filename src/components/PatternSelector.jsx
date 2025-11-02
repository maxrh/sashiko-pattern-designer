import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Separator } from './ui/separator.jsx';

export function PatternSelector({ patterns, activePatternId, onSelectPattern }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Saved Patterns</h2>
        <Badge variant="outline">{patterns.length} designs</Badge>
      </div>
      <div className="grid gap-3">
        {patterns.map((pattern) => {
          const isActive = activePatternId === pattern.id;
          return (
            <Card
              key={pattern.id}
              className={isActive ? 'border-sky-500/60 bg-slate-900/80 shadow-md' : 'bg-slate-900/60'}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-white">{pattern.name}</CardTitle>
                  <Badge>{pattern.gridSize}x{pattern.gridSize}</Badge>
                </div>
              </CardHeader>
              <Separator className="opacity-20" />
              <CardContent className="pt-3 text-xs text-slate-300">
                <p>{pattern.description}</p>
                <Button
                  type="button"
                  variant={isActive ? 'secondary' : 'outline'}
                  className="mt-3 w-full"
                  onClick={() => onSelectPattern(pattern)}
                >
                  {isActive ? 'Active Pattern' : 'Load Pattern'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
