import { useCallback } from 'react';

/**
 * Custom hook for property editor handlers
 * Handles changing stitch properties (size, width) for selected stitches or defaults
 * Uses temporary state system like gap size and color for proper history batching
 */
export function usePropertyEditor({
  selectedStitchIds,
  setStitchSize,
  setStitchWidth,
  setTempStitchSize,
  setTempStitchWidth,
  setTempCurvature,
  setIsEditingProperties,
}) {
  /**
   * Change stitch size for selected stitches or update default
   * @param {number} newSize - New stitch size value
   */
  const handleChangeSelectedStitchSize = useCallback((newSize) => {
    if (selectedStitchIds.size > 0) {
      // Use temporary state system for live preview with batched history
      setIsEditingProperties(true);
      setTempStitchSize(newSize);
      
      // Mark editing complete to trigger property history effect
      setTimeout(() => setIsEditingProperties(false), 0);
    } else {
      // Update default for draw tool (no history needed)
      setStitchSize(newSize);
    }
  }, [selectedStitchIds, setStitchSize, setTempStitchSize, setIsEditingProperties]);

  /**
   * Change stitch width for selected stitches or update default
   * @param {number} newWidth - New stitch width value
   */
  const handleChangeSelectedStitchWidth = useCallback((newWidth) => {
    if (selectedStitchIds.size > 0) {
      // Use temporary state system for live preview with batched history
      setIsEditingProperties(true);
      setTempStitchWidth(newWidth);
      
      // Mark editing complete to trigger property history effect
      setTimeout(() => setIsEditingProperties(false), 0);
    } else {
      // Update default for draw tool (no history needed)
      setStitchWidth(newWidth);
    }
  }, [selectedStitchIds, setStitchWidth, setTempStitchWidth, setIsEditingProperties]);

  return {
    handleChangeSelectedStitchSize,
    handleChangeSelectedStitchWidth,
  };
}
