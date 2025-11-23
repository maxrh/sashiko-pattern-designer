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
  historyManager, // Add history manager parameter
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
        const colorMap = deriveColorMap(normalized);
        setStitchColors(colorMap);
        setSelectedStitchIds(new Set());
        setDrawingState((prev) => ({ ...prev, firstPoint: null }));
        
        // Reset history with imported pattern as initial state
        historyManager.clearHistory({
          pattern: { stitches: normalized.stitches },
          stitchColors: colorMap,
        });
        
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

  /**
   * Copy pattern to clipboard in compact format for patterns.json
   * Formats the pattern with single-line stitches for easy pasting
   */
  const copyPatternToClipboard = useCallback(() => {
    // Create pattern object in the format expected by patterns.json
    const patternForJson = {
      id: currentPattern.id,
      name: currentPattern.name || 'Untitled Pattern',
      description: currentPattern.description || '',
      tileSize: currentPattern.tileSize,
      gridSize: currentPattern.gridSize,
      patternTiles: currentPattern.patternTiles,
      stitches: currentPattern.stitches.map(stitch => ({
        id: stitch.id,
        start: { ...stitch.start },
        end: { ...stitch.end },
        color: stitchColors.get(stitch.id) || stitch.color || null,
        stitchSize: stitch.stitchSize || 'small',
        stitchWidth: stitch.stitchWidth || 'normal',
        gapSize: stitch.gapSize,
        curvature: stitch.curvature || 0,
        repeat: stitch.repeat !== false,
      })),
      uiState: {
        backgroundColor,
        gridColor,
        tileOutlineColor,
        artboardOutlineColor,
      },
    };

    // Custom compact JSON formatting - stitches on single lines
    const formatStitch = (stitch) => {
      const parts = [];
      parts.push(`"id": "${stitch.id}"`);
      parts.push(`"start": ${JSON.stringify(stitch.start)}`);
      parts.push(`"end": ${JSON.stringify(stitch.end)}`);
      parts.push(`"color": "${stitch.color}"`);
      parts.push(`"stitchSize": "${stitch.stitchSize}"`);
      parts.push(`"stitchWidth": "${stitch.stitchWidth}"`);
      if (stitch.gapSize !== undefined) {
        parts.push(`"gapSize": ${stitch.gapSize}`);
      }
      if (stitch.curvature) {
        parts.push(`"curvature": ${stitch.curvature}`);
      }
      parts.push(`"repeat": ${stitch.repeat}`);
      return `{ ${parts.join(', ')} }`;
    };

    const stitchesJson = patternForJson.stitches.length === 0 
      ? '[]'
      : '[\n      ' + patternForJson.stitches.map(formatStitch).join(',\n      ') + '\n    ]';

    const jsonString = `{
    "id": "${patternForJson.id}",
    "name": "${patternForJson.name}",
    "description": "${patternForJson.description}",
    "tileSize": ${JSON.stringify(patternForJson.tileSize)},
    "gridSize": ${patternForJson.gridSize},
    "patternTiles": ${JSON.stringify(patternForJson.patternTiles)},
    "stitches": ${stitchesJson},
    "uiState": {
      "backgroundColor": "${patternForJson.uiState.backgroundColor}",
      "gridColor": "${patternForJson.uiState.gridColor}",
      "tileOutlineColor": "${patternForJson.uiState.tileOutlineColor}",
      "artboardOutlineColor": "${patternForJson.uiState.artboardOutlineColor}"
    }
  }`;
    
    // Copy to clipboard
    return navigator.clipboard.writeText(jsonString);
  }, [
    currentPattern,
    stitchColors,
    backgroundColor,
    gridColor,
    tileOutlineColor,
    artboardOutlineColor,
  ]);

  return {
    exportPattern,
    importPattern,
    exportImage,
    copyPatternToClipboard,
  };
}
