/**
 * Local storage utilities for saving and loading patterns
 */

const STORAGE_KEYS = {
  CURRENT_PATTERN: 'sashiko_current_pattern',
  SAVED_PATTERNS: 'sashiko_saved_patterns',
  UI_STATE: 'sashiko_ui_state',
};

/**
 * Save current pattern to local storage (auto-save on changes)
 */
export function saveCurrentPattern(pattern, stitchColors, uiState) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  
  try {
    const data = {
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
        defaultThreadColor: uiState.defaultThreadColor,
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
      },
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_PATTERN, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save current pattern:', error);
    return false;
  }
}

/**
 * Load current pattern from local storage
 */
export function loadCurrentPattern() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_PATTERN);
    if (!data) return null;

    const parsed = JSON.parse(data);
    
    // Validate the data structure
    if (!parsed.pattern || !Array.isArray(parsed.pattern.stitches)) {
      return null;
    }

    return {
      pattern: parsed.pattern,
      stitchColors: new Map(parsed.stitchColors || []),
      uiState: parsed.uiState || {},
      timestamp: parsed.timestamp,
    };
  } catch (error) {
    console.error('Failed to load current pattern:', error);
    return null;
  }
}

/**
 * Clear current pattern from local storage
 */
export function clearCurrentPattern() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PATTERN);
    return true;
  } catch (error) {
    console.error('Failed to clear current pattern:', error);
    return false;
  }
}

/**
 * Save a pattern to the user's saved patterns collection
 */
export function saveToPatternLibrary(pattern, stitchColors, uiState) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { success: false, error: 'localStorage not available' };
  }
  
  try {
    const savedPatterns = loadSavedPatterns();
    const builtInIds = ['blank', 'asanoha', 'simple-cross', 'diagonal-flow', 'hitomezashi-cross', 'hitomezashi-kuchi'];
    
    // Check if this is an existing saved pattern
    const existingPattern = savedPatterns.find(p => p.id === pattern.id);
    
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
        repeat: stitch.repeat !== false,
      })),
      uiState: uiState ? {
        backgroundColor: uiState.backgroundColor,
        gridColor: uiState.gridColor,
        tileOutlineColor: uiState.tileOutlineColor,
        artboardOutlineColor: uiState.artboardOutlineColor,
        displayUnit: uiState.displayUnit,
      } : undefined,
      savedAt: Date.now(),
    };

    // Check if pattern already exists (by id)
    const existingIndex = savedPatterns.findIndex(p => p.id === patternToSave.id);
    
    if (existingIndex >= 0 && !isNewPattern) {
      // Update existing pattern (only if we're not creating a new one)
      savedPatterns[existingIndex] = patternToSave;
    } else {
      // Add new pattern
      savedPatterns.push(patternToSave);
    }

    localStorage.setItem(STORAGE_KEYS.SAVED_PATTERNS, JSON.stringify(savedPatterns));
    return { success: true, pattern: patternToSave, isNewPattern };
  } catch (error) {
    console.error('Failed to save pattern to library:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load all saved patterns from local storage
 */
export function loadSavedPatterns() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SAVED_PATTERNS);
    if (!data) return [];

    const patterns = JSON.parse(data);
    return Array.isArray(patterns) ? patterns : [];
  } catch (error) {
    console.error('Failed to load saved patterns:', error);
    return [];
  }
}

/**
 * Delete a pattern from saved patterns
 */
export function deletePattern(patternId) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  
  try {
    const savedPatterns = loadSavedPatterns();
    const filtered = savedPatterns.filter(p => p.id !== patternId);
    localStorage.setItem(STORAGE_KEYS.SAVED_PATTERNS, JSON.stringify(filtered));
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
