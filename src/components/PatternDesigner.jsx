import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import patternsData from '../data/patterns.json';
import { CanvasViewport } from './CanvasViewport.jsx';
import { Toolbar } from './Toolbar.jsx';
import { AppSidebar } from './AppSidebar.jsx';
import { HelpButton } from './HelpButton.jsx';
import { Badge } from './ui/badge';
import { SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';
import { DEFAULT_GAP_SIZE } from './Stitches.jsx';
import { 
  saveCurrentPattern, 
  loadCurrentPattern, 
  loadSavedPatterns,
  saveToPatternLibrary,
  deletePattern,
  exportPatternAsJSON,
  importPatternFromJSON,
} from '../lib/patternStorage.js';

const CELL_SIZE = 20;
const COLOR_PRESETS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'White', value: '#f5f5f5' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Coral', value: '#fb7185' },
  { label: 'Black', value: '#0b1120' },
];

// Default settings constants
const DEFAULT_PATTERN_TILES = 4;
const DEFAULT_BACKGROUND_COLOR = '#0f172a'; // 
const DEFAULT_STITCH_COLOR = '#f5f5f5'; // default color for stitches
const DEFAULT_STITCH_SIZE = 'medium';
const DEFAULT_STITCH_WIDTH = 'normal';
const DEFAULT_REPEAT_PATTERN = true;
const DEFAULT_SHOW_GRID = true;
const DEFAULT_GRID_COLOR = '#94a3b8';
const DEFAULT_GRID_OPACITY = 0.25;
const DEFAULT_TILE_OUTLINE_COLOR = '#94a3b8';
const DEFAULT_TILE_OUTLINE_OPACITY = 0.15;
const DEFAULT_ARTBOARD_OUTLINE_COLOR = '#3b82f6';
const DEFAULT_ARTBOARD_OUTLINE_OPACITY = 0.5;

// Helper to normalize tileSize (supports both number and {x, y} object)
function normalizeTileSize(tileSize) {
  if (typeof tileSize === 'number') {
    return { x: tileSize, y: tileSize };
  }
  if (tileSize && typeof tileSize === 'object' && typeof tileSize.x === 'number' && typeof tileSize.y === 'number') {
    return { x: tileSize.x, y: tileSize.y };
  }
  return { x: 10, y: 10 }; // Default
}

function normalizePatternTiles(patternTiles) {
  if (typeof patternTiles === 'number') {
    return { x: patternTiles, y: patternTiles };
  }
  if (patternTiles && typeof patternTiles === 'object' && typeof patternTiles.x === 'number' && typeof patternTiles.y === 'number') {
    return { x: patternTiles.x, y: patternTiles.y };
  }
  return { x: 4, y: 4 }; // Default
}

function clonePattern(pattern) {
  const defaultPattern = {
    id: 'pattern-blank',
    name: 'Untitled Pattern',
    description: '',
    tileSize: { x: 10, y: 10 },
    gridSize: 20,
    patternTiles: { x: 4, y: 4 },
    stitches: [],
  };

  if (!pattern) {
    return defaultPattern;
  }

  // Normalize tileSize to object format
  const normalizedTileSize = normalizeTileSize(pattern.tileSize);

  return {
    ...pattern,
    tileSize: normalizedTileSize,
    gridSize: pattern.gridSize ?? 20,
    patternTiles: normalizePatternTiles(pattern.patternTiles ?? 4),
    stitches: (pattern.stitches ?? []).map((stitch) => ({
      ...stitch,
      start: { ...stitch.start },
      end: { ...stitch.end },
      gapSize: stitch.gapSize ?? DEFAULT_GAP_SIZE, // Ensure all stitches have gapSize
    })),
  };
}

function deriveColorMap(pattern) {
  const map = new Map();
  pattern?.stitches?.forEach((stitch) => {
    if (stitch.color) {
      map.set(stitch.id, stitch.color);
    }
  });
  return map;
}

function isValidPattern(data) {
  // Support both old number format and new {x, y} object format for tileSize
  const validTileSize = typeof data.tileSize === 'number' || 
    (data.tileSize && typeof data.tileSize === 'object' && 
     typeof data.tileSize.x === 'number' && typeof data.tileSize.y === 'number');
  
  return (
    data &&
    typeof data === 'object' &&
    validTileSize &&
    typeof data.gridSize === 'number' &&
    typeof data.patternTiles === 'number' &&
    Array.isArray(data.stitches)
  );
}

export default function PatternDesigner() {
  // Load saved patterns from local storage + built-in patterns
  const [savedPatterns, setSavedPatterns] = useState(() => {
    const userPatterns = loadSavedPatterns();
    const builtInPatterns = patternsData.map(clonePattern);
    return [...builtInPatterns, ...userPatterns];
  });

  // Initialize state from local storage or defaults
  const [currentPattern, setCurrentPattern] = useState(() => {
    const saved = loadCurrentPattern();
    if (saved && saved.pattern) {
      // Ensure the loaded pattern has required fields (migration for old data)
      const migratedPattern = {
        ...saved.pattern,
        tileSize: normalizeTileSize(saved.pattern.tileSize), // Normalize tileSize to {x, y} format
        gridSize: saved.pattern.gridSize ?? CELL_SIZE, // Ensure gridSize exists
        patternTiles: saved.pattern.patternTiles ?? DEFAULT_PATTERN_TILES, // Add missing patternTiles
        stitches: (saved.pattern.stitches || []).map(stitch => ({
          ...stitch,
          gapSize: stitch.gapSize ?? DEFAULT_GAP_SIZE, // Ensure all stitches have gapSize
        })),
      };
      return migratedPattern;
    }
    const fallback = patternsData.find((pattern) => pattern.id === 'blank') ?? patternsData[0];
    return clonePattern(fallback);
  });

  const [stitchColors, setStitchColors] = useState(() => {
    const saved = loadCurrentPattern();
    if (saved && saved.stitchColors) {
      return saved.stitchColors;
    }
    return deriveColorMap(currentPattern);
  });

  const [selectedStitchIds, setSelectedStitchIds] = useState(() => new Set());
  const [drawingState, setDrawingState] = useState({ mode: 'select', firstPoint: null });

  // Undo/redo history - store last 10 states
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Save state for showing spinner and success message
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved'

  // Load pattern tiles from the pattern itself, not UI state
  const [patternTiles, setPatternTiles] = useState(() => {
    return normalizePatternTiles(currentPattern.patternTiles ?? DEFAULT_PATTERN_TILES);
  });
  // Use constant for default stitch color (fallback for rendering)
  const defaultStitchColor = DEFAULT_STITCH_COLOR;
  const [backgroundColor, setBackgroundColor] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.backgroundColor ?? DEFAULT_BACKGROUND_COLOR;
  });
  const [selectedStitchColor, setSelectedStitchColor] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.selectedStitchColor ?? DEFAULT_STITCH_COLOR;
  });
  const [stitchSize, setStitchSize] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.stitchSize ?? DEFAULT_STITCH_SIZE;
  });
  const [stitchWidth, setStitchWidth] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.stitchWidth ?? DEFAULT_STITCH_WIDTH;
  });
  const [gapSize, setGapSize] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.gapSize ?? DEFAULT_GAP_SIZE;
  });
  const [repeatPattern, setRepeatPattern] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.repeatPattern ?? DEFAULT_REPEAT_PATTERN;
  });
  const [showGrid, setShowGrid] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.showGrid ?? DEFAULT_SHOW_GRID;
  });

  // Grid and outline appearance settings
  const [gridColor, setGridColor] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.gridColor ?? DEFAULT_GRID_COLOR;
  });
  const [gridOpacity, setGridOpacity] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.gridOpacity ?? DEFAULT_GRID_OPACITY;
  });
  const [tileOutlineColor, setTileOutlineColor] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.tileOutlineColor ?? DEFAULT_TILE_OUTLINE_COLOR;
  });
  const [tileOutlineOpacity, setTileOutlineOpacity] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.tileOutlineOpacity ?? DEFAULT_TILE_OUTLINE_OPACITY;
  });
  const [artboardOutlineColor, setArtboardOutlineColor] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.artboardOutlineColor ?? DEFAULT_ARTBOARD_OUTLINE_COLOR;
  });
  const [artboardOutlineOpacity, setArtboardOutlineOpacity] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.artboardOutlineOpacity ?? DEFAULT_ARTBOARD_OUTLINE_OPACITY;
  });

  const [sidebarTab, setSidebarTab] = useState('controls');
  const [isHydrated, setIsHydrated] = useState(false);
  const canvasRef = useRef(null);

  // Mark as hydrated after initial render to prevent SSR mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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

  // Save state to history whenever pattern or colors change (for undo/redo)
  useEffect(() => {
    // Skip if this change was caused by undo/redo
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    const newState = {
      pattern: clonePattern(currentPattern),
      stitchColors: new Map(stitchColors),
      timestamp: Date.now(),
    };

    setHistory(prev => {
      // If we're not at the end of history, remove everything after current index
      const newHistory = historyIndex >= 0 ? prev.slice(0, historyIndex + 1) : prev;
      // Add new state and keep only last 10
      const updated = [...newHistory, newState].slice(-10);
      return updated;
    });

    setHistoryIndex(prev => {
      const newHistory = historyIndex >= 0 ? history.slice(0, historyIndex + 1) : history;
      return Math.min(newHistory.length, 9); // Max index is 9 (for 10 items)
    });
  }, [currentPattern, stitchColors]);

  // Auto-save to local storage whenever pattern, colors, or settings change
  // This triggers when: stitches added/removed/modified, colors changed, or UI settings changed
  useEffect(() => {
    saveCurrentPattern(currentPattern, stitchColors, {
      patternTiles,
      backgroundColor,
      selectedStitchColor,
      stitchSize,
      repeatPattern,
      showGrid,
      gridColor,
      gridOpacity,
      tileOutlineColor,
      tileOutlineOpacity,
      artboardOutlineColor,
      artboardOutlineOpacity,
    });
  }, [
    currentPattern,
    stitchColors,
    patternTiles,
    backgroundColor,
    selectedStitchColor,
    stitchSize,
    repeatPattern,
    showGrid,
    gridColor,
    gridOpacity,
    tileOutlineColor,
    tileOutlineOpacity,
    artboardOutlineColor,
    artboardOutlineOpacity,
  ]);

  // Artboard = the total area containing all pattern tiles
  // (not to be confused with canvas which includes padding around the artboard)
  const artboardWidth = useMemo(() => {
    const tileSize = normalizeTileSize(currentPattern.tileSize);
    const gridSize = currentPattern.gridSize ?? CELL_SIZE;
    const tilesX = patternTiles.x || 4;
    const width = tilesX * (tileSize.x || 10) * gridSize;
    return isNaN(width) ? 800 : width; // Fallback to 800 if calculation fails
  }, [patternTiles.x, currentPattern.tileSize, currentPattern.gridSize]);

  const artboardHeight = useMemo(() => {
    const tileSize = normalizeTileSize(currentPattern.tileSize);
    const gridSize = currentPattern.gridSize ?? CELL_SIZE;
    const tilesY = patternTiles.y || 4;
    const height = tilesY * (tileSize.y || 10) * gridSize;
    return isNaN(height) ? 800 : height; // Fallback to 800 if calculation fails
  }, [patternTiles.y, currentPattern.tileSize, currentPattern.gridSize]);

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
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      isUndoRedoAction.current = true;
      setCurrentPattern(clonePattern(prevState.pattern));
      setStitchColors(new Map(prevState.stitchColors));
      setHistoryIndex(historyIndex - 1);
      setSelectedStitchIds(new Set()); // Clear selection on undo
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      isUndoRedoAction.current = true;
      setCurrentPattern(clonePattern(nextState.pattern));
      setStitchColors(new Map(nextState.stitchColors));
      setHistoryIndex(historyIndex + 1);
      setSelectedStitchIds(new Set()); // Clear selection on redo
    }
  }, [history, historyIndex]);

  const handleAddStitch = useCallback(({ start, end, stitchSize, repeat }) => {
    const newId = `stitch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    
    // Determine default stitch size based on orientation if not provided
    let defaultSize = 'small';
    if (!stitchSize) {
      const gridDx = Math.abs(end.x - start.x);
      const gridDy = Math.abs(end.y - start.y);
      const isDiagonal = gridDx > 0 && gridDy > 0;
      defaultSize = isDiagonal ? 'small' : 'medium';
    }
    
    const newStitch = {
      id: newId,
      start,
      end,
      color: null,
      stitchSize: stitchSize || defaultSize,
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

  const handleChangeSelectedStitchSize = useCallback((newSize) => {
    if (selectedStitchIds.size > 0) {
      // Update selected stitches
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, stitchSize: newSize }
            : stitch
        ),
      }));
    } else {
      // Update default for draw tool
      setStitchSize(newSize);
    }
  }, [selectedStitchIds]);

  const handleChangeSelectedStitchWidth = useCallback((newWidth) => {
    if (selectedStitchIds.size > 0) {
      // Update selected stitches
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, stitchWidth: newWidth }
            : stitch
        ),
      }));
    } else {
      // Update default for draw tool
      setStitchWidth(newWidth);
    }
  }, [selectedStitchIds]);

  const handleChangeSelectedGapSize = useCallback((newGapSize) => {
    if (selectedStitchIds.size > 0) {
      // Update selected stitches
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, gapSize: newGapSize }
            : stitch
        ),
      }));
      // Also update the UI state so slider stays in sync
      setGapSize(newGapSize);
    } else {
      // Update default for draw tool
      setGapSize(newGapSize);
    }
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
      return {
        ...prev,
        tileSize: {
          ...normalized,
          [axis]: value
        }
      };
    });
  }, []);

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
    setRepeatPattern(DEFAULT_REPEAT_PATTERN);
    setShowGrid(DEFAULT_SHOW_GRID);
    setGridColor(DEFAULT_GRID_COLOR);
    setGridOpacity(DEFAULT_GRID_OPACITY);
    setTileOutlineColor(DEFAULT_TILE_OUTLINE_COLOR);
    setTileOutlineOpacity(DEFAULT_TILE_OUTLINE_OPACITY);
    setArtboardOutlineColor(DEFAULT_ARTBOARD_OUTLINE_COLOR);
    setArtboardOutlineOpacity(DEFAULT_ARTBOARD_OUTLINE_OPACITY);
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
      if (pattern.uiState.gridOpacity !== undefined) setGridOpacity(pattern.uiState.gridOpacity);
      if (pattern.uiState.tileOutlineColor) setTileOutlineColor(pattern.uiState.tileOutlineColor);
      if (pattern.uiState.tileOutlineOpacity !== undefined) setTileOutlineOpacity(pattern.uiState.tileOutlineOpacity);
      if (pattern.uiState.artboardOutlineColor) setArtboardOutlineColor(pattern.uiState.artboardOutlineColor);
      if (pattern.uiState.artboardOutlineOpacity !== undefined) setArtboardOutlineOpacity(pattern.uiState.artboardOutlineOpacity);
    }
  }, []);

  const handleSavePattern = useCallback(() => {
    setSaveState('saving');
    
    // Use setTimeout to ensure state update is processed
    setTimeout(() => {
      const uiState = {
        backgroundColor,
        gridColor,
        gridOpacity,
        tileOutlineColor,
        tileOutlineOpacity,
        artboardOutlineColor,
        artboardOutlineOpacity,
        selectedStitchColor,
        stitchSize,
        stitchWidth,
        repeatPattern,
        showGrid,
      };
      const result = saveToPatternLibrary(currentPattern, stitchColors, uiState);
      if (result.success) {
        // Reload saved patterns to include the newly saved one
        const userPatterns = loadSavedPatterns();
        const builtInPatterns = patternsData.map(clonePattern);
        setSavedPatterns([...builtInPatterns, ...userPatterns]);
        
        // Update current pattern ID if it was a new pattern
        if (result.pattern.id !== currentPattern.id) {
          setCurrentPattern(result.pattern);
        }
        
        setSaveState('saved');
        
        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSaveState('idle');
        }, 2000);
      } else {
        setSaveState('idle');
        alert(`Failed to save pattern: ${result.error}`);
      }
    }, 300);
  }, [currentPattern, stitchColors, backgroundColor, gridColor, gridOpacity, tileOutlineColor, tileOutlineOpacity, artboardOutlineColor, artboardOutlineOpacity, selectedStitchColor, stitchSize, stitchWidth, repeatPattern, showGrid]);

  const handleDeletePattern = useCallback((patternId) => {
    deletePattern(patternId);
    
    // Reload saved patterns
    const userPatterns = loadSavedPatterns();
    const builtInPatterns = patternsData.map(clonePattern);
    setSavedPatterns([...builtInPatterns, ...userPatterns]);
    
    // If the deleted pattern was currently loaded, switch to blank
    if (currentPattern.id === patternId) {
      handleNewPattern();
    }
    
    // Show success toast
    toast.success('Pattern deleted successfully');
  }, [currentPattern.id, handleNewPattern]);

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

  const handleClearColors = useCallback(() => {
    setStitchColors(new Map());
  }, []);

  const handleExportPattern = useCallback(() => {
    const exportPattern = {
      ...currentPattern,
      stitches: currentPattern.stitches.map((stitch) => ({
        ...stitch,
        color: stitchColors.get(stitch.id) ?? stitch.color ?? null,
      })),
      uiState: {
        backgroundColor,
        gridColor,
        gridOpacity,
        tileOutlineColor,
        tileOutlineOpacity,
        artboardOutlineColor,
        artboardOutlineOpacity,
        selectedStitchColor,
        stitchSize,
        stitchWidth,
        gapSize,
        repeatPattern,
        showGrid,
      },
    };

    const blob = new Blob([JSON.stringify(exportPattern, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = (currentPattern.name || 'pattern').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `${slug || 'pattern'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [currentPattern, stitchColors, backgroundColor, gridColor, gridOpacity, tileOutlineColor, tileOutlineOpacity, artboardOutlineColor, artboardOutlineOpacity, selectedStitchColor, stitchSize, stitchWidth, gapSize, repeatPattern, showGrid]);

  const handleImportPattern = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!isValidPattern(parsed)) {
          throw new Error('Invalid pattern schema');
        }
        // Handle legacy format migration
        let tileSize, gridSize;
        if (parsed.tileSize !== undefined) {
          // New format
          tileSize = parsed.tileSize;
          gridSize = parsed.gridSize ?? 20;
        } else {
          // Legacy format - old gridSize becomes tileSize
          tileSize = parsed.gridSize ?? 10;
          gridSize = 20;
        }
        
        const normalized = clonePattern({
          ...parsed,
          id: parsed.id ?? `pattern-${Date.now()}`,
          name: parsed.name ?? 'Imported Pattern',
          description: parsed.description ?? '',
          tileSize,
          gridSize,
        });
        setCurrentPattern(normalized);
        setStitchColors(deriveColorMap(normalized));
        setSelectedStitchIds(new Set());
        setDrawingState((prev) => ({ ...prev, firstPoint: null }));
        
        // Restore UI state if included in the imported pattern
        if (parsed.uiState) {
          if (parsed.uiState.backgroundColor) setBackgroundColor(parsed.uiState.backgroundColor);
          if (parsed.uiState.gridColor) setGridColor(parsed.uiState.gridColor);
          if (parsed.uiState.gridOpacity !== undefined) setGridOpacity(parsed.uiState.gridOpacity);
          if (parsed.uiState.tileOutlineColor) setTileOutlineColor(parsed.uiState.tileOutlineColor);
          if (parsed.uiState.tileOutlineOpacity !== undefined) setTileOutlineOpacity(parsed.uiState.tileOutlineOpacity);
          if (parsed.uiState.artboardOutlineColor) setArtboardOutlineColor(parsed.uiState.artboardOutlineColor);
          if (parsed.uiState.artboardOutlineOpacity !== undefined) setArtboardOutlineOpacity(parsed.uiState.artboardOutlineOpacity);
        }
      } catch (error) {
        console.error('Failed to import pattern:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleExportImage = useCallback((resolutionMultiplier = 1) => {
    const dataUrl = canvasRef.current?.exportAsImage?.(resolutionMultiplier);
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    const slug = (currentPattern.name || 'pattern').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const suffix = resolutionMultiplier !== 1 ? `-${resolutionMultiplier}x` : '';
    link.download = `${slug || 'pattern'}${suffix}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentPattern.name]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }
      // Redo: Ctrl+Y or Cmd+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        handleRedo();
        return;
      }
      // Tool shortcuts: V for select, P for pen/draw
      if (event.key === 'v' || event.key === 'V') {
        event.preventDefault();
        setDrawingState((prev) => ({ ...prev, mode: 'select', firstPoint: null }));
        return;
      }
      if (event.key === 'p' || event.key === 'P') {
        event.preventDefault();
        setDrawingState((prev) => ({ ...prev, mode: 'draw', firstPoint: null }));
        return;
      }
      // View shortcuts: R for repeat pattern, H for hide/show grid
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        setRepeatPattern((prev) => !prev);
        return;
      }
      if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        setShowGrid((prev) => !prev);
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedStitchIds.size > 0) {
        event.preventDefault();
        handleDeleteSelected();
      }
      if (event.key === 'Escape') {
        setDrawingState((prev) => ({ ...prev, firstPoint: null }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected, handleUndo, handleRedo, selectedStitchIds.size]);

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
        gridSize={currentPattern.gridSize || CELL_SIZE}
        onGridSizeChange={handleGridSizeChange}
        artboardWidth={artboardWidth}
        artboardHeight={artboardHeight}
        canvasInfo={(() => {
          const ts = normalizeTileSize(currentPattern.tileSize);
          return `Artboard: ${artboardWidth}×${artboardHeight}px · Tiles: ${patternTiles.x}×${patternTiles.y} · Tile grid: ${ts.x}×${ts.y} · Grid size: ${currentPattern.gridSize || CELL_SIZE}px`;
        })()}
        onNewPattern={handleNewPattern}
        onSavePattern={handleSavePattern}
        saveState={saveState}
        onResetSettings={handleResetSettings}
        onExportPattern={handleExportPattern}
        onImportPattern={handleImportPattern}
        onExportImage={handleExportImage}
        savedPatterns={savedPatterns}
        activePatternId={currentPattern.id}
        onSelectPattern={(pattern) => {
          handleSelectPattern(pattern);
        }}
        onDeletePattern={handleDeletePattern}
        gridColor={gridColor}
        onGridColorChange={setGridColor}
        gridOpacity={gridOpacity}
        onGridOpacityChange={setGridOpacity}
        tileOutlineColor={tileOutlineColor}
        onTileOutlineColorChange={setTileOutlineColor}
        tileOutlineOpacity={tileOutlineOpacity}
        onTileOutlineOpacityChange={setTileOutlineOpacity}
        artboardOutlineColor={artboardOutlineColor}
        onArtboardOutlineColorChange={setArtboardOutlineColor}
        artboardOutlineOpacity={artboardOutlineOpacity}
        onArtboardOutlineOpacityChange={setArtboardOutlineOpacity}
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
              onClearColors={handleClearColors}
              colorPresets={COLOR_PRESETS}
              stitchSize={stitchSize}
              onStitchSizeChange={handleChangeSelectedStitchSize}
              stitchWidth={stitchWidth}
              onStitchWidthChange={handleChangeSelectedStitchWidth}
              gapSize={gapSize}
              onGapSizeChange={handleChangeSelectedGapSize}
              showGrid={showGrid}
              onShowGridChange={setShowGrid}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
            />
            <HelpButton />
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
            gridOpacity={gridOpacity}
            tileOutlineColor={tileOutlineColor}
            tileOutlineOpacity={tileOutlineOpacity}
            artboardOutlineColor={artboardOutlineColor}
            artboardOutlineOpacity={artboardOutlineOpacity}
          />
        </div>
      </main>
      <Toaster />
    </SidebarProvider>
  );
}
