import { 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent 
} from './ui/sidebar';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { PatternCard } from './PatternCard';

export function PatternSelector({ patterns, activePatternId, onSelectPattern, onDeletePattern }) {
  // Separate built-in patterns from user-saved patterns
  const builtInIds = ['blank', 'asanoha', 'simple-cross', 'diagonal-flow'];
  const builtInPatterns = patterns.filter(p => builtInIds.includes(p.id));
  const userPatterns = patterns.filter(p => !builtInIds.includes(p.id));

  return (
    <div className="space-y">
      {/* Built-in Patterns */}
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-sidebar-accent rounded-lg">
              <span className="text-sm font-semibold text-foreground">Starter Patterns</span>
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </div>
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <div className="grid gap-3 mt-3">
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
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      {/* User Saved Patterns */}
      {userPatterns.length > 0 && (
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-sidebar-accent rounded-lg">
                <span className="text-sm font-semibold text-foreground">My Patterns</span>
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </div>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <div className="grid gap-3 mt-3">
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
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      )}
    </div>
  );
}
