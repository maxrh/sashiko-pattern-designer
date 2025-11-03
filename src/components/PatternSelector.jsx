import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { Separator } from './ui/separator.jsx';
import { ScrollArea } from './ui/scroll-area.jsx';

export function PatternSelector({ patterns, activePatternId, onSelectPattern, onDeletePattern }) {
  const [openMenuId, setOpenMenuId] = useState(null);

  // Separate built-in patterns from user-saved patterns
  const builtInIds = ['blank', 'asanoha', 'simple-cross', 'diagonal-flow'];
  const builtInPatterns = patterns.filter(p => builtInIds.includes(p.id));
  const userPatterns = patterns.filter(p => !builtInIds.includes(p.id));

  const renderPattern = (pattern, canDelete = false) => {
    const isActive = activePatternId === pattern.id;
    const isMenuOpen = openMenuId === pattern.id;
    
    return (
      <Card
        key={pattern.id}
        className={isActive ? 'border-sky-500/60 bg-slate-900/80 shadow-md' : 'bg-slate-900/60'}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white">{pattern.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge>{pattern.gridSize}x{pattern.gridSize}</Badge>
              {canDelete && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : pattern.id);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
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
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 top-8 z-20 w-32 rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            onDeletePattern?.(pattern.id);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
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
        <Separator className="opacity-20" />
        <CardContent className="pt-3 text-xs text-slate-300">
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
  };

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-4">
        {/* Built-in Patterns */}
        <div className="space-y-3">
          <div className="flex items-center justify-between sticky top-0 py-2 z-10">
            <h2 className="text-sm font-semibold text-slate-200">Built-in Patterns</h2>
            <Badge variant="outline">{builtInPatterns.length} designs</Badge>
          </div>
          <div className="grid gap-3">
            {builtInPatterns.map((pattern) => renderPattern(pattern, false))}
          </div>
        </div>

        {/* User Saved Patterns */}
        {userPatterns.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between sticky top-0 py-2 z-10">
              <h2 className="text-sm font-semibold text-slate-200">My Patterns</h2>
              <Badge variant="outline">{userPatterns.length} saved</Badge>
            </div>
            <div className="grid gap-3">
              {userPatterns.map((pattern) => renderPattern(pattern, true))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
