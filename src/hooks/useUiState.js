import { useState, useRef, useCallback, useEffect } from 'react';
import { DEFAULT_UNIT } from '../lib/unitConverter.js';

// UI State defaults
export const DEFAULT_BACKGROUND_COLOR = '#0f172a'; // Dark slate with full opacity (8-char hex)
export const DEFAULT_SHOW_GRID = true;
export const DEFAULT_GRID_COLOR = '#94a3b840'; // Grid color with 25% alpha
export const DEFAULT_TILE_OUTLINE_COLOR = '#94a3b826'; // Tile outline with 15% alpha
export const DEFAULT_ARTBOARD_OUTLINE_COLOR = '#3b82f680'; // Artboard outline with 50% alpha
export const DEFAULT_REPEAT_PATTERN = true;
export const DEFAULT_SIDEBAR_TAB = 'controls'; // Default active sidebar tab

// Artboard UI defaults
export const DEFAULT_PATTERN_TILES = 4; // Number of tiles in artboard (both x and y)
export const DEFAULT_TILE_SIZE = { x: 10, y: 10 }; // Tile dimensions in grid cells
export const DEFAULT_GRID_SIZE = 20; // Grid cell size in pixels

// Stitch UI defaults
export const DEFAULT_STITCH_COLOR = '#f5f5f5'; // Light gray color for stitches
export const DEFAULT_STITCH_SIZE = 'medium';
export const DEFAULT_STITCH_WIDTH = 'normal';
export const DEFAULT_GAP_SIZE = 9; // Space between adjacent dashes
export const DEFAULT_SELECTED_COLOR = '#0000FF'; // Blue color for selected stitches

const UI_STATE_STORAGE_KEY = 'sashiko-ui-state';

// Load UI state from localStorage (synchronous)
function loadUiStateFromStorage() {
  try {
    const stored = localStorage.getItem(UI_STATE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load UI state from localStorage:', error);
    return null;
  }
}

// Save UI state to localStorage (synchronous)
function saveUiStateToStorage(uiState) {
  try {
    localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(uiState));
  } catch (error) {
    console.error('Failed to save UI state to localStorage:', error);
  }
}

/**
 * Hook to manage UI state and handlers
 * Includes background colors, grid colors, pattern tiles, grid size, display unit, and color presets
 * Uses localStorage for synchronous persistence (no flash on load)
 * Uses temporary state system for color pickers to prevent auto-save on every drag increment
 * @returns {Object} UI state and handlers
 */
export function useUiState() {
  // Load saved state synchronously from localStorage
  const savedState = loadUiStateFromStorage();
  
  // Grid and outline appearance settings
  const [backgroundColor, setBackgroundColor] = useState(savedState?.backgroundColor || DEFAULT_BACKGROUND_COLOR);
  const [gridColor, setGridColor] = useState(savedState?.gridColor || DEFAULT_GRID_COLOR);
  const [tileOutlineColor, setTileOutlineColor] = useState(savedState?.tileOutlineColor || DEFAULT_TILE_OUTLINE_COLOR);
  const [artboardOutlineColor, setArtboardOutlineColor] = useState(savedState?.artboardOutlineColor || DEFAULT_ARTBOARD_OUTLINE_COLOR);
  
  // Grid display settings
  const [showGrid, setShowGrid] = useState(savedState?.showGrid !== undefined ? savedState.showGrid : DEFAULT_SHOW_GRID);
  
  // UI preferences
  const [sidebarTab, setSidebarTab] = useState(savedState?.sidebarTab || DEFAULT_SIDEBAR_TAB);
  
  // Unit preference for display (px or mm)
  const [displayUnit, setDisplayUnit] = useState(savedState?.displayUnit || DEFAULT_UNIT);

  // Toolbar/Stitch settings (moved from PatternDesigner for synchronous loading)
  const [selectedStitchColor, setSelectedStitchColor] = useState(savedState?.selectedStitchColor || DEFAULT_STITCH_COLOR);
  const [stitchSize, setStitchSize] = useState(savedState?.stitchSize || DEFAULT_STITCH_SIZE);
  const [stitchWidth, setStitchWidth] = useState(savedState?.stitchWidth || DEFAULT_STITCH_WIDTH);
  const [gapSize, setGapSize] = useState(savedState?.gapSize !== undefined ? savedState.gapSize : DEFAULT_GAP_SIZE);
  const [repeatPattern, setRepeatPattern] = useState(savedState?.repeatPattern !== undefined ? savedState.repeatPattern : DEFAULT_REPEAT_PATTERN);

  // Artboard configuration (moved for synchronous loading - these are UI preferences, not pattern data)
  const [gridSize, setGridSize] = useState(savedState?.gridSize || DEFAULT_GRID_SIZE);
  const [tileSize, setTileSize] = useState(savedState?.tileSize || DEFAULT_TILE_SIZE);
  const [patternTiles, setPatternTiles] = useState(savedState?.patternTiles || { x: DEFAULT_PATTERN_TILES, y: DEFAULT_PATTERN_TILES });

  // Color presets for SketchPicker
  const [colorPresets, setColorPresets] = useState(savedState?.colorPresets || [
    '#0a0a0a', // neutral-950
    '#f5f5f5', // neutral-100
    '#a8a29e', // stone-400
    '#fbbf24', // amber-400
    '#ca8a04', // yellow-600
    '#fb7185', // rose-400
    '#b91c1c', // red-700
    '#10b981', // emerald-500
    '#064e3b', // emerald-900
    '#475569', // slate-600
    '#0c4a6e', // sky-900
    '#0f172a', // slate-900
  ]);
  
  // Auto-save UI state to localStorage whenever it changes
  useEffect(() => {
    const uiState = {
      backgroundColor,
      gridColor,
      tileOutlineColor,
      artboardOutlineColor,
      showGrid,
      sidebarTab,
      displayUnit,
      selectedStitchColor,
      stitchSize,
      stitchWidth,
      gapSize,
      repeatPattern,
      gridSize,
      tileSize,
      patternTiles,
      colorPresets,
    };
    saveUiStateToStorage(uiState);
  }, [
    backgroundColor, 
    gridColor, 
    tileOutlineColor, 
    artboardOutlineColor, 
    showGrid,
    sidebarTab,
    displayUnit, 
    selectedStitchColor, 
    stitchSize, 
    stitchWidth, 
    gapSize, 
    repeatPattern, 
    gridSize, 
    tileSize.x, 
    tileSize.y, 
    patternTiles.x, 
    patternTiles.y, 
    colorPresets.length
  ]);

  // Temporary states for canvas settings (prevent auto-save on every slider/color drag)
  const [tempBackgroundColor, setTempBackgroundColor] = useState(null);
  const [tempGridColor, setTempGridColor] = useState(null);
  const [tempTileOutlineColor, setTempTileOutlineColor] = useState(null);
  const [tempArtboardOutlineColor, setTempArtboardOutlineColor] = useState(null);

  // Color picker open state refs (track when dragging vs committed)
  const isFabricColorPickerOpenRef = useRef(false);
  const isGridColorPickerOpenRef = useRef(false);
  const isTileOutlineColorPickerOpenRef = useRef(false);
  const isArtboardOutlineColorPickerOpenRef = useRef(false);

  // Canvas setting handlers - onValueCommit fires when slider drag stops
  const handleCanvasSliderCommit = useCallback(() => {
    // Values already applied via onValueChange, this just triggers for tracking if needed
  }, []);

  // Fabric color handlers with temp state for color picker dragging
  const handleBackgroundColorChange = useCallback((color) => {
    if (isFabricColorPickerOpenRef.current) {
      setTempBackgroundColor(color);
    } else {
      setBackgroundColor(color);
    }
  }, []);

  const handleFabricColorPickerOpenChange = useCallback((isOpen) => {
    isFabricColorPickerOpenRef.current = isOpen;
    if (!isOpen && tempBackgroundColor) {
      setBackgroundColor(tempBackgroundColor);
      setTempBackgroundColor(null);
    }
  }, [tempBackgroundColor]);

  // Grid appearance color handlers with temp state
  const handleGridColorChange = useCallback((color) => {
    if (isGridColorPickerOpenRef.current) {
      setTempGridColor(color);
    } else {
      setGridColor(color);
    }
  }, []);

  const handleGridColorPickerOpenChange = useCallback((isOpen) => {
    isGridColorPickerOpenRef.current = isOpen;
    if (!isOpen && tempGridColor) {
      setGridColor(tempGridColor);
      setTempGridColor(null);
    }
  }, [tempGridColor]);

  const handleTileOutlineColorChange = useCallback((color) => {
    if (isTileOutlineColorPickerOpenRef.current) {
      setTempTileOutlineColor(color);
    } else {
      setTileOutlineColor(color);
    }
  }, []);

  const handleTileOutlineColorPickerOpenChange = useCallback((isOpen) => {
    isTileOutlineColorPickerOpenRef.current = isOpen;
    if (!isOpen && tempTileOutlineColor) {
      setTileOutlineColor(tempTileOutlineColor);
      setTempTileOutlineColor(null);
    }
  }, [tempTileOutlineColor]);

  const handleArtboardOutlineColorChange = useCallback((color) => {
    if (isArtboardOutlineColorPickerOpenRef.current) {
      setTempArtboardOutlineColor(color);
    } else {
      setArtboardOutlineColor(color);
    }
  }, []);

  const handleArtboardOutlineColorPickerOpenChange = useCallback((isOpen) => {
    isArtboardOutlineColorPickerOpenRef.current = isOpen;
    if (!isOpen && tempArtboardOutlineColor) {
      setArtboardOutlineColor(tempArtboardOutlineColor);
      setTempArtboardOutlineColor(null);
    }
  }, [tempArtboardOutlineColor]);

  // Color preset handlers
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

  // Reset all UI state to defaults
  const resetuiState = useCallback(() => {
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
    setShowGrid(DEFAULT_SHOW_GRID);
    setGridColor(DEFAULT_GRID_COLOR);
    setTileOutlineColor(DEFAULT_TILE_OUTLINE_COLOR);
    setArtboardOutlineColor(DEFAULT_ARTBOARD_OUTLINE_COLOR);
    setSidebarTab(DEFAULT_SIDEBAR_TAB);
    setDisplayUnit(DEFAULT_UNIT);
    setSelectedStitchColor(DEFAULT_STITCH_COLOR);
    setStitchSize(DEFAULT_STITCH_SIZE);
    setStitchWidth(DEFAULT_STITCH_WIDTH);
    setGapSize(DEFAULT_GAP_SIZE);
    setRepeatPattern(DEFAULT_REPEAT_PATTERN);
    setGridSize(DEFAULT_GRID_SIZE);
    setTileSize(DEFAULT_TILE_SIZE);
    setPatternTiles({ x: DEFAULT_PATTERN_TILES, y: DEFAULT_PATTERN_TILES });
    setColorPresets([
      '#0a0a0a', '#f5f5f5', '#a8a29e', '#fbbf24', '#ca8a04',
      '#fb7185', '#b91c1c', '#10b981', '#064e3b', '#475569',
      '#0c4a6e', '#0f172a',
    ]);
    // Clear from localStorage
    localStorage.removeItem(UI_STATE_STORAGE_KEY);
  }, []);

  return {
    // State
    backgroundColor: tempBackgroundColor || backgroundColor,
    gridColor: tempGridColor || gridColor,
    tileOutlineColor: tempTileOutlineColor || tileOutlineColor,
    artboardOutlineColor: tempArtboardOutlineColor || artboardOutlineColor,
    showGrid,
    sidebarTab,
    displayUnit,
    selectedStitchColor,
    stitchSize,
    stitchWidth,
    gapSize,
    repeatPattern,
    gridSize,
    tileSize,
    patternTiles,
    colorPresets,
    
    // Setters (for direct updates)
    setBackgroundColor,
    setGridColor,
    setTileOutlineColor,
    setArtboardOutlineColor,
    setShowGrid,
    setSidebarTab,
    setDisplayUnit,
    setSelectedStitchColor,
    setStitchSize,
    setStitchWidth,
    setGapSize,
    setRepeatPattern,
    setGridSize,
    setTileSize,
    setPatternTiles,
    setColorPresets,
    
    // Handlers
    handleCanvasSliderCommit,
    handleBackgroundColorChange,
    handleFabricColorPickerOpenChange,
    handleGridColorChange,
    handleGridColorPickerOpenChange,
    handleTileOutlineColorChange,
    handleTileOutlineColorPickerOpenChange,
    handleArtboardOutlineColorChange,
    handleArtboardOutlineColorPickerOpenChange,
    handleAddColorPreset,
    handleRemoveColorPreset,
    
    // Utility functions
    resetuiState,
  };
}
