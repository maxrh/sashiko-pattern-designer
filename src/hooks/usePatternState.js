import { useState } from 'react';
import patternsData from '../data/patterns.json';
import { loadCurrentPattern } from '../lib/patternStorage.js';
import { 
  normalizeTileSize, 
  normalizePatternTiles,
  clonePattern,
  deriveColorMap,
  DEFAULT_GRID_SIZE
} from '../lib/patternUtils.js';
import { DEFAULT_GAP_SIZE } from '../components/Stitches.jsx';

const DEFAULT_PATTERN_TILES = 4;

/**
 * Custom hook for managing pattern state
 * Handles currentPattern, stitchColors, selection, and drawing state
 */
export function usePatternState() {
  // Initialize pattern from local storage or defaults
  const [currentPattern, setCurrentPattern] = useState(() => {
    const saved = loadCurrentPattern();
    if (saved && saved.pattern) {
      // Ensure the loaded pattern has required fields (migration for old data)
      const migratedPattern = {
        ...saved.pattern,
        tileSize: normalizeTileSize(saved.pattern.tileSize), // Normalize tileSize to {x, y} format
        gridSize: saved.pattern.gridSize ?? DEFAULT_GRID_SIZE, // Ensure gridSize exists
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

  // Initialize stitch colors from storage or derive from pattern
  const [stitchColors, setStitchColors] = useState(() => {
    const saved = loadCurrentPattern();
    if (saved && saved.stitchColors) {
      return saved.stitchColors;
    }
    return deriveColorMap(currentPattern);
  });

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
