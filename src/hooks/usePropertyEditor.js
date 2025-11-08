import { useCallback } from 'react';

/**
 * Custom hook for property editor handlers
 * Handles changing stitch properties (size, width, gap) for selected stitches or defaults
 */
export function usePropertyEditor({
  selectedStitchIds,
  setCurrentPattern,
  setStitchSize,
  setStitchWidth,
  setGapSize,
  historyManager,
}) {
  /**
   * Change stitch size for selected stitches or update default
   * @param {number} newSize - New stitch size value
   */
  const handleChangeSelectedStitchSize = useCallback((newSize) => {
    if (selectedStitchIds.size > 0) {
      // Update selected stitches
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, stitchSize: newSize }
            : stitch
        ),
      }));
    } else {
      // Update default for draw tool
      setStitchSize(newSize);
    }
  }, [selectedStitchIds, setCurrentPattern, setStitchSize]);

  /**
   * Change stitch width for selected stitches or update default
   * @param {number} newWidth - New stitch width value
   */
  const handleChangeSelectedStitchWidth = useCallback((newWidth) => {
    if (selectedStitchIds.size > 0) {
      // Update selected stitches
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, stitchWidth: newWidth }
            : stitch
        ),
      }));
    } else {
      // Update default for draw tool
      setStitchWidth(newWidth);
    }
  }, [selectedStitchIds, setCurrentPattern, setStitchWidth]);

  /**
   * Change gap size for selected stitches or update default
   * Marks as editing to prevent history spam during slider drag
   * @param {number} newGapSize - New gap size value
   */
  const handleChangeSelectedGapSize = useCallback((newGapSize) => {
    if (selectedStitchIds.size > 0) {
      // Mark that we're editing properties to prevent history spam
      historyManager.isEditingProperties.current = true;
      
      // Update selected stitches
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, gapSize: newGapSize }
            : stitch
        ),
      }));
      // Also update the UI state so slider stays in sync
      setGapSize(newGapSize);
    } else {
      // Update default for draw tool
      setGapSize(newGapSize);
    }
  }, [selectedStitchIds, setCurrentPattern, setGapSize, historyManager]);

  return {
    handleChangeSelectedStitchSize,
    handleChangeSelectedStitchWidth,
    handleChangeSelectedGapSize,
  };
}
