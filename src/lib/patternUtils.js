// Pattern utility functions for normalization and manipulation
import { DEFAULT_GAP_SIZE, DEFAULT_GRID_SIZE, DEFAULT_TILE_SIZE, DEFAULT_PATTERN_TILES } from '../hooks/useUiState.js';

/**
 * Normalize tileSize to {x, y} format
 */
export function normalizeTileSize(tileSize) {
  if (tileSize && typeof tileSize === 'object' && typeof tileSize.x === 'number' && typeof tileSize.y === 'number') {
    return { x: tileSize.x, y: tileSize.y };
  }
  return DEFAULT_TILE_SIZE;
}

/**
 * Normalize patternTiles to {x, y} format
 */
export function normalizePatternTiles(patternTiles) {
  if (patternTiles && typeof patternTiles === 'object' && typeof patternTiles.x === 'number' && typeof patternTiles.y === 'number') {
    return { x: patternTiles.x, y: patternTiles.y };
  }
  return { x: DEFAULT_PATTERN_TILES, y: DEFAULT_PATTERN_TILES };
}

/**
 * Clone a pattern with normalization
 */
export function clonePattern(pattern) {
  const defaultPattern = {
    id: 'pattern-blank',
    name: 'Untitled Pattern',
    description: '',
    tileSize: DEFAULT_TILE_SIZE,
    gridSize: DEFAULT_GRID_SIZE,
    patternTiles: { x: DEFAULT_PATTERN_TILES, y: DEFAULT_PATTERN_TILES },
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
    gridSize: pattern.gridSize ?? DEFAULT_GRID_SIZE,
    patternTiles: normalizePatternTiles(pattern.patternTiles ?? { x: DEFAULT_PATTERN_TILES, y: DEFAULT_PATTERN_TILES }),
    stitches: (pattern.stitches ?? []).map((stitch) => ({
      ...stitch,
      start: { ...stitch.start },
      end: { ...stitch.end },
      gapSize: stitch.gapSize ?? DEFAULT_GAP_SIZE, // Ensure all stitches have gapSize
    })),
  };
}

/**
 * Derive a color map from pattern stitches
 */
export function deriveColorMap(pattern) {
  const map = new Map();
  pattern?.stitches?.forEach((stitch) => {
    if (stitch.color) {
      map.set(stitch.id, stitch.color);
    }
  });
  return map;
}

/**
 * Validate pattern data structure
 */
export function isValidPattern(data) {
  const validTileSize = 
    data.tileSize && typeof data.tileSize === 'object' && 
    typeof data.tileSize.x === 'number' && typeof data.tileSize.y === 'number';
  
  const validPatternTiles = 
    data.patternTiles && typeof data.patternTiles === 'object' && 
    typeof data.patternTiles.x === 'number' && typeof data.patternTiles.y === 'number';
  
  return (
    data &&
    typeof data === 'object' &&
    validTileSize &&
    typeof data.gridSize === 'number' &&
    validPatternTiles &&
    Array.isArray(data.stitches)
  );
}
