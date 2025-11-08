import { useCallback } from 'react';
import { clonePattern, deriveColorMap, isValidPattern } from '../lib/patternUtils.js';

/**
 * Custom hook for pattern import/export operations
 * Handles exporting patterns as JSON, importing patterns, and exporting as images
 */
export function usePatternImportExport({
  currentPattern,
  stitchColors,
  backgroundColor,
  gridColor,
  tileOutlineColor,
  artboardOutlineColor,
  selectedStitchColor,
  stitchSize,
  stitchWidth,
  gapSize,
  repeatPattern,
  showGrid,
  setCurrentPattern,
  setStitchColors,
  setSelectedStitchIds,
  setDrawingState,
  setBackgroundColor,
  setGridColor,
  setTileOutlineColor,
  setArtboardOutlineColor,
  canvasRef,
}) {
  /**
   * Export current pattern as JSON file
   */
  const exportPattern = useCallback(() => {
    const exportPattern = {
      ...currentPattern,
      stitches: currentPattern.stitches.map((stitch) => ({
        ...stitch,
        color: stitchColors.get(stitch.id) ?? stitch.color ?? null,
      })),
      uiState: {
        backgroundColor,
        gridColor,
        tileOutlineColor,
        artboardOutlineColor,
        selectedStitchColor,
        stitchSize,
        stitchWidth,
        gapSize,
        repeatPattern,
        showGrid,
      },
    };

    const blob = new Blob([JSON.stringify(exportPattern, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = (currentPattern.name || 'pattern').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `${slug || 'pattern'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [
    currentPattern,
    stitchColors,
    backgroundColor,
    gridColor,
    tileOutlineColor,
    artboardOutlineColor,
    selectedStitchColor,
    stitchSize,
    stitchWidth,
    gapSize,
    repeatPattern,
    showGrid,
  ]);

  /**
   * Import pattern from JSON file
   * @param {File} file - JSON file to import
   */
  const importPattern = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!isValidPattern(parsed)) {
          throw new Error('Invalid pattern schema');
        }
        
        // Handle legacy format migration
        let tileSize, gridSize;
        if (parsed.tileSize !== undefined) {
          // New format
          tileSize = parsed.tileSize;
          gridSize = parsed.gridSize ?? 20;
        } else {
          // Legacy format - old gridSize becomes tileSize
          tileSize = parsed.gridSize ?? 10;
          gridSize = 20;
        }
        
        const normalized = clonePattern({
          ...parsed,
          id: parsed.id ?? `pattern-${Date.now()}`,
          name: parsed.name ?? 'Imported Pattern',
          description: parsed.description ?? '',
          tileSize,
          gridSize,
        });
        
        setCurrentPattern(normalized);
        setStitchColors(deriveColorMap(normalized));
        setSelectedStitchIds(new Set());
        setDrawingState((prev) => ({ ...prev, firstPoint: null }));
        
        // Restore UI state if included in the imported pattern
        if (parsed.uiState) {
          if (parsed.uiState.backgroundColor) setBackgroundColor(parsed.uiState.backgroundColor);
          if (parsed.uiState.gridColor) setGridColor(parsed.uiState.gridColor);
          if (parsed.uiState.tileOutlineColor) setTileOutlineColor(parsed.uiState.tileOutlineColor);
          if (parsed.uiState.artboardOutlineColor) setArtboardOutlineColor(parsed.uiState.artboardOutlineColor);
        }
      } catch (error) {
        console.error('Failed to import pattern:', error);
      }
    };
    reader.readAsText(file);
  }, [
    setCurrentPattern,
    setStitchColors,
    setSelectedStitchIds,
    setDrawingState,
    setBackgroundColor,
    setGridColor,
    setTileOutlineColor,
    setArtboardOutlineColor,
  ]);

  /**
   * Export current pattern as PNG image
   * @param {number} resolutionMultiplier - Scale factor for export resolution
   */
  const exportImage = useCallback((resolutionMultiplier = 1) => {
    const dataUrl = canvasRef.current?.exportAsImage?.(resolutionMultiplier);
    if (!dataUrl) return;
    
    const link = document.createElement('a');
    link.href = dataUrl;
    const slug = (currentPattern.name || 'pattern').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const suffix = resolutionMultiplier !== 1 ? `-${resolutionMultiplier}x` : '';
    link.download = `${slug || 'pattern'}${suffix}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentPattern.name, canvasRef]);

  return {
    exportPattern,
    importPattern,
    exportImage,
  };
}
