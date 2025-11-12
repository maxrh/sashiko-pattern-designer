import { useState, useRef, useCallback, useEffect } from 'react';
import db from '../lib/db.js';

/**
 * Hook to manage undo/redo history for pattern editing
 * History is persisted to IndexedDB for preservation across page reloads
 * @param {number} maxHistorySize - Maximum number of history states to keep (default: 10)
 * @returns {Object} History state and control functions
 */
export function useHistory(maxHistorySize = 10) {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);
  const isEditingProperties = useRef(false);
  const previousSelectionState = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from IndexedDB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const saved = await db.history.get('undoRedo');
        if (saved && saved.history && Array.isArray(saved.history)) {
          // Restore Map objects from serialized arrays
          const restoredHistory = saved.history.map(state => ({
            ...state,
            stitchColors: new Map(state.stitchColors),
          }));
          setHistory(restoredHistory);
          setHistoryIndex(saved.historyIndex ?? -1);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadHistory();
  }, []);

  // Save history to IndexedDB whenever it changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save until we've loaded

    const saveHistory = async () => {
      try {
        // Serialize Map objects to arrays for storage
        const serializedHistory = history.map(state => ({
          ...state,
          stitchColors: Array.from(state.stitchColors.entries()),
        }));

        await db.history.put({
          key: 'undoRedo',
          history: serializedHistory,
          historyIndex,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Failed to save history:', error);
      }
    };

    saveHistory();
  }, [history, historyIndex, isLoaded]);

  /**
   * Add a new state to history
   * @param {Object} state - State object containing pattern and stitchColors
   * @param {Object} state.pattern - Pattern object with stitches
   * @param {Map} state.stitchColors - Map of stitch colors
   */
  const pushHistory = useCallback((state) => {
    // Skip if this is an undo/redo action
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    // Skip if actively editing properties (gap size, stitch size, etc.)
    if (isEditingProperties.current) {
      return;
    }

    // Check if the new state is identical to the current history state
    if (historyIndex >= 0 && historyIndex < history.length) {
      const currentState = history[historyIndex];
      const isSameStitchCount = currentState.pattern.stitches.length === state.pattern.stitches.length;
      const isSameColorCount = currentState.stitchColors.size === state.stitchColors.size;
      
      // Simple check: if stitch count and color count are the same, likely duplicate
      // This prevents duplicate entries when page loads with saved state
      if (isSameStitchCount && isSameColorCount) {
        // Additional check: compare stitch IDs
        const currentIds = new Set(currentState.pattern.stitches.map(s => s.id));
        const newIds = new Set(state.pattern.stitches.map(s => s.id));
        const idsMatch = currentIds.size === newIds.size && 
                         [...currentIds].every(id => newIds.has(id));
        
        if (idsMatch) {
          return; // Skip duplicate state
        }
      }
    }

    // Create new state with shallow copies
    const newState = {
      pattern: {
        ...state.pattern,
        stitches: [...state.pattern.stitches], // Shallow copy of array
      },
      stitchColors: new Map(state.stitchColors),
      timestamp: Date.now(),
    };

    setHistory(prev => {
      // If we're not at the end of history, remove everything after current index
      const newHistory = historyIndex >= 0 ? prev.slice(0, historyIndex + 1) : prev;
      // Add new state and keep only last maxHistorySize items
      return [...newHistory, newState].slice(-maxHistorySize);
    });

    setHistoryIndex(prev => {
      const currentHistory = prev >= 0 ? history.slice(0, prev + 1) : history;
      return Math.min(currentHistory.length, maxHistorySize - 1);
    });
  }, [historyIndex, history, maxHistorySize]);

  /**
   * Undo to previous state
   * @returns {Object|null} Previous state or null if can't undo
   */
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      isUndoRedoAction.current = true;
      setHistoryIndex(prev => prev - 1);
      return {
        pattern: {
          ...prevState.pattern,
          stitches: [...prevState.pattern.stitches],
        },
        stitchColors: new Map(prevState.stitchColors),
      };
    }
    return null;
  }, [history, historyIndex]);

  /**
   * Redo to next state
   * @returns {Object|null} Next state or null if can't redo
   */
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      isUndoRedoAction.current = true;
      setHistoryIndex(prev => prev + 1);
      return {
        pattern: {
          ...nextState.pattern,
          stitches: [...nextState.pattern.stitches],
        },
        stitchColors: new Map(nextState.stitchColors),
      };
    }
    return null;
  }, [history, historyIndex]);

  /**
   * Save state after property editing is complete
   * Used to batch history entries when adjusting properties like gap size
   */
  const saveAfterPropertyEdit = useCallback((state) => {
    if (isEditingProperties.current) {
      isEditingProperties.current = false;
      pushHistory(state);
    }
  }, [pushHistory]);

  return {
    // State
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    historySize: history.length,
    
    // Actions
    pushHistory,
    undo,
    redo,
    
    // Refs for special cases
    isEditingProperties,
    previousSelectionState,
    saveAfterPropertyEdit,
  };
}
