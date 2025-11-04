import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Trash2 } from 'lucide-react';

export function PatternCard({ 
  pattern, 
  isActive, 
  canDelete = false, 
  onSelectPattern, 
  onDeletePattern 
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Card
      className={isActive ? 'gap-0 py-4 border-primary/60 bg-card/80 ' : 'gap-0 py-4 bg-card/60'}
    >
      <CardHeader className="px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{pattern.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge>{pattern.gridSize}x{pattern.gridSize}</Badge>
            {canDelete && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Options"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-8 z-20 w-32 rounded-lg border border-border bg-popover shadow-xl">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                          onDeletePattern?.(pattern.id);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground px-4">
        <p>{pattern.description}</p>
        <Button
          type="button"
          variant={isActive ? 'secondary' : 'outline'}
          className="w-full mt-3"
          onClick={() => onSelectPattern(pattern)}
        >
          {isActive ? 'Active Pattern' : 'Load Pattern'}
        </Button>
      </CardContent>
    </Card>
  );
}