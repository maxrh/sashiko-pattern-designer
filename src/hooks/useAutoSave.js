import { useEffect, useRef } from 'react';
import { saveCurrentPattern } from '../lib/patternStorage.js';

/**
 * Hook to manage auto-saving UI state to IndexedDB
 * Separate from useHistory which handles undo/redo for stitches only
 * Uses debouncing to prevent excessive writes during rapid changes
 * @param {Object} params - Auto-save configuration
 * @param {Object} params.currentPattern - Current pattern state
 * @param {Map} params.stitchColors - Stitch colors Map
 * @param {Object} params.uiState - UI state to save (canvas settings, toolbar state, etc.)
 * @param {number} params.debounceMs - Debounce delay in milliseconds (default: 500)
 * @param {boolean} params.enabled - Whether auto-save is enabled (default: true after init)
 */
export function useAutoSave({
  currentPattern,
  stitchColors,
  uiState,
  debounceMs = 500,
  enabled = true,
}) {
  const hasInitialized = useRef(false);

  // Track initialization state
  useEffect(() => {
    if (enabled && !hasInitialized.current) {
      hasInitialized.current = true;
    }
  }, [enabled]);

  // Auto-save to database whenever pattern, colors, or UI settings change (throttled)
  // Only saves stitches and colors - UI settings trigger save but use same payload
  useEffect(() => {
    if (!hasInitialized.current) return;
    
    const timeoutId = setTimeout(() => {
      saveCurrentPattern(currentPattern, stitchColors, uiState);
    }, debounceMs); // Debounce saves to avoid excessive writes
    
    return () => clearTimeout(timeoutId);
  }, [
    currentPattern.stitches, // Trigger on stitch changes
    stitchColors.size, // Track Map size instead of Map reference to avoid infinite loops
    // Canvas settings - included so they trigger auto-save when changed
    uiState.patternTiles?.x,
    uiState.patternTiles?.y,
    uiState.backgroundColor,
    uiState.gridSize,
    uiState.gridColor,
    uiState.tileOutlineColor,
    uiState.artboardOutlineColor,
    currentPattern,
    stitchColors,
    uiState,
    debounceMs,
  ]);

  return {
    hasInitialized: hasInitialized.current,
  };
}
