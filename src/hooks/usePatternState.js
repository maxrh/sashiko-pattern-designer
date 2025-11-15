import { useState } from 'react';
import patternsData from '../data/patterns.json';
import { 
  normalizePatternTiles,
  clonePattern,
} from '../lib/patternUtils.js';
import { DEFAULT_PATTERN_TILES } from './useUiState.js';

/**
 * Custom hook for managing pattern state
 * Handles currentPattern, stitchColors, selection, and drawing state
 */
export function usePatternState() {
  // Initialize pattern from defaults (will be loaded from IndexedDB in PatternDesigner useEffect)
  const [currentPattern, setCurrentPattern] = useState(() => {
    const fallback = patternsData.find((pattern) => pattern.id === 'blank') ?? patternsData[0];
    return clonePattern(fallback);
  });

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
