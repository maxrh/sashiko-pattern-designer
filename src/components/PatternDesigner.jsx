import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import patternsData from '../data/patterns.json';
import { CanvasViewport } from './CanvasViewport.jsx';
import { Toolbar } from './Toolbar.jsx';
import { AppSidebar } from './AppSidebar.jsx';
import { HelpButton } from './HelpButton.jsx';
import OfflineIndicator from './OfflineIndicator.jsx';
import { SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';
import { 
  DEFAULT_GAP_SIZE, 
  DEFAULT_STITCH_COLOR, 
  DEFAULT_STITCH_SIZE, 
  DEFAULT_STITCH_WIDTH 
} from './Stitches.jsx';
import { DEFAULT_UNIT, formatValueNumber } from '../lib/unitConverter.js';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';
import { useHistory } from '../hooks/useHistory.js';
import { usePatternLibrary } from '../hooks/usePatternLibrary.js';
import { usePatternState } from '../hooks/usePatternState.js';
import { usePatternImportExport } from '../hooks/usePatternImportExport.js';
import { usePropertyEditor } from '../hooks/usePropertyEditor.js';
import { 
  normalizeTileSize,
  normalizePatternTiles,
  clonePattern,
  deriveColorMap,
  DEFAULT_GRID_SIZE,
} from '../lib/patternUtils.js';
import { 
  saveCurrentPattern, 
  loadCurrentPattern,
} from '../lib/patternStorage.js';
import { initializeDatabase } from '../lib/db.js';

const COLOR_PRESETS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'White', value: '#f5f5f5' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Coral', value: '#fb7185' },
  { label: 'Black', value: '#0b1120' },
];

// Default settings constants (non-stitch related)
export const DEFAULT_PATTERN_TILES = 4;
export const DEFAULT_BACKGROUND_COLOR = '#0f172a'; // Dark slate with full opacity (8-char hex)
export const DEFAULT_REPEAT_PATTERN = true;
export const DEFAULT_SHOW_GRID = true;
export const DEFAULT_GRID_COLOR = '#94a3b840'; // Grid color with 25% alpha
export const DEFAULT_TILE_OUTLINE_COLOR = '#94a3b826'; // Tile outline with 15% alpha
export const DEFAULT_ARTBOARD_OUTLINE_COLOR = '#3b82f680'; // Artboard outline with 50% alpha

// Memoize built-in patterns to prevent repeated cloning
const BUILT_IN_PATTERNS = patternsData.map(clonePattern);export default function PatternDesigner() {
  // Pattern library management
  const { savedPatterns, saveState, savePattern, removePattern } = usePatternLibrary();

  // Core pattern state management
  const {
    currentPattern,
    setCurrentPattern,
    stitchColors,
    setStitchColors,
    selectedStitchIds,
    setSelectedStitchIds,
    drawingState,
    setDrawingState,
    patternTiles,
    setPatternTiles,
  } = usePatternState();

  // Undo/redo history
  const historyManager = useHistory(10);
  // Use constant for default stitch color (fallback for rendering)
  const defaultStitchColor = DEFAULT_STITCH_COLOR;
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND_COLOR);
  const [selectedStitchColor, setSelectedStitchColor] = useState(DEFAULT_STITCH_COLOR);
  const [stitchSize, setStitchSize] = useState(DEFAULT_STITCH_SIZE);
  const [stitchWidth, setStitchWidth] = useState(DEFAULT_STITCH_WIDTH);
  const [gapSize, setGapSize] = useState(DEFAULT_GAP_SIZE);
  const [repeatPattern, setRepeatPattern] = useState(DEFAULT_REPEAT_PATTERN);
  const [showGrid, setShowGrid] = useState(DEFAULT_SHOW_GRID);

  // Grid and outline appearance settings
  const [gridColor, setGridColor] = useState(DEFAULT_GRID_COLOR);
  const [tileOutlineColor, setTileOutlineColor] = useState(DEFAULT_TILE_OUTLINE_COLOR);
  const [artboardOutlineColor, setArtboardOutlineColor] = useState(DEFAULT_ARTBOARD_OUTLINE_COLOR);
  
  // Unit preference for display (px or mm)
  const [displayUnit, setDisplayUnit] = useState(DEFAULT_UNIT);

  // Color presets for SketchPicker
  const [colorPresets, setColorPresets] = useState([
    '#6366f1', // Indigo
    '#f5f5f5', // White
    '#ef4444', // Red
    '#14b8a6', // Teal
    '#fb7185', // Coral
    '#0b1120', // Black
  ]);

  const [sidebarTab, setSidebarTab] = useState('controls');
  const [isInitialized, setIsInitialized] = useState(false);
  const canvasRef = useRef(null);

  // Initialize database and load saved state
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize Dexie database
        await initializeDatabase();
        
        // Load saved current pattern and UI state
        const saved = await loadCurrentPattern();
        if (saved) {
          if (saved.pattern) {
            setCurrentPattern(saved.pattern);
          }
          if (saved.stitchColors) {
            setStitchColors(saved.stitchColors);
          }
          if (saved.uiState) {
            const ui = saved.uiState;
            if (ui.backgroundColor) setBackgroundColor(ui.backgroundColor);
            if (ui.selectedStitchColor) setSelectedStitchColor(ui.selectedStitchColor);
            if (ui.stitchSize) setStitchSize(ui.stitchSize);
            if (ui.stitchWidth) setStitchWidth(ui.stitchWidth);
            if (ui.gapSize !== undefined) setGapSize(ui.gapSize);
            if (ui.repeatPattern !== undefined) setRepeatPattern(ui.repeatPattern);
            if (ui.showGrid !== undefined) setShowGrid(ui.showGrid);
            if (ui.gridColor) setGridColor(ui.gridColor);
            if (ui.tileOutlineColor) setTileOutlineColor(ui.tileOutlineColor);
            if (ui.artboardOutlineColor) setArtboardOutlineColor(ui.artboardOutlineColor);
            if (ui.displayUnit) setDisplayUnit(ui.displayUnit);
            if (ui.colorPresets) setColorPresets(ui.colorPresets);
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        toast.error('Failed to load saved data. Using defaults.');
        setIsInitialized(true);
      }
    };

    initialize();
  }, [setCurrentPattern, setStitchColors]);

  // Pattern import/export operations
  const { exportPattern, importPattern, exportImage, copyPatternToClipboard } = usePatternImportExport({
    currentPattern,
    stitchColors,
    backgroundColor,
    gridColor,
    tileOutlineColor,
    artboardOutlineColor,
    selectedStitchColor,
    stitchSize,
    stitchWidth,
    gapSize,
    repeatPattern,
    showGrid,
    setCurrentPattern,
    setStitchColors,
    setSelectedStitchIds,
    setDrawingState,
    setBackgroundColor,
    setGridColor,
    setTileOutlineColor,
    setArtboardOutlineColor,
    canvasRef,
  });

  // Property editor handlers
  const {
    handleChangeSelectedStitchSize,
    handleChangeSelectedStitchWidth,
    handleChangeSelectedGapSize,
  } = usePropertyEditor({
    selectedStitchIds,
    setCurrentPattern,
    setStitchSize,
    setStitchWidth,
    setGapSize,
    historyManager,
  });

  // Sync pattern tiles with current pattern
  useEffect(() => {
    const normalized = normalizePatternTiles(currentPattern.patternTiles);
    if (normalized.x !== patternTiles.x || normalized.y !== patternTiles.y) {
      setPatternTiles(normalized);
    }
  }, [currentPattern.patternTiles, patternTiles.x, patternTiles.y]);

  // Update sidebar options when selection changes
  useEffect(() => {
    if (selectedStitchIds.size > 0) {
      const selectedStitches = currentPattern.stitches.filter(stitch => 
        selectedStitchIds.has(stitch.id)
      );
      
      // Update stitch size if all selected stitches have the same size
      const stitchSizes = selectedStitches.map(s => s.stitchSize);
      const uniqueSizes = [...new Set(stitchSizes)];
      if (uniqueSizes.length === 1 && uniqueSizes[0]) {
        setStitchSize(uniqueSizes[0]);
      }
      
      // Update stitch width if all selected stitches have the same width
      const stitchWidths = selectedStitches.map(s => s.stitchWidth || 'normal');
      const uniqueWidths = [...new Set(stitchWidths)];
      if (uniqueWidths.length === 1 && uniqueWidths[0]) {
        setStitchWidth(uniqueWidths[0]);
      }
      
      // Update repeat pattern if all selected stitches have the same repeat setting
      const repeatSettings = selectedStitches.map(s => s.repeat !== false);
      const uniqueRepeats = [...new Set(repeatSettings)];
      if (uniqueRepeats.length === 1) {
        setRepeatPattern(uniqueRepeats[0]);
      }
      
      // Update color if all selected stitches have the same color
      const colors = selectedStitches.map(s => stitchColors.get(s.id) || s.color || defaultStitchColor);
      const uniqueColors = [...new Set(colors)];
      if (uniqueColors.length === 1 && uniqueColors[0]) {
        setSelectedStitchColor(uniqueColors[0]);
      }
      
      // Update gap size if all selected stitches have the same gap size
      const gapSizes = selectedStitches.map(s => s.gapSize ?? DEFAULT_GAP_SIZE);
      const uniqueGapSizes = [...new Set(gapSizes)];
      if (uniqueGapSizes.length === 1 && uniqueGapSizes[0] !== undefined) {
        setGapSize(uniqueGapSizes[0]);
      }
    }
    // When nothing selected, preserve the current selectedStitchColor for drawing
    // Don't reset it to defaultStitchColor to maintain user's color choice
  }, [selectedStitchIds, currentPattern.stitches, stitchColors, defaultStitchColor]);

  // Save to history when selection changes (after property editing is done)
  useEffect(() => {
    historyManager.saveAfterPropertyEdit({
      pattern: currentPattern,
      stitchColors,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStitchIds, currentPattern, stitchColors]);

  // Save state to history whenever pattern or colors change (for undo/redo)
  useEffect(() => {
    historyManager.pushHistory({
      pattern: currentPattern,
      stitchColors,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPattern, stitchColors]);

  // Auto-save to database whenever pattern, colors, or settings change
  // This triggers when: stitches added/removed/modified, colors changed, or UI settings changed
  // Only save after initialization is complete
  useEffect(() => {
    if (!isInitialized) return;
    
    saveCurrentPattern(currentPattern, stitchColors, {
      patternTiles,
      defaultThreadColor: defaultStitchColor,
      backgroundColor,
      selectedStitchColor,
      stitchSize,
      stitchWidth,
      gapSize,
      repeatPattern,
      showGrid,
      gridColor,
      tileOutlineColor,
      artboardOutlineColor,
      displayUnit,
      colorPresets,
    });
  }, [
    isInitialized,
    currentPattern,
    stitchColors,
    patternTiles,
    backgroundColor,
    selectedStitchColor,
    stitchSize,
    stitchWidth,
    gapSize,
    repeatPattern,
    showGrid,
    gridColor,
    tileOutlineColor,
    artboardOutlineColor,
    displayUnit,
    colorPresets,
  ]);

  // Artboard = the total area containing all pattern tiles
  // (not to be confused with canvas which includes padding around the artboard)
  const artboardWidth = useMemo(() => {
    const tileSize = normalizeTileSize(currentPattern.tileSize);
    const gridSize = currentPattern.gridSize ?? DEFAULT_GRID_SIZE;
    const tilesX = patternTiles.x || 4;
    const width = tilesX * (tileSize.x || 10) * gridSize;
    return isNaN(width) ? 800 : width; // Fallback to 800 if calculation fails
  }, [patternTiles.x, currentPattern.tileSize, currentPattern.gridSize]);

  const artboardHeight = useMemo(() => {
    const tileSize = normalizeTileSize(currentPattern.tileSize);
    const gridSize = currentPattern.gridSize ?? DEFAULT_GRID_SIZE;
    const tilesY = patternTiles.y || 4;
    const height = tilesY * (tileSize.y || 10) * gridSize;
    return isNaN(height) ? 800 : height; // Fallback to 800 if calculation fails
  }, [patternTiles.y, currentPattern.tileSize, currentPattern.gridSize]);

  const canvasInfo = useMemo(() => {
    const ts = normalizeTileSize(currentPattern.tileSize);
    const artW = formatValueNumber(artboardWidth, displayUnit);
    const artH = formatValueNumber(artboardHeight, displayUnit);
    const gridSz = formatValueNumber(currentPattern.gridSize || DEFAULT_GRID_SIZE, displayUnit);
    return `Artboard: ${artW}×${artH}${displayUnit} · Tiles: ${patternTiles.x}×${patternTiles.y} · Tile grid: ${ts.x}×${ts.y} · Grid size: ${gridSz}${displayUnit}`;
  }, [artboardWidth, artboardHeight, currentPattern.tileSize, currentPattern.gridSize, patternTiles.x, patternTiles.y, displayUnit]);

  const patternInfo = useMemo(() => {
    const tileSize = normalizeTileSize(currentPattern.tileSize);
    return `${patternTiles}×${patternTiles} pattern tiles (${tileSize.x}×${tileSize.y} grid each)`;
  }, [patternTiles, currentPattern.tileSize]);

  const handleModeChange = useCallback((mode) => {
    setDrawingState({ mode, firstPoint: null });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = currentPattern.stitches.map((stitch) => stitch.id);
    setSelectedStitchIds(new Set(allIds));
  }, [currentPattern.stitches]);

  const handleDeselectAll = useCallback(() => {
    setSelectedStitchIds(new Set());
  }, []);

  const handleUndo = useCallback(() => {
    const prevState = historyManager.undo();
    if (prevState) {
      setCurrentPattern(prevState.pattern);
      setStitchColors(prevState.stitchColors);
      setSelectedStitchIds(new Set()); // Clear selection on undo
    }
  }, [historyManager]);

  const handleRedo = useCallback(() => {
    const nextState = historyManager.redo();
    if (nextState) {
      setCurrentPattern(nextState.pattern);
      setStitchColors(nextState.stitchColors);
      setSelectedStitchIds(new Set()); // Clear selection on redo
    }
  }, [historyManager]);

  const handleAddStitch = useCallback(({ start, end, stitchSize, repeat }) => {
    const newId = `stitch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    
    const newStitch = {
      id: newId,
      start,
      end,
      color: null,
      stitchSize: stitchSize,
      stitchWidth: stitchWidth,
      gapSize: gapSize,
      repeat: repeat !== undefined ? repeat : true,
    };
    setCurrentPattern((prev) => ({
      ...prev,
      stitches: [...prev.stitches, newStitch],
    }));
    
    // Apply the selected stitch color to the new stitch
    setStitchColors((prev) => {
      const next = new Map(prev);
      next.set(newId, selectedStitchColor);
      return next;
    });
    
    // Don't auto-select newly created stitches
    setSelectedStitchIds(new Set());
  }, [selectedStitchColor, stitchWidth, gapSize]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedStitchIds.size === 0) return;
    setCurrentPattern((prev) => ({
      ...prev,
      stitches: prev.stitches.filter((stitch) => !selectedStitchIds.has(stitch.id)),
    }));
    setStitchColors((prev) => {
      const next = new Map(prev);
      selectedStitchIds.forEach((id) => next.delete(id));
      return next;
    });
    setSelectedStitchIds(new Set());
    setDrawingState((prev) => ({ ...prev, firstPoint: null }));
  }, [selectedStitchIds]);

  const handleChangeRepeatPattern = useCallback((newRepeat) => {
    if (selectedStitchIds.size > 0) {
      // Update selected stitches
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, repeat: newRepeat }
            : stitch
        ),
      }));
    } else {
      // Update default for draw tool
      setRepeatPattern(newRepeat);
    }
  }, [selectedStitchIds]);

  const handleNewPattern = useCallback(() => {
    const tileSize = normalizeTileSize(currentPattern.tileSize);
    const gridSize = currentPattern.gridSize || 20;
    const freshPattern = {
      id: `pattern-${Date.now()}`,
      name: 'Untitled Pattern',
      description: '',
      tileSize,
      gridSize,
      patternTiles,
      stitches: [],
    };
    setCurrentPattern(freshPattern);
    setSelectedStitchIds(new Set());
    setStitchColors(new Map());
    setDrawingState((prev) => ({ ...prev, firstPoint: null }));
  }, [currentPattern.tileSize, currentPattern.gridSize]);

  const handlePatternNameChange = useCallback((name) => {
    setCurrentPattern((prev) => ({ ...prev, name }));
  }, []);

  const handlePatternDescriptionChange = useCallback((description) => {
    setCurrentPattern((prev) => ({ ...prev, description }));
  }, []);

  const handleTileSizeChange = useCallback((axis, value) => {
    setCurrentPattern((prev) => {
      const normalized = normalizeTileSize(prev.tileSize);
      const newTileSize = {
        ...normalized,
        [axis]: value
      };
      
      // Filter out stitches that would be completely outside the new tile bounds
      // Keep stitches if ANY part of the line would be visible within [0, tileSize]
      const filteredStitches = prev.stitches.filter(stitch => {
        // Absolute stitches (repeat: false) are always kept - they use artboard coordinates
        if (stitch.repeat === false) return true;
        
        // Pattern stitches: Keep if any endpoint or the line itself intersects [0, newTileSize]
        // Check if at least one endpoint is within valid range, OR line crosses through valid range
        
        const startXValid = stitch.start.x >= -1 && stitch.start.x <= newTileSize.x + 1;
        const startYValid = stitch.start.y >= -1 && stitch.start.y <= newTileSize.y + 1;
        const endXValid = stitch.end.x >= -1 && stitch.end.x <= newTileSize.x + 1;
        const endYValid = stitch.end.y >= -1 && stitch.end.y <= newTileSize.y + 1;
        
        // Keep if at least one endpoint has both coordinates in valid range
        const startValid = startXValid && startYValid;
        const endValid = endXValid && endYValid;
        
        return startValid || endValid;
      });
      
      // If we removed stitches, also clean up their colors
      if (filteredStitches.length < prev.stitches.length) {
        const keptIds = new Set(filteredStitches.map(s => s.id));
        setStitchColors(prevColors => {
          const newColors = new Map(prevColors);
          for (const [id] of prevColors) {
            if (!keptIds.has(id)) {
              newColors.delete(id);
            }
          }
          return newColors;
        });
        
        // Clear selection if any selected stitches were removed
        setSelectedStitchIds(prevSelected => {
          const newSelected = new Set();
          for (const id of prevSelected) {
            if (keptIds.has(id)) {
              newSelected.add(id);
            }
          }
          return newSelected;
        });
      }
      
      return {
        ...prev,
        tileSize: newTileSize,
        stitches: filteredStitches
      };
    });
  }, [setStitchColors, setSelectedStitchIds]);

  const handleGridSizeChange = useCallback((gridSize) => {
    setCurrentPattern((prev) => ({ ...prev, gridSize }));
  }, []);

  const handlePatternTilesChange = useCallback((axis, value) => {
    setPatternTiles(prev => ({
      ...prev,
      [axis]: value
    }));
    setCurrentPattern((prev) => ({
      ...prev,
      patternTiles: {
        ...normalizePatternTiles(prev.patternTiles),
        [axis]: value
      }
    }));
  }, []);

  const handleResetSettings = useCallback(() => {
    // Reset all settings to their default values
    setPatternTiles(normalizePatternTiles(DEFAULT_PATTERN_TILES));
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
    setSelectedStitchColor(DEFAULT_STITCH_COLOR);
    setStitchSize(DEFAULT_STITCH_SIZE);
    setStitchWidth(DEFAULT_STITCH_WIDTH);
    setGapSize(DEFAULT_GAP_SIZE);
    setRepeatPattern(DEFAULT_REPEAT_PATTERN);
    setShowGrid(DEFAULT_SHOW_GRID);
    setGridColor(DEFAULT_GRID_COLOR);
    setTileOutlineColor(DEFAULT_TILE_OUTLINE_COLOR);
    setArtboardOutlineColor(DEFAULT_ARTBOARD_OUTLINE_COLOR);
  }, []);

  const handleSelectPattern = useCallback((pattern) => {
    if (!pattern) return;
    const cloned = clonePattern(pattern);
    setCurrentPattern(cloned);
    setStitchColors(deriveColorMap(cloned));
    setSelectedStitchIds(new Set());
    setDrawingState((prev) => ({ ...prev, firstPoint: null }));
    
    // Restore UI state if saved with the pattern
    if (pattern.uiState) {
      if (pattern.uiState.backgroundColor) setBackgroundColor(pattern.uiState.backgroundColor);
      if (pattern.uiState.gridColor) setGridColor(pattern.uiState.gridColor);
      if (pattern.uiState.tileOutlineColor) setTileOutlineColor(pattern.uiState.tileOutlineColor);
      if (pattern.uiState.artboardOutlineColor) setArtboardOutlineColor(pattern.uiState.artboardOutlineColor);
      if (pattern.uiState.displayUnit) setDisplayUnit(pattern.uiState.displayUnit);
    }
  }, []);

  const handleSavePattern = useCallback(async () => {
    const uiState = {
      backgroundColor,
      gridColor,
      tileOutlineColor,
      artboardOutlineColor,
      selectedStitchColor,
      stitchSize,
      stitchWidth,
      repeatPattern,
      showGrid,
      displayUnit,
    };
    
    const result = await savePattern(currentPattern, stitchColors, uiState);
    
    if (result.success) {
      // Update current pattern ID if it changed (new pattern or renamed)
      if (result.pattern.id !== currentPattern.id) {
        setCurrentPattern({
          ...currentPattern,
          id: result.pattern.id,
        });
      }
    } else {
      alert(`Failed to save pattern: ${result.error}`);
    }
  }, [currentPattern, stitchColors, backgroundColor, gridColor, tileOutlineColor, artboardOutlineColor, selectedStitchColor, stitchSize, stitchWidth, repeatPattern, showGrid, displayUnit, savePattern]);

  const handleDeletePattern = useCallback((patternId) => {
    removePattern(patternId);
    
    // If the deleted pattern was currently loaded, switch to blank
    if (currentPattern.id === patternId) {
      handleNewPattern();
    }
    
    // Show success toast
    toast.success('Pattern deleted successfully');
  }, [currentPattern.id, handleNewPattern, removePattern]);

  const handleColorChange = useCallback((color) => {
    if (!color) return;
    
    // Update the selected stitch color state (used for drawing new stitches)
    setSelectedStitchColor(color);
    
    // Auto-apply the color to selected stitches
    if (selectedStitchIds.size > 0) {
      setStitchColors((prev) => {
        const next = new Map(prev);
        selectedStitchIds.forEach((id) => next.set(id, color));
        return next;
      });
    }
    // When no selection, just updating selectedStitchColor is enough
    // This will be used for the next drawn stitch
  }, [selectedStitchIds]);

  const handleAddColorPreset = useCallback((color) => {
    if (!color) return;
    setColorPresets((prev) => {
      if (!prev.includes(color)) {
        return [...prev, color];
      }
      return prev;
    });
  }, []);

  const handleRemoveColorPreset = useCallback((color) => {
    setColorPresets((prev) => prev.filter(c => c !== color));
  }, []);

  const handleResetColorPresets = useCallback(() => {
    setColorPresets([
      '#6366f1', // Indigo
      '#f5f5f5', // White
      '#ef4444', // Red
      '#14b8a6', // Teal
      '#fb7185', // Coral
      '#0b1120', // Black
    ]);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSelectMode: useCallback(() => setDrawingState((prev) => ({ ...prev, mode: 'select', firstPoint: null })), []),
    onDrawMode: useCallback(() => setDrawingState((prev) => ({ ...prev, mode: 'draw', firstPoint: null })), []),
    onToggleRepeat: useCallback(() => setRepeatPattern((prev) => !prev), []),
    onToggleGrid: useCallback(() => setShowGrid((prev) => !prev), []),
    onDelete: handleDeleteSelected,
    onEscape: useCallback(() => setDrawingState((prev) => ({ ...prev, firstPoint: null })), []),
    selectedCount: selectedStitchIds.size,
  });

  return (
    <SidebarProvider className="flex h-screen overflow-hidden">
      {/* Left Sidebar */}
      <AppSidebar
        sidebarTab={sidebarTab}
        onSidebarTabChange={setSidebarTab}
        patternTiles={patternTiles}
        onPatternTilesChange={handlePatternTilesChange}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={setBackgroundColor}
        patternName={currentPattern.name}
        onPatternNameChange={handlePatternNameChange}
        patternDescription={currentPattern.description || ''}
        onPatternDescriptionChange={handlePatternDescriptionChange}
        tileSize={normalizeTileSize(currentPattern.tileSize)}
        onTileSizeChange={handleTileSizeChange}
        gridSize={currentPattern.gridSize || DEFAULT_GRID_SIZE}
        onGridSizeChange={handleGridSizeChange}
        displayUnit={displayUnit}
        onDisplayUnitChange={setDisplayUnit}
        artboardWidth={artboardWidth}
        artboardHeight={artboardHeight}
        canvasInfo={canvasInfo}
        onNewPattern={handleNewPattern}
        onSavePattern={handleSavePattern}
        saveState={saveState}
        onResetSettings={handleResetSettings}
        onExportPattern={exportPattern}
        onImportPattern={importPattern}
        onExportImage={exportImage}
        onCopyPatternToClipboard={copyPatternToClipboard}
        savedPatterns={savedPatterns}
        activePatternId={currentPattern.id}
        onSelectPattern={(pattern) => {
          handleSelectPattern(pattern);
        }}
        onDeletePattern={handleDeletePattern}
        gridColor={gridColor}
        onGridColorChange={setGridColor}
        tileOutlineColor={tileOutlineColor}
        onTileOutlineColorChange={setTileOutlineColor}
        artboardOutlineColor={artboardOutlineColor}
        onArtboardOutlineColorChange={setArtboardOutlineColor}
        colorPresets={colorPresets}
        onAddColorPreset={handleAddColorPreset}
        onRemoveColorPreset={handleRemoveColorPreset}
        currentPattern={currentPattern}
        stitchColors={stitchColors}
      />

      {/* Main Content Area */}
      <main className="flex h-screen flex-1 flex-col overflow-hidden bg-background text-foreground">
        <header className="flex-none border-b border-border bg-sidebar px-6 py-4 ">
          <div className="flex items-center justify-between gap-4">
            <Toolbar
              drawingMode={drawingState.mode}
              onModeChange={handleModeChange}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              repeatPattern={repeatPattern}
              onRepeatPatternChange={handleChangeRepeatPattern}
              selectedStitchColor={selectedStitchColor}
              onSelectedStitchColorChange={handleColorChange}
              colorPresets={colorPresets}
              onAddColorPreset={handleAddColorPreset}
              onRemoveColorPreset={handleRemoveColorPreset}
              stitchSize={stitchSize}
              onStitchSizeChange={handleChangeSelectedStitchSize}
              stitchWidth={stitchWidth}
              onStitchWidthChange={handleChangeSelectedStitchWidth}
              gapSize={gapSize}
              onGapSizeChange={handleChangeSelectedGapSize}
              showGrid={showGrid}
              onShowGridChange={setShowGrid}
              displayUnit={displayUnit}
              onDisplayUnitChange={setDisplayUnit}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyManager.canUndo}
              canRedo={historyManager.canRedo}
              selectedStitch={selectedStitchIds.size === 1 ? currentPattern.stitches.find(s => selectedStitchIds.has(s.id)) : null}
            />
            <div className="ml-auto flex items-center gap-2">
              <OfflineIndicator />
              <HelpButton />
            </div>
          </div>
        </header>

        <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        

          <CanvasViewport
            ref={canvasRef}
            patternTiles={patternTiles}
            pattern={currentPattern}
            stitchColors={stitchColors}
            selectedStitchIds={selectedStitchIds}
            onSelectStitchIds={setSelectedStitchIds}
            onAddStitch={handleAddStitch}
            drawingState={drawingState}
            onDrawingStateChange={setDrawingState}
            defaultStitchColor={defaultStitchColor}
            backgroundColor={backgroundColor}
            stitchSize={stitchSize}
            repeatPattern={repeatPattern}
            showGrid={showGrid}
            gridColor={gridColor}
            tileOutlineColor={tileOutlineColor}
            artboardOutlineColor={artboardOutlineColor}
          />
        </div>
      </main>
      <Toaster />
    </SidebarProvider>
  );
}
