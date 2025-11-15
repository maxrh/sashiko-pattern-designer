import { useCallback } from 'react';
import { normalizeTileSize } from '../lib/patternUtils.js';

/**
 * Custom hook for pattern actions like creating new patterns and resetting settings
 */
export function usePatternActions({ 
  uiState, 
  setCurrentPattern, 
  setStitchColors, 
  setSelectedStitchIds, 
  setDrawingState 
}) {
  const createNewPattern = useCallback(() => {
    const tileSize = normalizeTileSize(uiState.tileSize);
    const gridSize = uiState.gridSize || 20;
    const freshPattern = {
      id: `pattern-${Date.now()}`,
      name: 'Untitled Pattern',
      description: '',
      tileSize,
      gridSize,
      patternTiles: uiState.patternTiles,
      stitches: [],
    };
    setCurrentPattern(freshPattern);
    setSelectedStitchIds(new Set());
    setStitchColors(new Map());
    if (setDrawingState) {
      setDrawingState((prev) => ({ ...prev, firstPoint: null }));
    }
    
    return freshPattern;
  }, [uiState.tileSize, uiState.gridSize, uiState.patternTiles, setCurrentPattern, setSelectedStitchIds, setStitchColors, setDrawingState]);

  const resetToDefaults = useCallback(() => {
    // Reset all UI state to defaults
    uiState.resetuiState();
    
    // Update current pattern to match the new default artboard configuration
    setCurrentPattern((prev) => ({
      ...prev,
      tileSize: { x: 10, y: 10 }, // DEFAULT_TILE_SIZE
      gridSize: 20, // DEFAULT_GRID_SIZE
      patternTiles: { x: 4, y: 4 }, // DEFAULT_PATTERN_TILES
    }));
  }, [uiState, setCurrentPattern]);

  return {
    createNewPattern,
    resetToDefaults,
  };
}
