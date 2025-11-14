import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

// Default settings constants (non-stitch related)
export const DEFAULT_PATTERN_TILES = 4;
export const DEFAULT_BACKGROUND_COLOR = '#0f172a'; // Dark slate with full opacity (8-char hex)
export const DEFAULT_REPEAT_PATTERN = true;
export const DEFAULT_SHOW_GRID = true;
export const DEFAULT_GRID_COLOR = '#94a3b840'; // Grid color with 25% alpha
export const DEFAULT_TILE_OUTLINE_COLOR = '#94a3b826'; // Tile outline with 15% alpha
export const DEFAULT_ARTBOARD_OUTLINE_COLOR = '#3b82f680'; // Artboard outline with 50% alpha

export default function PatternDesigner() {
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
  const [isEditingProperties, setIsEditingProperties] = useState(false);
  const [tempStitchColor, setTempStitchColor] = useState(null);
  const [tempGapSize, setTempGapSize] = useState(null);
  const [tempStitchSize, setTempStitchSize] = useState(null);
  const [tempStitchWidth, setTempStitchWidth] = useState(null);
  const isColorPickerOpenRef = useRef(false);
  const isGapSliderActiveRef = useRef(false);
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
    '#0f172a', // slate-900
    '#f5f5f5', // neutral-100
    '#a8a29e', // stone-400
    '#475569', // slate-600
    '#14b8a6', // teal-500
    '#fbbf24', // amber-400
    '#fb7185', // rose-400
    '#9f1239', // rose-900
    '#15803d', // green-700
    '#064e3b', // emerald-900
    '#0c4a6e', // sky-900
    '#1e1b4b', // indigo-900
  ]);

  const [sidebarTab, setSidebarTab] = useState('controls');
  const canvasRef = useRef(null);
  const hasInitialized = useRef(false); // Track if initial load is complete

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
        
        // Mark initialization as complete
        hasInitialized.current = true;
      } catch (error) {
        console.error('Failed to initialize database:', error);
        toast.error('Failed to load saved data. Using defaults.');
        hasInitialized.current = true;
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
    historyManager, // Add history manager for reset on import
  });

  // Property editor handlers - stitch size/width with temporary state system
  const {
    handleChangeSelectedStitchSize,
    handleChangeSelectedStitchWidth,
  } = usePropertyEditor({
    selectedStitchIds,
    setCurrentPattern,
    setStitchSize,
    setStitchWidth,
    setTempStitchSize,
    setTempStitchWidth,
    setIsEditingProperties,
  });

  // Handle gap size changes with temporary state for live preview
  const handleChangeSelectedGapSize = useCallback((newGapSize) => {
    if (isGapSliderActiveRef.current) {
      // During slider drag - just update temporary state
      setTempGapSize(newGapSize);
      setIsEditingProperties(true);
    } else {
      // Direct change (not slider) - apply immediately
      setTempGapSize(newGapSize);
      setGapSize(newGapSize);
    }
  }, []);

  // Handle gap slider start/stop
  const handleGapSliderStart = useCallback(() => {
    isGapSliderActiveRef.current = true;
  }, []);

  const handleGapSliderCommit = useCallback(() => {
    // Mark slider as inactive and allow history to be saved
    isGapSliderActiveRef.current = false;
    setIsEditingProperties(false);
    
    // Commit the temporary gap size to global state
    if (tempGapSize !== null) {
      setGapSize(tempGapSize);
    }
  }, [tempGapSize]);

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

  // Canvas update effect - applies temporary values immediately to canvas for live preview
  useEffect(() => {
    if (tempGapSize !== null && selectedStitchIds.size > 0) {
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, gapSize: tempGapSize }
            : stitch
        ),
      }));
    }
  }, [tempGapSize, selectedStitchIds]);

  // Canvas update effect for colors - applies temporary colors for live preview
  useEffect(() => {
    if (tempStitchColor && selectedStitchIds.size > 0) {
      setStitchColors((prev) => {
        const next = new Map(prev);
        selectedStitchIds.forEach((id) => next.set(id, tempStitchColor));
        return next;
      });
    }
  }, [tempStitchColor, selectedStitchIds]);

  // Canvas update effect for stitch size - applies temporary size for live preview
  useEffect(() => {
    if (tempStitchSize !== null && selectedStitchIds.size > 0) {
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, stitchSize: tempStitchSize }
            : stitch
        ),
      }));
    }
  }, [tempStitchSize, selectedStitchIds]);

  // Canvas update effect for stitch width - applies temporary width for live preview
  useEffect(() => {
    if (tempStitchWidth !== null && selectedStitchIds.size > 0) {
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, stitchWidth: tempStitchWidth }
            : stitch
        ),
      }));
    }
  }, [tempStitchWidth, selectedStitchIds]);

  // History update effect - saves to history when property editing ends
  useEffect(() => {
    // Only save to history when we just finished editing properties
    if (!isEditingProperties && (tempGapSize !== null || tempStitchColor !== null || tempStitchSize !== null || tempStitchWidth !== null)) {
      // Use a timeout to batch the history save after property changes settle
      const timeoutId = setTimeout(() => {
        // Save current state to history after property editing is complete
        historyManager.pushHistory({
          pattern: {
            stitches: currentPattern.stitches, // Only save stitches, not config
          },
          stitchColors,
        });
        
        // Clear temporary states
        setTempGapSize(null);
        setTempStitchColor(null);
        setTempStitchSize(null);
        setTempStitchWidth(null);
      }, 100); // Small delay to ensure all state updates are complete
      
      return () => clearTimeout(timeoutId);
    }
  }, [isEditingProperties, tempGapSize, tempStitchColor, tempStitchSize, tempStitchWidth, currentPattern, stitchColors, historyManager]);

  // Save state to history whenever pattern or colors change (for undo/redo)
  // History is now persisted to IndexedDB, so we can record from the start
  // Only skip if we're during the initial database load (first few renders)
  useEffect(() => {
    // Allow history recording once we have any pattern data (even defaults)
    const shouldSkip = currentPattern.stitches.length === 0 && !hasInitialized.current;
    
    if (shouldSkip) return;
    
    // Skip if actively editing properties (gap size, stitch size, etc.)
    if (isEditingProperties) return;
    
    // Skip if we have temporary property changes pending (they'll be saved separately)
    if (tempGapSize !== null || tempStitchColor !== null || tempStitchSize !== null || tempStitchWidth !== null) return;
    
    historyManager.pushHistory({
      pattern: {
        stitches: currentPattern.stitches, // Only save stitches, not config
      },
      stitchColors,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPattern.stitches, stitchColors]); // Only trigger on stitches or colors, NOT config changes

  // Auto-save to database whenever pattern, colors, or settings change
  // This triggers when: stitches added/removed/modified, colors changed, or UI settings changed
  // Only save after initial load is complete to avoid overwriting saved data
  useEffect(() => {
    if (!hasInitialized.current) return;
    
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
      // Only restore stitches, preserve current canvas settings
      setCurrentPattern(prev => ({
        ...prev, // Keep current config (gridSize, tileSize, patternTiles, etc.)
        stitches: prevState.pattern.stitches, // Restore only stitches
      }));
      setStitchColors(prevState.stitchColors);
      setSelectedStitchIds(new Set()); // Clear selection on undo
    }
  }, [historyManager]);

  const handleRedo = useCallback(() => {
    const nextState = historyManager.redo();
    if (nextState) {
      // Only restore stitches, preserve current canvas settings
      setCurrentPattern(prev => ({
        ...prev, // Keep current config (gridSize, tileSize, patternTiles, etc.)
        stitches: nextState.pattern.stitches, // Restore only stitches
      }));
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
    const colorMap = deriveColorMap(cloned);
    setStitchColors(colorMap);
    setSelectedStitchIds(new Set());
    setDrawingState((prev) => ({ ...prev, firstPoint: null }));
    
    // Reset history with loaded pattern as initial state
    historyManager.clearHistory({
      pattern: { stitches: cloned.stitches },
      stitchColors: colorMap,
    });
    
    // Restore UI state if saved with the pattern
    if (pattern.uiState) {
      if (pattern.uiState.backgroundColor) setBackgroundColor(pattern.uiState.backgroundColor);
      if (pattern.uiState.gridColor) setGridColor(pattern.uiState.gridColor);
      if (pattern.uiState.tileOutlineColor) setTileOutlineColor(pattern.uiState.tileOutlineColor);
      if (pattern.uiState.artboardOutlineColor) setArtboardOutlineColor(pattern.uiState.artboardOutlineColor);
      if (pattern.uiState.displayUnit) setDisplayUnit(pattern.uiState.displayUnit);
    }
  }, [historyManager]);

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
    
    // If color picker is open, only store temporarily - don't commit to stitchColors yet
    if (isColorPickerOpenRef.current && selectedStitchIds.size > 0) {
      setTempStitchColor(color);
      setIsEditingProperties(true);
    } else if (selectedStitchIds.size > 0) {
      // Picker is closed, apply immediately (this handles direct color preset clicks)
      setStitchColors((prev) => {
        const next = new Map(prev);
        selectedStitchIds.forEach((id) => next.set(id, color));
        return next;
      });
    }
  }, [selectedStitchIds]);

  const handleColorPickerOpenChange = useCallback((isOpen) => {
    isColorPickerOpenRef.current = isOpen;
    
    if (!isOpen && tempStitchColor && selectedStitchIds.size > 0) {
      // Color picker just closed - commit the temporary color
      setStitchColors((prev) => {
        const next = new Map(prev);
        selectedStitchIds.forEach((id) => next.set(id, tempStitchColor));
        return next;
      });
      
      // Mark editing as complete
      setIsEditingProperties(false);
      
      // Clear temporary color
      setTempStitchColor(null);
    }
  }, [tempStitchColor, selectedStitchIds]);

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
              tempStitchColor={tempStitchColor}
              onSelectedStitchColorChange={handleColorChange}
              onColorPickerOpenChange={handleColorPickerOpenChange}
              colorPresets={colorPresets}
              onAddColorPreset={handleAddColorPreset}
              onRemoveColorPreset={handleRemoveColorPreset}
              stitchSize={stitchSize}
              tempStitchSize={tempStitchSize}
              onStitchSizeChange={handleChangeSelectedStitchSize}
              stitchWidth={stitchWidth}
              tempStitchWidth={tempStitchWidth}
              onStitchWidthChange={handleChangeSelectedStitchWidth}
              gapSize={gapSize}
              tempGapSize={tempGapSize}
              onGapSizeChange={handleChangeSelectedGapSize}
              onGapSliderStart={handleGapSliderStart}
              onGapSliderCommit={handleGapSliderCommit}
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
            tempStitchColor={tempStitchColor}
            tempGapSize={tempGapSize}
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
