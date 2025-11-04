import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
} from "./ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CanvasSettings } from './CanvasSettings.jsx';
import { ExportPanel } from './ExportPanel.jsx';
import { PatternSelector } from './PatternSelector.jsx';

export function AppSidebar({
  sidebarTab,
  onSidebarTabChange,
  patternTiles,
  onPatternTilesChange,
  backgroundColor,
  onBackgroundColorChange,
  defaultThreadColor,
  onDefaultThreadColorChange,
  patternName,
  onPatternNameChange,
  canvasInfo,
  onNewPattern,
  onSavePattern,
  onExportPattern,
  onImportPattern,
  onExportImage,
  savedPatterns,
  activePatternId,
  onSelectPattern,
  onDeletePattern,
}) {
  return (
      <Sidebar>
        <Tabs
          value={sidebarTab}
          onValueChange={onSidebarTabChange}
          defaultValue="controls"
          className="flex h-full min-h-0 flex-col"
        >
          <div className="border-b border-sidebar-border p-2">
            <TabsList className="w-full">
              <TabsTrigger value="controls" className="flex-1">
                Controls
              </TabsTrigger>
              <TabsTrigger value="patterns" className="flex-1">
                Patterns
              </TabsTrigger>
            </TabsList>
          </div>

          <SidebarContent>
            <TabsContent value="controls" className="mt-0">
              <SidebarGroup>
                <SidebarGroupContent className="space-y-6">
                  <CanvasSettings
                    patternTiles={patternTiles}
                    onPatternTilesChange={onPatternTilesChange}
                    backgroundColor={backgroundColor}
                    onBackgroundColorChange={onBackgroundColorChange}
                    defaultThreadColor={defaultThreadColor}
                    onDefaultThreadColorChange={onDefaultThreadColorChange}
                    patternName={patternName}
                    onPatternNameChange={onPatternNameChange}
                    canvasInfo={canvasInfo}
                  />
                  <ExportPanel
                    onNewPattern={onNewPattern}
                    onSavePattern={onSavePattern}
                    onExportPattern={onExportPattern}
                    onImportPattern={onImportPattern}
                    onExportImage={onExportImage}
                  />
                </SidebarGroupContent>
              </SidebarGroup>
            </TabsContent>

            <TabsContent value="patterns" className="mt-0">
              <SidebarGroup>
                <SidebarGroupContent>
                  <PatternSelector
                    patterns={savedPatterns}
                    activePatternId={activePatternId}
                    onSelectPattern={onSelectPattern}
                    onDeletePattern={onDeletePattern}
                  />
                </SidebarGroupContent>
              </SidebarGroup>
            </TabsContent>
          </SidebarContent>
        </Tabs>
      </Sidebar>
  );
}
