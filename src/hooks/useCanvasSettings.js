import { useState, useRef, useCallback } from 'react';
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_SHOW_GRID,
  DEFAULT_GRID_COLOR,
  DEFAULT_TILE_OUTLINE_COLOR,
  DEFAULT_ARTBOARD_OUTLINE_COLOR,
} from '../components/PatternDesigner.jsx';
import { DEFAULT_UNIT } from '../lib/unitConverter.js';

/**
 * Hook to manage canvas settings state and handlers
 * Includes background colors, grid colors, pattern tiles, grid size, display unit, and color presets
 * Uses temporary state system for color pickers to prevent auto-save on every drag increment
 * @returns {Object} Canvas settings state and handlers
 */
export function useCanvasSettings() {
  // Grid and outline appearance settings
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND_COLOR);
  const [gridColor, setGridColor] = useState(DEFAULT_GRID_COLOR);
  const [tileOutlineColor, setTileOutlineColor] = useState(DEFAULT_TILE_OUTLINE_COLOR);
  const [artboardOutlineColor, setArtboardOutlineColor] = useState(DEFAULT_ARTBOARD_OUTLINE_COLOR);
  
  // Grid display settings
  const [showGrid, setShowGrid] = useState(DEFAULT_SHOW_GRID);
  
  // Unit preference for display (px or mm)
  const [displayUnit, setDisplayUnit] = useState(DEFAULT_UNIT);

  // Color presets for SketchPicker
  const [colorPresets, setColorPresets] = useState([
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

  // Reset all canvas settings to defaults
  const resetCanvasSettings = useCallback(() => {
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
    setShowGrid(DEFAULT_SHOW_GRID);
    setGridColor(DEFAULT_GRID_COLOR);
    setTileOutlineColor(DEFAULT_TILE_OUTLINE_COLOR);
    setArtboardOutlineColor(DEFAULT_ARTBOARD_OUTLINE_COLOR);
  }, []);

  // Load canvas settings from saved UI state
  const loadCanvasSettings = useCallback((uiState) => {
    if (!uiState) return;
    
    if (uiState.backgroundColor) setBackgroundColor(uiState.backgroundColor);
    if (uiState.showGrid !== undefined) setShowGrid(uiState.showGrid);
    if (uiState.gridColor) setGridColor(uiState.gridColor);
    if (uiState.tileOutlineColor) setTileOutlineColor(uiState.tileOutlineColor);
    if (uiState.artboardOutlineColor) setArtboardOutlineColor(uiState.artboardOutlineColor);
    if (uiState.displayUnit) setDisplayUnit(uiState.displayUnit);
    if (uiState.colorPresets) setColorPresets(uiState.colorPresets);
  }, []);

  return {
    // State
    backgroundColor: tempBackgroundColor || backgroundColor,
    gridColor: tempGridColor || gridColor,
    tileOutlineColor: tempTileOutlineColor || tileOutlineColor,
    artboardOutlineColor: tempArtboardOutlineColor || artboardOutlineColor,
    showGrid,
    displayUnit,
    colorPresets,
    
    // Setters (for direct updates)
    setBackgroundColor,
    setGridColor,
    setTileOutlineColor,
    setArtboardOutlineColor,
    setShowGrid,
    setDisplayUnit,
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
    resetCanvasSettings,
    loadCanvasSettings,
  };
}
