
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { PatternCard } from './PatternCard';

export function PatternSelector({ patterns, activePatternId, onSelectPattern, onDeletePattern }) {
  // Separate built-in patterns from user-saved patterns
  const builtInIds = ['blank', 'asanoha', 'simple-cross', 'diagonal-flow'];
  const builtInPatterns = patterns.filter(p => builtInIds.includes(p.id));
  const userPatterns = patterns.filter(p => !builtInIds.includes(p.id));

  return (
    <div className="space-y-2">
      {/* Built-in Patterns */}
      <Collapsible defaultOpen className="group/collapsible">
        <CollapsibleTrigger className="text-sidebar-foreground/70 ring-sidebar-ring flex shrink-0 items-center justify-between w-full rounded-md px-3 py-3 text-sm font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 hover:bg-sidebar-accent">
          <span>Starter Patterns</span>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid gap-2 py-4">
            {builtInPatterns.map((pattern) => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                isActive={activePatternId === pattern.id}
                canDelete={false}
                onSelectPattern={onSelectPattern}
                onDeletePattern={onDeletePattern}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* User Saved Patterns */}
      {userPatterns.length > 0 && (
        <Collapsible defaultOpen className="group/collapsible">
          <CollapsibleTrigger className="text-sidebar-foreground/70 ring-sidebar-ring flex shrink-0 items-center justify-between w-full rounded-md px-3 py-3 text-sm font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 hover:bg-sidebar-accent">
            <span>My Patterns</span>
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid gap-2 py-4">
              {userPatterns.map((pattern) => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  isActive={activePatternId === pattern.id}
                  canDelete={true}
                  onSelectPattern={onSelectPattern}
                  onDeletePattern={onDeletePattern}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
