import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
} from "./ui/sidebar.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx';
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Tabs
              value={sidebarTab}
              onValueChange={onSidebarTabChange}
              defaultValue="controls"
              className="flex-1 flex flex-col"
            >
              <TabsList className="w-full justify-between">
                <TabsTrigger value="controls" className="flex-1 text-center">
                  Controls
                </TabsTrigger>
                <TabsTrigger value="patterns" className="flex-1 text-center">
                  Patterns
                </TabsTrigger>
              </TabsList>

              <TabsContent value="controls" className="space-y-6">
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
              </TabsContent>

              <TabsContent value="patterns" className="space-y-4">
                <PatternSelector
                  patterns={savedPatterns}
                  activePatternId={activePatternId}
                  onSelectPattern={onSelectPattern}
                  onDeletePattern={onDeletePattern}
                />
              </TabsContent>
            </Tabs>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
