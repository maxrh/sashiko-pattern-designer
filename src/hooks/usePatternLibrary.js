import { useState, useCallback } from 'react';
import patternsData from '../data/patterns.json';
import { clonePattern } from '../lib/patternUtils.js';
import {
  saveToPatternLibrary,
  loadSavedPatterns,
  deletePattern,
} from '../lib/patternStorage';

const BUILT_IN_PATTERNS = patternsData.map(clonePattern);

/**
 * Custom hook for managing pattern library operations
 * Handles saving, loading, and deleting patterns
 */
export function usePatternLibrary() {
  const [savedPatterns, setSavedPatterns] = useState(() => {
    const userPatterns = loadSavedPatterns();
    return [...BUILT_IN_PATTERNS, ...userPatterns];
  });

  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved'

  /**
   * Refresh the saved patterns list from storage
   */
  const refreshPatterns = useCallback(() => {
    const userPatterns = loadSavedPatterns();
    setSavedPatterns([...BUILT_IN_PATTERNS, ...userPatterns]);
  }, []);

  /**
   * Save current pattern to library
   * @param {Object} pattern - Pattern object to save
   * @param {Map} stitchColors - Map of stitch colors
   * @param {Object} uiState - UI state to save with pattern
   * @returns {Promise<{success: boolean, pattern?: Object, error?: string}>}
   */
  const savePattern = useCallback((pattern, stitchColors, uiState) => {
    return new Promise((resolve) => {
      setSaveState('saving');
      
      // Use setTimeout to ensure state update is processed
      setTimeout(() => {
        const result = saveToPatternLibrary(pattern, stitchColors, uiState);
        
        if (result.success) {
          // Reload saved patterns to include the newly saved one
          refreshPatterns();
          
          setSaveState('saved');
          
          // Reset to idle after 2 seconds
          setTimeout(() => {
            setSaveState('idle');
          }, 2000);
          
          resolve(result);
        } else {
          setSaveState('idle');
          resolve(result);
        }
      }, 300);
    });
  }, [refreshPatterns]);

  /**
   * Delete a pattern from library
   * @param {string} patternId - ID of pattern to delete
   */
  const removePattern = useCallback((patternId) => {
    deletePattern(patternId);
    refreshPatterns();
  }, [refreshPatterns]);

  return {
    savedPatterns,
    saveState,
    savePattern,
    removePattern,
    refreshPatterns,
  };
}
