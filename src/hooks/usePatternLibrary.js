import { useState, useCallback, useEffect } from 'react';
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
 * Handles saving, loading, and deleting patterns using Dexie (IndexedDB)
 */
export function usePatternLibrary() {
  const [savedPatterns, setSavedPatterns] = useState(BUILT_IN_PATTERNS);
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved'

  /**
   * Refresh the saved patterns list from database
   */
  const refreshPatterns = useCallback(async () => {
    try {
      const userPatterns = await loadSavedPatterns();
      setSavedPatterns([...BUILT_IN_PATTERNS, ...userPatterns]);
    } catch (error) {
      console.error('Failed to refresh patterns:', error);
    }
  }, []);

  /**
   * Initial load of saved patterns
   */
  useEffect(() => {
    const loadPatterns = async () => {
      setIsLoading(true);
      try {
        const userPatterns = await loadSavedPatterns();
        setSavedPatterns([...BUILT_IN_PATTERNS, ...userPatterns]);
      } catch (error) {
        console.error('Failed to load patterns:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatterns();
  }, []);

  /**
   * Save current pattern to library
   * @param {Object} pattern - Pattern object to save
   * @param {Map} stitchColors - Map of stitch colors
   * @param {Object} uiState - UI state to save with pattern
   * @returns {Promise<{success: boolean, pattern?: Object, error?: string}>}
   */
  const savePattern = useCallback(async (pattern, stitchColors, uiState) => {
    setSaveState('saving');
    
    try {
      const result = await saveToPatternLibrary(pattern, stitchColors, uiState);
      
      if (result.success) {
        // Reload saved patterns to include the newly saved one
        await refreshPatterns();
        
        setSaveState('saved');
        
        // Reset to idle after 2 seconds
        setTimeout(() => {
          setSaveState('idle');
        }, 2000);
        
        return result;
      } else {
        setSaveState('idle');
        return result;
      }
    } catch (error) {
      setSaveState('idle');
      return { success: false, error: error.message };
    }
  }, [refreshPatterns]);

  /**
   * Delete a pattern from library
   * @param {string} patternId - ID of pattern to delete
   */
  const removePattern = useCallback(async (patternId) => {
    try {
      await deletePattern(patternId);
      await refreshPatterns();
    } catch (error) {
      console.error('Failed to delete pattern:', error);
    }
  }, [refreshPatterns]);

  return {
    savedPatterns,
    isLoading,
    saveState,
    savePattern,
    removePattern,
    refreshPatterns,
  };
}
