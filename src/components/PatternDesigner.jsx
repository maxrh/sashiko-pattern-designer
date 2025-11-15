import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CanvasViewport } from './CanvasViewport.jsx';
import { Toolbar } from './Toolbar.jsx';
import { AppSidebar } from './AppSidebar.jsx';
import { HelpButton } from './HelpButton.jsx';
import OfflineIndicator from './OfflineIndicator.jsx';
import VersionBadge from './VersionBadge.jsx';
import { SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';
import { useHistory } from '../hooks/useHistory.js';
import { usePatternLibrary } from '../hooks/usePatternLibrary.js';
import { usePatternState } from '../hooks/usePatternState.js';
import { usePatternImportExport } from '../hooks/usePatternImportExport.js';
import { usePropertyEditor } from '../hooks/usePropertyEditor.js';
import { usePatternActions } from '../hooks/usePatternActions.js';
import { 
  useUiState,
  DEFAULT_STITCH_COLOR,
  DEFAULT_GAP_SIZE,
  DEFAULT_GRID_SIZE,
} from '../hooks/useUiState.js';
import { useAutoSave } from '../hooks/useAutoSave.js';
import { 
  normalizeTileSize,
  normalizePatternTiles,
  clonePattern,
  deriveColorMap,
} from '../lib/patternUtils.js';
import { 
  saveCurrentPattern, 
  loadCurrentPattern,
} from '../lib/patternStorage.js';
import { initializeDatabase } from '../lib/db.js';

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
  } = usePatternState();

  // Undo/redo history
  const historyManager = useHistory(10);

  // Canvas settings management (background, grid colors, display unit, etc.)
  const uiState = useUiState();

  // Use constant for default stitch color (fallback for rendering)
  const defaultStitchColor = DEFAULT_STITCH_COLOR;
  
  // Destructure toolbar/stitch settings from uiState (now loaded from localStorage synchronously)
  const { 
    selectedStitchColor, setSelectedStitchColor,
    stitchSize, setStitchSize,
    stitchWidth, setStitchWidth,
    gapSize, setGapSize,
    repeatPattern, setRepeatPattern,
    sidebarTab, setSidebarTab,
  } = uiState;
  
  const [isEditingProperties, setIsEditingProperties] = useState(false);
  const [tempStitchColor, setTempStitchColor] = useState(null);
  const [tempGapSize, setTempGapSize] = useState(null);
  const [tempStitchSize, setTempStitchSize] = useState(null);
  const [tempStitchWidth, setTempStitchWidth] = useState(null);
  const isColorPickerOpenRef = useRef(false);
  const isGapSliderActiveRef = useRef(false);

  const canvasRef = useRef(null);
  const hasInitializedRef = useRef(false); // Track if initial load is complete

  // Pattern actions (create new pattern)
  const { createNewPattern, resetToDefaults } = usePatternActions({
    uiState,
    setCurrentPattern,
    setStitchColors,
    setSelectedStitchIds,
    setDrawingState,
  });

  // Initialize database and load saved state
  useEffect(() => {
    // Only initialize once
    if (hasInitializedRef.current) return;
    
    const initialize = async () => {
      try {
        // Initialize Dexie database
        await initializeDatabase();
        
        // Load saved current pattern and UI state
        const saved = await loadCurrentPattern();
        if (saved && saved.pattern) {
          // User has saved work - load it
          setCurrentPattern(saved.pattern);
          // Sync artboard config from saved pattern to uiState
          if (saved.pattern.gridSize) uiState.setGridSize(saved.pattern.gridSize);
          if (saved.pattern.tileSize) uiState.setTileSize(saved.pattern.tileSize);
          if (saved.pattern.patternTiles) uiState.setPatternTiles(saved.pattern.patternTiles);
          
          if (saved.stitchColors) {
            setStitchColors(saved.stitchColors);
          }
        } else {
          // First-time user - give them "Untitled Pattern" instead of blank canvas
          createNewPattern();
        }
        
        // Mark initialization as complete
        hasInitializedRef.current = true;
      } catch (error) {
        console.error('Failed to initialize database:', error);
        toast.error('Failed to load saved data. Using defaults.');
        hasInitializedRef.current = true;
      }
    };

    initialize();
  }, [setCurrentPattern, setStitchColors, createNewPattern, uiState]);

  // Pattern import/export operations
  const { exportPattern, importPattern, exportImage, copyPatternToClipboard } = usePatternImportExport({
    currentPattern,
    stitchColors,
    backgroundColor: uiState.backgroundColor,
    gridColor: uiState.gridColor,
    tileOutlineColor: uiState.tileOutlineColor,
    artboardOutlineColor: uiState.artboardOutlineColor,
    selectedStitchColor,
    stitchSize,
    stitchWidth,
    gapSize,
    repeatPattern,
    showGrid: uiState.showGrid,
    setCurrentPattern,
    setStitchColors,
    setSelectedStitchIds,
    setDrawingState,
    setBackgroundColor: uiState.setBackgroundColor,
    setGridColor: uiState.setGridColor,
    setTileOutlineColor: uiState.setTileOutlineColor,
    setArtboardOutlineColor: uiState.setArtboardOutlineColor,
    canvasRef,
    historyManager,
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
    const shouldSkip = currentPattern.stitches.length === 0 && !hasInitializedRef.current;
    
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

  // Auto-save UI state to IndexedDB (separate from undo/redo history)
  useAutoSave({
    currentPattern,
    stitchColors,
    uiState: {
      patternTiles: uiState.patternTiles,
      gridSize: uiState.gridSize,
      backgroundColor: uiState.backgroundColor,
      selectedStitchColor,
      stitchSize,
      stitchWidth,
      gapSize,
      repeatPattern,
      showGrid: uiState.showGrid,
      gridColor: uiState.gridColor,
      tileOutlineColor: uiState.tileOutlineColor,
      artboardOutlineColor: uiState.artboardOutlineColor,
      displayUnit: uiState.displayUnit,
      colorPresets: uiState.colorPresets,
    },
    debounceMs: 500,
    enabled: hasInitializedRef.current,
  });

  // Artboard = the total area containing all pattern tiles
  // (not to be confused with canvas which includes padding around the artboard)
  const artboardWidth = useMemo(() => {
    const tileSize = normalizeTileSize(uiState.tileSize);
    const gridSize = uiState.gridSize ?? DEFAULT_GRID_SIZE;
    const tilesX = uiState.patternTiles.x || 4;
    const width = tilesX * (tileSize.x || 10) * gridSize;
    return isNaN(width) ? 800 : width; // Fallback to 800 if calculation fails
  }, [uiState.patternTiles.x, uiState.tileSize, uiState.gridSize]);

  const artboardHeight = useMemo(() => {
    const tileSize = normalizeTileSize(uiState.tileSize);
    const gridSize = uiState.gridSize ?? DEFAULT_GRID_SIZE;
    const tilesY = uiState.patternTiles.y || 4;
    const height = tilesY * (tileSize.y || 10) * gridSize;
    return isNaN(height) ? 800 : height; // Fallback to 800 if calculation fails
  }, [uiState.patternTiles.y, uiState.tileSize, uiState.gridSize]);

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
    createNewPattern();
  }, [createNewPattern]);

  const handlePatternNameChange = useCallback((name) => {
    setCurrentPattern((prev) => ({ ...prev, name }));
  }, []);

  const handlePatternDescriptionChange = useCallback((description) => {
    setCurrentPattern((prev) => ({ ...prev, description }));
  }, []);

  const handleTileSizeChange = useCallback((axis, value) => {
    const newTileSize = {
      ...uiState.tileSize,
      [axis]: value
    };
    uiState.setTileSize(newTileSize);
    
    setCurrentPattern((prev) => {
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
  }, [uiState, setStitchColors, setSelectedStitchIds]);

  const handleGridSizeChange = useCallback((gridSize) => {
    uiState.setGridSize(gridSize);
    setCurrentPattern((prev) => ({ ...prev, gridSize }));
  }, [uiState]);

  const handlePatternTilesChange = useCallback((axis, value) => {
    const newPatternTiles = {
      ...uiState.patternTiles,
      [axis]: value
    };
    uiState.setPatternTiles(newPatternTiles);
    setCurrentPattern((prev) => ({
      ...prev,
      patternTiles: newPatternTiles
    }));
  }, [uiState]);

  const handleResetSettings = useCallback(() => {
    resetToDefaults();
  }, [resetToDefaults]);

  const handleSelectPattern = useCallback((pattern) => {
    if (!pattern) return;
    const cloned = clonePattern(pattern);
    setCurrentPattern(cloned);
    const colorMap = deriveColorMap(cloned);
    setStitchColors(colorMap);
    setSelectedStitchIds(new Set());
    setDrawingState((prev) => ({ ...prev, firstPoint: null }));
    
    // Restore saved UI state (all patterns have uiState)
    if (pattern.uiState) {
      const saved = pattern.uiState;
      // Restore artboard configuration
      if (saved.gridSize) uiState.setGridSize(saved.gridSize);
      if (saved.tileSize) uiState.setTileSize(saved.tileSize);
      if (saved.patternTiles) uiState.setPatternTiles(saved.patternTiles);
      // Fallback: if not in uiState, use pattern object values
      if (!saved.gridSize && cloned.gridSize) uiState.setGridSize(cloned.gridSize);
      if (!saved.tileSize && cloned.tileSize) uiState.setTileSize(cloned.tileSize);
      if (!saved.patternTiles && cloned.patternTiles) uiState.setPatternTiles(cloned.patternTiles);
      // Restore fabric and grid colors
      if (saved.backgroundColor) uiState.setBackgroundColor(saved.backgroundColor);
      if (saved.gridColor) uiState.setGridColor(saved.gridColor);
      if (saved.tileOutlineColor) uiState.setTileOutlineColor(saved.tileOutlineColor);
      if (saved.artboardOutlineColor) uiState.setArtboardOutlineColor(saved.artboardOutlineColor);
      // Restore stitch defaults
      if (saved.selectedStitchColor) setSelectedStitchColor(saved.selectedStitchColor);
      if (saved.stitchSize) setStitchSize(saved.stitchSize);
      if (saved.stitchWidth) setStitchWidth(saved.stitchWidth);
      if (saved.gapSize !== undefined) setGapSize(saved.gapSize);
      if (saved.repeatPattern !== undefined) setRepeatPattern(saved.repeatPattern);
      // Restore display preferences
      if (saved.showGrid !== undefined) uiState.setShowGrid(saved.showGrid);
      if (saved.displayUnit) uiState.setDisplayUnit(saved.displayUnit);
      if (saved.colorPresets) uiState.setColorPresets(saved.colorPresets);
    } else {
      // Fallback: restore artboard config from pattern object (for old patterns without uiState)
      if (cloned.gridSize) uiState.setGridSize(cloned.gridSize);
      if (cloned.tileSize) uiState.setTileSize(cloned.tileSize);
      if (cloned.patternTiles) uiState.setPatternTiles(cloned.patternTiles);
    }
    
    // Reset history with loaded pattern as initial state
    historyManager.clearHistory({
      pattern: { stitches: cloned.stitches },
      stitchColors: colorMap,
    });
  }, [historyManager, uiState, setSelectedStitchColor, setStitchSize, setStitchWidth, setGapSize, setRepeatPattern]);

  const handleSavePattern = useCallback(async () => {
    const patternUiState = {
      // Fabric and grid colors
      backgroundColor: uiState.backgroundColor,
      gridColor: uiState.gridColor,
      tileOutlineColor: uiState.tileOutlineColor,
      artboardOutlineColor: uiState.artboardOutlineColor,
      // Artboard configuration
      gridSize: uiState.gridSize,
      tileSize: uiState.tileSize,
      patternTiles: uiState.patternTiles,
      // Stitch defaults
      selectedStitchColor,
      stitchSize,
      stitchWidth,
      gapSize,
      repeatPattern,
      // Display preferences
      showGrid: uiState.showGrid,
      displayUnit: uiState.displayUnit,
      colorPresets: uiState.colorPresets,
    };
    
    const result = await savePattern(currentPattern, stitchColors, patternUiState);
    
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
  }, [currentPattern, stitchColors, uiState, selectedStitchColor, stitchSize, stitchWidth, gapSize, repeatPattern, savePattern]);

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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSelectMode: useCallback(() => setDrawingState((prev) => ({ ...prev, mode: 'select', firstPoint: null })), []),
    onDrawMode: useCallback(() => setDrawingState((prev) => ({ ...prev, mode: 'draw', firstPoint: null })), []),
    onToggleRepeat: useCallback(() => setRepeatPattern((prev) => !prev), []),
    onToggleGrid: useCallback(() => uiState.setShowGrid((prev) => !prev), [uiState]),
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
        patternTiles={uiState.patternTiles}
        onPatternTilesChange={handlePatternTilesChange}
        backgroundColor={uiState.backgroundColor}
        onBackgroundColorChange={uiState.handleBackgroundColorChange}
        onBackgroundColorPickerOpenChange={uiState.handleFabricColorPickerOpenChange}
        patternName={currentPattern.name}
        onPatternNameChange={handlePatternNameChange}
        patternDescription={currentPattern.description || ''}
        onPatternDescriptionChange={handlePatternDescriptionChange}
        tileSize={normalizeTileSize(uiState.tileSize)}
        onTileSizeChange={handleTileSizeChange}
        gridSize={uiState.gridSize || DEFAULT_GRID_SIZE}
        onGridSizeChange={handleGridSizeChange}
        onCanvasSliderCommit={uiState.handleCanvasSliderCommit}
        displayUnit={uiState.displayUnit}
        onDisplayUnitChange={uiState.setDisplayUnit}
        artboardWidth={artboardWidth}
        artboardHeight={artboardHeight}
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
        gridColor={uiState.gridColor}
        onGridColorChange={uiState.handleGridColorChange}
        onGridColorPickerOpenChange={uiState.handleGridColorPickerOpenChange}
        tileOutlineColor={uiState.tileOutlineColor}
        onTileOutlineColorChange={uiState.handleTileOutlineColorChange}
        onTileOutlineColorPickerOpenChange={uiState.handleTileOutlineColorPickerOpenChange}
        artboardOutlineColor={uiState.artboardOutlineColor}
        onArtboardOutlineColorChange={uiState.handleArtboardOutlineColorChange}
        onArtboardOutlineColorPickerOpenChange={uiState.handleArtboardOutlineColorPickerOpenChange}
        colorPresets={uiState.colorPresets}
        onAddColorPreset={uiState.handleAddColorPreset}
        onRemoveColorPreset={uiState.handleRemoveColorPreset}
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
              colorPresets={uiState.colorPresets}
              onAddColorPreset={uiState.handleAddColorPreset}
              onRemoveColorPreset={uiState.handleRemoveColorPreset}
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
              showGrid={uiState.showGrid}
              onShowGridChange={uiState.setShowGrid}
              displayUnit={uiState.displayUnit}
              onDisplayUnitChange={uiState.setDisplayUnit}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyManager.canUndo}
              canRedo={historyManager.canRedo}
              selectedStitch={selectedStitchIds.size === 1 ? currentPattern.stitches.find(s => selectedStitchIds.has(s.id)) : null}
            />
            <div className="ml-auto flex items-center gap-2">
              <VersionBadge />
              <OfflineIndicator />
              <HelpButton />
            </div>
          </div>
        </header>

        <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        
          <CanvasViewport
            ref={canvasRef}
            patternTiles={uiState.patternTiles}
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
            backgroundColor={uiState.backgroundColor}
            gridSize={uiState.gridSize}
            tileSize={uiState.tileSize}
            stitchSize={stitchSize}
            repeatPattern={repeatPattern}
            showGrid={uiState.showGrid}
            gridColor={uiState.gridColor}
            tileOutlineColor={uiState.tileOutlineColor}
            artboardOutlineColor={uiState.artboardOutlineColor}
          />
        </div>
      </main>
      <Toaster />
    </SidebarProvider>
  );
}