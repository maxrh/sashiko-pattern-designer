import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
} from "./ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { CanvasSettings } from './CanvasSettings.jsx';
import { PatternSelector } from './PatternSelector.jsx';
import { ScanQrCode, ChevronsUpDown } from 'lucide-react';

export function AppSidebar({
  sidebarTab,
  onSidebarTabChange,
  patternTiles,
  onPatternTilesChange,
  backgroundColor,
  onBackgroundColorChange,
  patternName,
  onPatternNameChange,
  patternDescription,
  onPatternDescriptionChange,
  tileSize,
  onTileSizeChange,
  gridSize,
  onGridSizeChange,
  artboardWidth,
  artboardHeight,
  canvasInfo,
  onNewPattern,
  onSavePattern,
  saveState,
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
  currentPattern,
  stitchColors,
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
            <TabsList className="relative w-full bg-primary ">
              
              <TabsTrigger value="controls" className="relative bg-transparent shadow-none z-10 flex-1 data-[state=inactive]:text-primary-foreground data-[state=active]:bg-transparent">
                Settings
              </TabsTrigger>
              <TabsTrigger value="patterns" className="relative bg-transparent shadow-none z-10 flex-1 data-[state=inactive]:text-primary-foreground data-[state=active]:bg-transparent">
                Library
              </TabsTrigger>
              {/* Sliding background indicator */}
              <div 
                className={`absolute top-1 h-[calc(100%-8px)] rounded-md bg-primary-foreground ${
                  sidebarTab === 'patterns' ? 'left-[50%] right-1 tab-slider-right' : 'left-1 right-[50%] tab-slider-left'
                }`}
              />
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
                    patternDescription={patternDescription}
                    onPatternDescriptionChange={onPatternDescriptionChange}
                    tileSize={tileSize}
                    onTileSizeChange={onTileSizeChange}
                    gridSize={gridSize}
                    onGridSizeChange={onGridSizeChange}
                    artboardWidth={artboardWidth}
                    artboardHeight={artboardHeight}
                    canvasInfo={canvasInfo}
                    onNewPattern={onNewPattern}
                    onSavePattern={onSavePattern}
                    saveState={saveState}
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
                    currentPattern={currentPattern}
                    stitchColors={stitchColors}
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

        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-2 hover:bg-sidebar-accent">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <ScanQrCode className="h-4 w-4" />
              </div>
              <div className="flex flex-1 flex-col items-start text-left text-sm">
                <span className="font-semibold">Sashiko Pattern Designer</span>
                <span className="text-xs text-muted-foreground">Made by MONSUN</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                Link 1
              </DropdownMenuItem>
              <DropdownMenuItem>
                Link 2
              </DropdownMenuItem>
              <DropdownMenuItem>
                Link 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
  );
}
