import { useCallback } from 'react';

/**
 * Custom hook for property editor handlers
 * Handles changing stitch properties (size, width) for selected stitches or defaults
 * Note: Gap size is now handled directly in PatternDesigner with live preview
 */
export function usePropertyEditor({
  selectedStitchIds,
  setCurrentPattern,
  setStitchSize,
  setStitchWidth,
  setIsEditingProperties,
}) {
  /**
   * Change stitch size for selected stitches or update default
   * @param {number} newSize - New stitch size value
   */
  const handleChangeSelectedStitchSize = useCallback((newSize) => {
    if (selectedStitchIds.size > 0) {
      // Mark that we're editing properties to prevent history saves
      setIsEditingProperties(true);
      
      // Update selected stitches
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, stitchSize: newSize }
            : stitch
        ),
      }));
      
      // Mark editing complete after applying change
      setTimeout(() => setIsEditingProperties(false), 0);
    } else {
      // Update default for draw tool
      setStitchSize(newSize);
    }
  }, [selectedStitchIds, setCurrentPattern, setStitchSize, setIsEditingProperties]);

  /**
   * Change stitch width for selected stitches or update default
   * @param {number} newWidth - New stitch width value
   */
  const handleChangeSelectedStitchWidth = useCallback((newWidth) => {
    if (selectedStitchIds.size > 0) {
      // Mark that we're editing properties to prevent history saves
      setIsEditingProperties(true);
      
      // Update selected stitches
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, stitchWidth: newWidth }
            : stitch
        ),
      }));
      
      // Mark editing complete after applying change
      setTimeout(() => setIsEditingProperties(false), 0);
    } else {
      // Update default for draw tool
      setStitchWidth(newWidth);
    }
  }, [selectedStitchIds, setCurrentPattern, setStitchWidth, setIsEditingProperties]);

  return {
    handleChangeSelectedStitchSize,
    handleChangeSelectedStitchWidth,
  };
}
