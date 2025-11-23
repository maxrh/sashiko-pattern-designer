/**
 * Pattern storage utilities using Dexie (IndexedDB)
 */

import db from './db.js';

/**
 * Save current pattern to database (auto-save on changes)
 */
export async function saveCurrentPattern(pattern, stitchColors, uiState) {
  try {
    const data = {
      key: 'current',
      pattern: {
        id: pattern.id,
        name: pattern.name,
        description: pattern.description,
        tileSize: pattern.tileSize,
        gridSize: pattern.gridSize,
        patternTiles: pattern.patternTiles,
        stitches: pattern.stitches,
      },
      stitchColors: Array.from(stitchColors.entries()),
      uiState: {
        patternTiles: uiState.patternTiles,
        gridSize: uiState.gridSize,
        backgroundColor: uiState.backgroundColor,
        selectedStitchColor: uiState.selectedStitchColor,
        stitchSize: uiState.stitchSize,
        stitchWidth: uiState.stitchWidth,
        gapSize: uiState.gapSize,
        repeatPattern: uiState.repeatPattern,
        showGrid: uiState.showGrid,
        gridColor: uiState.gridColor,
        tileOutlineColor: uiState.tileOutlineColor,
        artboardOutlineColor: uiState.artboardOutlineColor,
        displayUnit: uiState.displayUnit,
        colorPresets: uiState.colorPresets,
      },
      timestamp: Date.now(),
    };
    
    await db.currentPattern.put(data);
    return true;
  } catch (error) {
    console.error('Failed to save current pattern:', error);
    return false;
  }
}

/**
 * Load current pattern from database
 */
export async function loadCurrentPattern() {
  try {
    const data = await db.currentPattern.get('current');
    if (!data) return null;
    
    // Validate the data structure
    if (!data.pattern || !Array.isArray(data.pattern.stitches)) {
      return null;
    }

    return {
      pattern: data.pattern,
      stitchColors: new Map(data.stitchColors || []),
      uiState: data.uiState || {},
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error('Failed to load current pattern:', error);
    return null;
  }
}

/**
 * Clear current pattern from database
 */
export async function clearCurrentPattern() {
  try {
    await db.currentPattern.delete('current');
    return true;
  } catch (error) {
    console.error('Failed to clear current pattern:', error);
    return false;
  }
}

/**
 * Save a pattern to the user's saved patterns collection
 */
export async function saveToPatternLibrary(pattern, stitchColors, uiState) {
  try {
    const builtInIds = ['blank', 'asanoha', 'simple-cross', 'diagonal-flow', 'hitomezashi-cross', 'hitomezashi-kuchi', 'ajiro-wickerwork'];
    
    // Check if this is an existing saved pattern
    const existingPattern = await db.patterns.get(pattern.id);
    
    // Generate new ID if:
    // 1. Pattern is based on a built-in, OR
    // 2. Pattern doesn't have a user-generated ID, OR
    // 3. Pattern name has changed (indicating a "Save As" operation)
    let patternId = pattern.id;
    let isNewPattern = false;
    
    if (!patternId || builtInIds.includes(patternId) || patternId.startsWith('pattern-blank')) {
      // Always create new ID for built-in or blank patterns
      patternId = `pattern-${Date.now()}`;
      isNewPattern = true;
    } else if (existingPattern && existingPattern.name !== pattern.name) {
      // Name changed - create a new pattern (Save As behavior)
      patternId = `pattern-${Date.now()}`;
      isNewPattern = true;
    }
    
    // Create a clean pattern object with color overrides baked in
    const patternToSave = {
      id: patternId,
      name: pattern.name || 'Untitled Pattern',
      description: pattern.description || '',
      tileSize: pattern.tileSize,
      gridSize: pattern.gridSize,
      patternTiles: pattern.patternTiles,
      stitches: pattern.stitches.map(stitch => ({
        id: stitch.id,
        start: { ...stitch.start },
        end: { ...stitch.end },
        color: stitchColors.get(stitch.id) || stitch.color || null,
        stitchSize: stitch.stitchSize || 'small',
        stitchWidth: stitch.stitchWidth || 'normal',
        gapSize: stitch.gapSize ?? 9,
        curvature: stitch.curvature || 0,
        repeat: stitch.repeat !== false,
      })),
      uiState: uiState ? {
        backgroundColor: uiState.backgroundColor,
        gridColor: uiState.gridColor,
        tileOutlineColor: uiState.tileOutlineColor,
        artboardOutlineColor: uiState.artboardOutlineColor,
        gridSize: uiState.gridSize,
        tileSize: uiState.tileSize,
        patternTiles: uiState.patternTiles,
        selectedStitchColor: uiState.selectedStitchColor,
        stitchSize: uiState.stitchSize,
        stitchWidth: uiState.stitchWidth,
        gapSize: uiState.gapSize,
        repeatPattern: uiState.repeatPattern,
        showGrid: uiState.showGrid,
        displayUnit: uiState.displayUnit,
        colorPresets: uiState.colorPresets,
      } : undefined,
      createdAt: existingPattern?.createdAt || Date.now(),
      updatedAt: Date.now(),
      isStarterPattern: false,
    };

    // Use put() to either insert or update
    await db.patterns.put(patternToSave);
    
    return { success: true, pattern: patternToSave, isNewPattern };
  } catch (error) {
    console.error('Failed to save pattern to library:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load all saved patterns from database
 */
export async function loadSavedPatterns() {
  try {
    const patterns = await db.patterns.toArray();
    return patterns;
  } catch (error) {
    console.error('Failed to load saved patterns:', error);
    return [];
  }
}

/**
 * Delete a pattern from saved patterns
 */
export async function deletePattern(patternId) {
  try {
    await db.patterns.delete(patternId);
    return true;
  } catch (error) {
    console.error('Failed to delete pattern:', error);
    return false;
  }
}

/**
 * Export pattern as JSON file (download)
 */
export function exportPatternAsJSON(pattern, stitchColors) {
  const patternData = {
    id: pattern.id,
    name: pattern.name,
    description: pattern.description,
    tileSize: pattern.tileSize,
    gridSize: pattern.gridSize,
    patternTiles: pattern.patternTiles,
    stitches: pattern.stitches.map(stitch => ({
      id: stitch.id,
      start: { ...stitch.start },
      end: { ...stitch.end },
      color: stitchColors.get(stitch.id) || stitch.color || null,
      stitchSize: stitch.stitchSize || 'small',
      stitchWidth: stitch.stitchWidth || 'normal',
      gapSize: stitch.gapSize ?? 9,
      curvature: stitch.curvature || 0,
      repeat: stitch.repeat !== false,
    })),
    exportedAt: new Date().toISOString(),
  };

  const json = JSON.stringify(patternData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pattern.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import pattern from JSON file
 */
export function importPatternFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate pattern structure
        if (!data.gridSize || !Array.isArray(data.stitches)) {
          reject(new Error('Invalid pattern format'));
          return;
        }

        // Generate new ID to avoid conflicts
        const pattern = {
          ...data,
          id: `pattern-${Date.now()}`,
          importedAt: Date.now(),
        };

        resolve(pattern);
      } catch (error) {
        reject(new Error('Failed to parse pattern file: ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
