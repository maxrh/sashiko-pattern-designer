import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
} from "./ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CanvasSettings } from './CanvasSettings.jsx';
import { PatternSelector } from './PatternSelector.jsx';

export function AppSidebar({
  sidebarTab,
  onSidebarTabChange,
  patternTiles,
  onPatternTilesChange,
  backgroundColor,
  onBackgroundColorChange,
  patternName,
  onPatternNameChange,
  tileSize,
  onTileSizeChange,
  gridSize,
  onGridSizeChange,
  artboardSize,
  canvasInfo,
  onNewPattern,
  onSavePattern,
  onResetSettings,
  onExportPattern,
  onImportPattern,
  onExportImage,
  savedPatterns,
  activePatternId,
  onSelectPattern,
  onDeletePattern,
  gridColor,
  onGridColorChange,
  gridOpacity,
  onGridOpacityChange,
  tileOutlineColor,
  onTileOutlineColorChange,
  tileOutlineOpacity,
  onTileOutlineOpacityChange,
  artboardOutlineColor,
  onArtboardOutlineColorChange,
  artboardOutlineOpacity,
  onArtboardOutlineOpacityChange,
}) {
  return (
      <Sidebar>
        <Tabs
          value={sidebarTab}
          onValueChange={onSidebarTabChange}
          defaultValue="controls"
          className="flex h-full min-h-0 flex-col"
        >
          <div className="border-b border-sidebar-border p-4">
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
                <SidebarGroupContent className="space-y-2">
                  <CanvasSettings
                    patternTiles={patternTiles}
                    onPatternTilesChange={onPatternTilesChange}
                    backgroundColor={backgroundColor}
                    onBackgroundColorChange={onBackgroundColorChange}
                    patternName={patternName}
                    onPatternNameChange={onPatternNameChange}
                    tileSize={tileSize}
                    onTileSizeChange={onTileSizeChange}
                    gridSize={gridSize}
                    onGridSizeChange={onGridSizeChange}
                    artboardSize={artboardSize}
                    canvasInfo={canvasInfo}
                    onNewPattern={onNewPattern}
                    onSavePattern={onSavePattern}
                    onResetSettings={onResetSettings}
                    gridColor={gridColor}
                    onGridColorChange={onGridColorChange}
                    gridOpacity={gridOpacity}
                    onGridOpacityChange={onGridOpacityChange}
                    tileOutlineColor={tileOutlineColor}
                    onTileOutlineColorChange={onTileOutlineColorChange}
                    tileOutlineOpacity={tileOutlineOpacity}
                    onTileOutlineOpacityChange={onTileOutlineOpacityChange}
                    artboardOutlineColor={artboardOutlineColor}
                    onArtboardOutlineColorChange={onArtboardOutlineColorChange}
                    artboardOutlineOpacity={artboardOutlineOpacity}
                    onArtboardOutlineOpacityChange={onArtboardOutlineOpacityChange}
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
