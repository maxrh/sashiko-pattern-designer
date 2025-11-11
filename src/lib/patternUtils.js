// Pattern utility functions for normalization and manipulation

// Default grid cell size in pixels
export const DEFAULT_GRID_SIZE = 20;

/**
 * Normalize tileSize to {x, y} format
 */
export function normalizeTileSize(tileSize) {
  if (tileSize && typeof tileSize === 'object' && typeof tileSize.x === 'number' && typeof tileSize.y === 'number') {
    return { x: tileSize.x, y: tileSize.y };
  }
  return { x: 10, y: 10 }; // Default
}

/**
 * Normalize patternTiles to {x, y} format
 */
export function normalizePatternTiles(patternTiles) {
  if (patternTiles && typeof patternTiles === 'object' && typeof patternTiles.x === 'number' && typeof patternTiles.y === 'number') {
    return { x: patternTiles.x, y: patternTiles.y };
  }
  return { x: 4, y: 4 }; // Default
}

/**
 * Clone a pattern with normalization
 */
export function clonePattern(pattern, DEFAULT_GAP_SIZE = 9) {
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
    patternTiles: normalizePatternTiles(pattern.patternTiles ?? { x: 4, y: 4 }),
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
