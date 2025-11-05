import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Trash2, MoreVertical } from 'lucide-react';

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
      className={isActive ? 'border-primary/60 bg-card/80 shadow-md' : 'bg-card/60'}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{pattern.name}</CardTitle>
          <div className="flex items-center gap-2">
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
                  <MoreVertical className="h-4 w-4" />
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
        <CardDescription className="text-xs">
          {pattern.description}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          type="button"
          variant={isActive ? 'secondary' : 'outline'}
          className="w-full"
          onClick={() => onSelectPattern(pattern)}
        >
          {isActive ? 'Active Pattern' : 'Load Pattern'}
        </Button>
      </CardFooter>
    </Card>
  );
}