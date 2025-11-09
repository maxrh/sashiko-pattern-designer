import { useEffect } from 'react';

/**
 * Hook to handle keyboard shortcuts for the pattern designer
 * @param {Object} handlers - Object containing handler functions
 * @param {Function} handlers.onUndo - Undo handler
 * @param {Function} handlers.onRedo - Redo handler
 * @param {Function} handlers.onSelectMode - Select mode handler
 * @param {Function} handlers.onDrawMode - Draw mode handler
 * @param {Function} handlers.onToggleRepeat - Toggle repeat pattern handler
 * @param {Function} handlers.onToggleGrid - Toggle grid visibility handler
 * @param {Function} handlers.onDelete - Delete selected handler
 * @param {Function} handlers.onEscape - Escape handler
 * @param {number} selectedCount - Number of selected items
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSelectMode,
  onDrawMode,
  onToggleRepeat,
  onToggleGrid,
  onDelete,
  onEscape,
  selectedCount = 0,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignore shortcuts when typing in input fields or textareas
      const target = event.target;
      const isTyping = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable;
      
      if (isTyping) {
        return; // Don't trigger shortcuts while typing
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        onUndo?.();
        return;
      }
      
      // Redo: Ctrl+Y or Cmd+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        onRedo?.();
        return;
      }
      
      // Tool shortcuts: V for select, P for pen/draw (no modifiers)
      if ((event.key === 'v' || event.key === 'V') && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        onSelectMode?.();
        return;
      }
      
      if ((event.key === 'p' || event.key === 'P') && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        onDrawMode?.();
        return;
      }
      
      // View shortcuts: R for repeat pattern, H for hide/show grid (no modifiers)
      if ((event.key === 'r' || event.key === 'R') && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        onToggleRepeat?.();
        return;
      }
      
      if ((event.key === 'h' || event.key === 'H') && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        onToggleGrid?.();
        return;
      }
      
      // Delete: Delete or Backspace (only if items are selected)
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedCount > 0) {
        event.preventDefault();
        onDelete?.();
      }
      
      // Escape: Cancel current action
      if (event.key === 'Escape') {
        onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onSelectMode, onDrawMode, onToggleRepeat, onToggleGrid, onDelete, onEscape, selectedCount]);
}
