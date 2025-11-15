import { useState } from 'react';
import { 
  normalizePatternTiles,
} from '../lib/patternUtils.js';
import { DEFAULT_PATTERN_TILES, DEFAULT_TILE_SIZE, DEFAULT_GRID_SIZE } from './useUiState.js';

/**
 * Custom hook for managing pattern state
 * Handles currentPattern, stitchColors, selection, and drawing state
 */
export function usePatternState() {
  // Initialize with empty "Untitled Pattern" (will be loaded from IndexedDB in PatternDesigner useEffect)
  const [currentPattern, setCurrentPattern] = useState(() => ({
    id: `pattern-${Date.now()}`,
    name: 'Untitled Pattern',
    description: '',
    tileSize: DEFAULT_TILE_SIZE,
    gridSize: DEFAULT_GRID_SIZE,
    patternTiles: { x: DEFAULT_PATTERN_TILES, y: DEFAULT_PATTERN_TILES },
    stitches: [],
  }));

  // Initialize stitch colors from pattern (will be loaded from IndexedDB in PatternDesigner useEffect)
  const [stitchColors, setStitchColors] = useState(() => new Map());

  // Selection and drawing state
  const [selectedStitchIds, setSelectedStitchIds] = useState(() => new Set());
  const [drawingState, setDrawingState] = useState({ mode: 'select', firstPoint: null });

  // Pattern tiles configuration
  const [patternTiles, setPatternTiles] = useState(() => {
    return normalizePatternTiles(currentPattern.patternTiles ?? DEFAULT_PATTERN_TILES);
  });

  return {
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
  };
}
