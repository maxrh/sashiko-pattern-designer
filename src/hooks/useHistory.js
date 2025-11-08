import { useState, useRef, useCallback } from 'react';

/**
 * Hook to manage undo/redo history for pattern editing
 * @param {number} maxHistorySize - Maximum number of history states to keep (default: 10)
 * @returns {Object} History state and control functions
 */
export function useHistory(maxHistorySize = 10) {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);
  const isEditingProperties = useRef(false);
  const previousSelectionState = useRef(null);

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
