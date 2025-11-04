import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import patternsData from '../data/patterns.json';
import { CanvasViewport } from './CanvasViewport.jsx';
import { Toolbar } from './Toolbar.jsx';
import { AppSidebar } from './AppSidebar.jsx';
import { Badge } from './ui/badge';
import { SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { 
  saveCurrentPattern, 
  loadCurrentPattern, 
  loadSavedPatterns,
  saveToPatternLibrary,
  deletePattern,
  exportPatternAsJSON,
  importPatternFromJSON,
} from '../lib/patternStorage.js';

const CELL_SIZE = 20;
const COLOR_PRESETS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'White', value: '#f5f5f5' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Coral', value: '#fb7185' },
  { label: 'Black', value: '#0b1120' },
];

// Default settings constants
const DEFAULT_PATTERN_TILES = 4;
const DEFAULT_BACKGROUND_COLOR = '#0f172a'; // neutral-100
const DEFAULT_STITCH_COLOR = '#f5f5f5'; // white - default color for stitches
const DEFAULT_STITCH_SIZE = 'medium';
const DEFAULT_REPEAT_PATTERN = true;
const DEFAULT_SHOW_GRID = true;

function clonePattern(pattern) {
  if (!pattern) {
    return {
      id: 'pattern-blank',
      name: 'Untitled Pattern',
      description: '',
      tileSize: 10,
      gridSize: 20,
      patternTiles: 4,
      stitches: [],
    };
  }

  return {
    ...pattern,
    stitches: (pattern.stitches ?? []).map((stitch) => ({
      ...stitch,
      start: { ...stitch.start },
      end: { ...stitch.end },
    })),
  };
}

function deriveColorMap(pattern) {
  const map = new Map();
  pattern?.stitches?.forEach((stitch) => {
    if (stitch.color) {
      map.set(stitch.id, stitch.color);
    }
  });
  return map;
}

function isValidPattern(data) {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.tileSize === 'number' &&
    typeof data.gridSize === 'number' &&
    typeof data.patternTiles === 'number' &&
    Array.isArray(data.stitches)
  );
}

export default function PatternDesigner() {
  // Load saved patterns from local storage + built-in patterns
  const [savedPatterns, setSavedPatterns] = useState(() => {
    const userPatterns = loadSavedPatterns();
    const builtInPatterns = patternsData.map(clonePattern);
    return [...builtInPatterns, ...userPatterns];
  });

  // Initialize state from local storage or defaults
  const [currentPattern, setCurrentPattern] = useState(() => {
    const saved = loadCurrentPattern();
    if (saved && saved.pattern) {
      // Ensure the loaded pattern has required fields (migration for old data)
      const migratedPattern = {
        ...saved.pattern,
        tileSize: saved.pattern.tileSize ?? 10, // Add missing tileSize
        gridSize: saved.pattern.gridSize ?? CELL_SIZE, // Ensure gridSize exists
        patternTiles: saved.pattern.patternTiles ?? DEFAULT_PATTERN_TILES, // Add missing patternTiles
      };
      return migratedPattern;
    }
    const fallback = patternsData.find((pattern) => pattern.id === 'blank') ?? patternsData[0];
    return clonePattern(fallback);
  });

  const [stitchColors, setStitchColors] = useState(() => {
    const saved = loadCurrentPattern();
    if (saved && saved.stitchColors) {
      return saved.stitchColors;
    }
    return deriveColorMap(currentPattern);
  });

  const [selectedStitchIds, setSelectedStitchIds] = useState(() => new Set());
  const [drawingState, setDrawingState] = useState({ mode: 'select', firstPoint: null });

  // Load pattern tiles from the pattern itself, not UI state
  const [patternTiles, setPatternTiles] = useState(() => {
    return currentPattern.patternTiles ?? DEFAULT_PATTERN_TILES;
  });
  const [defaultStitchColor, setDefaultStitchColor] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.defaultStitchColor ?? DEFAULT_STITCH_COLOR;
  });
  const [backgroundColor, setBackgroundColor] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.backgroundColor ?? DEFAULT_BACKGROUND_COLOR;
  });
  const [selectedStitchColor, setSelectedStitchColor] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.selectedStitchColor ?? DEFAULT_STITCH_COLOR;
  });
  const [stitchSize, setStitchSize] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.stitchSize ?? DEFAULT_STITCH_SIZE;
  });
  const [repeatPattern, setRepeatPattern] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.repeatPattern ?? DEFAULT_REPEAT_PATTERN;
  });
  const [showGrid, setShowGrid] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.showGrid ?? DEFAULT_SHOW_GRID;
  });

  const [sidebarTab, setSidebarTab] = useState('controls');
  const [isHydrated, setIsHydrated] = useState(false);
  const canvasRef = useRef(null);

  // Mark as hydrated after initial render to prevent SSR mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Sync pattern tiles with current pattern
  useEffect(() => {
    if (currentPattern.patternTiles && currentPattern.patternTiles !== patternTiles) {
      setPatternTiles(currentPattern.patternTiles);
    }
  }, [currentPattern.patternTiles, patternTiles]);

  // Update sidebar options when selection changes
  useEffect(() => {
    if (selectedStitchIds.size > 0) {
      const selectedStitches = currentPattern.stitches.filter(stitch => 
        selectedStitchIds.has(stitch.id)
      );
      
      // Update stitch size if all selected stitches have the same size
      const stitchSizes = selectedStitches.map(s => s.stitchSize);
      const uniqueSizes = [...new Set(stitchSizes)];
      if (uniqueSizes.length === 1 && uniqueSizes[0]) {
        setStitchSize(uniqueSizes[0]);
      }
      
      // Update repeat pattern if all selected stitches have the same repeat setting
      const repeatSettings = selectedStitches.map(s => s.repeat !== false);
      const uniqueRepeats = [...new Set(repeatSettings)];
      if (uniqueRepeats.length === 1) {
        setRepeatPattern(uniqueRepeats[0]);
      }
      
      // Update color if all selected stitches have the same color
      const colors = selectedStitches.map(s => stitchColors.get(s.id) || s.color || defaultStitchColor);
      const uniqueColors = [...new Set(colors)];
      if (uniqueColors.length === 1 && uniqueColors[0]) {
        setSelectedStitchColor(uniqueColors[0]);
      }
    }
    // When nothing selected, preserve the current selectedStitchColor for drawing
    // Don't reset it to defaultStitchColor to maintain user's color choice
  }, [selectedStitchIds, currentPattern.stitches, stitchColors, defaultStitchColor]);

  // Auto-save to local storage whenever pattern, colors, or settings change
  // This triggers when: stitches added/removed/modified, colors changed, or UI settings changed
  useEffect(() => {
    saveCurrentPattern(currentPattern, stitchColors, {
      patternTiles,
      defaultStitchColor,
      backgroundColor,
      selectedStitchColor,
      stitchSize,
      repeatPattern,
      showGrid,
    });
  }, [
    currentPattern,
    stitchColors,
    patternTiles,
    defaultStitchColor,
    backgroundColor,
    selectedStitchColor,
    stitchSize,
    repeatPattern,
    showGrid,
  ]);

  const canvasSize = useMemo(() => {
    const tileSize = Math.max(1, currentPattern.tileSize ?? 1);
    const gridSize = currentPattern.gridSize ?? CELL_SIZE;
    return patternTiles * tileSize * gridSize;
  }, [patternTiles, currentPattern.tileSize, currentPattern.gridSize]);

  const patternInfo = useMemo(() => {
    const tileSize = Math.max(1, currentPattern.tileSize ?? 1);
    return `${patternTiles}×${patternTiles} pattern tiles (${tileSize}×${tileSize} grid each)`;
  }, [patternTiles, currentPattern.tileSize]);

  const handleModeChange = useCallback((mode) => {
    setDrawingState({ mode, firstPoint: null });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = currentPattern.stitches.map((stitch) => stitch.id);
    setSelectedStitchIds(new Set(allIds));
  }, [currentPattern.stitches]);

  const handleDeselectAll = useCallback(() => {
    setSelectedStitchIds(new Set());
  }, []);

  const handleAddStitch = useCallback(({ start, end, stitchSize, repeat }) => {
    const newId = `stitch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    
    // Determine default stitch size based on orientation if not provided
    let defaultSize = 'small';
    if (!stitchSize) {
      const gridDx = Math.abs(end.x - start.x);
      const gridDy = Math.abs(end.y - start.y);
      const isDiagonal = gridDx > 0 && gridDy > 0;
      defaultSize = isDiagonal ? 'small' : 'medium';
    }
    
    const newStitch = {
      id: newId,
      start,
      end,
      color: null,
      stitchSize: stitchSize || defaultSize,
      repeat: repeat !== undefined ? repeat : true,
    };
    setCurrentPattern((prev) => ({
      ...prev,
      stitches: [...prev.stitches, newStitch],
    }));
    
    // Apply the selected stitch color to the new stitch
    setStitchColors((prev) => {
      const next = new Map(prev);
      next.set(newId, selectedStitchColor);
      return next;
    });
    
    setSelectedStitchIds(new Set([newId]));
  }, [selectedStitchColor]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedStitchIds.size === 0) return;
    setCurrentPattern((prev) => ({
      ...prev,
      stitches: prev.stitches.filter((stitch) => !selectedStitchIds.has(stitch.id)),
    }));
    setStitchColors((prev) => {
      const next = new Map(prev);
      selectedStitchIds.forEach((id) => next.delete(id));
      return next;
    });
    setSelectedStitchIds(new Set());
    setDrawingState((prev) => ({ ...prev, firstPoint: null }));
  }, [selectedStitchIds]);

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
  }, [selectedStitchIds]);

  const handleChangeRepeatPattern = useCallback((newRepeat) => {
    if (selectedStitchIds.size > 0) {
      // Update selected stitches
      setCurrentPattern((prev) => ({
        ...prev,
        stitches: prev.stitches.map((stitch) =>
          selectedStitchIds.has(stitch.id)
            ? { ...stitch, repeat: newRepeat }
            : stitch
        ),
      }));
    } else {
      // Update default for draw tool
      setRepeatPattern(newRepeat);
    }
  }, [selectedStitchIds]);

  const handleNewPattern = useCallback(() => {
    const tileSize = currentPattern.tileSize || 10;
    const gridSize = currentPattern.gridSize || 20;
    const freshPattern = {
      id: `pattern-${Date.now()}`,
      name: 'Untitled Pattern',
      description: '',
      tileSize,
      gridSize,
      patternTiles,
      stitches: [],
    };
    setCurrentPattern(freshPattern);
    setSelectedStitchIds(new Set());
    setStitchColors(new Map());
    setDrawingState((prev) => ({ ...prev, firstPoint: null }));
  }, [currentPattern.tileSize, currentPattern.gridSize]);

  const handlePatternNameChange = useCallback((name) => {
    setCurrentPattern((prev) => ({ ...prev, name }));
  }, []);

  const handleTileSizeChange = useCallback((tileSize) => {
    setCurrentPattern((prev) => ({ ...prev, tileSize }));
  }, []);

  const handleGridSizeChange = useCallback((gridSize) => {
    setCurrentPattern((prev) => ({ ...prev, gridSize }));
  }, []);

  const handlePatternTilesChange = useCallback((tiles) => {
    setPatternTiles(tiles);
    setCurrentPattern((prev) => ({ ...prev, patternTiles: tiles }));
  }, []);

  const handleResetSettings = useCallback(() => {
    // Reset all settings to their default values
    setPatternTiles(DEFAULT_PATTERN_TILES);
    setDefaultStitchColor(DEFAULT_STITCH_COLOR);
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
    setSelectedStitchColor(DEFAULT_STITCH_COLOR);
    setStitchSize(DEFAULT_STITCH_SIZE);
    setRepeatPattern(DEFAULT_REPEAT_PATTERN);
    setShowGrid(DEFAULT_SHOW_GRID);
  }, []);

  const handleSelectPattern = useCallback((pattern) => {
    if (!pattern) return;
    const cloned = clonePattern(pattern);
    setCurrentPattern(cloned);
    setStitchColors(deriveColorMap(cloned));
    setSelectedStitchIds(new Set());
    setDrawingState((prev) => ({ ...prev, firstPoint: null }));
  }, []);

  const handleSavePattern = useCallback(() => {
    const result = saveToPatternLibrary(currentPattern, stitchColors);
    if (result.success) {
      // Reload saved patterns to include the newly saved one
      const userPatterns = loadSavedPatterns();
      const builtInPatterns = patternsData.map(clonePattern);
      setSavedPatterns([...builtInPatterns, ...userPatterns]);
      
      // Update current pattern ID if it was a new pattern
      if (result.pattern.id !== currentPattern.id) {
        setCurrentPattern(result.pattern);
      }
      
      alert(`Pattern "${result.pattern.name}" saved successfully!`);
    } else {
      alert(`Failed to save pattern: ${result.error}`);
    }
  }, [currentPattern, stitchColors]);

  const handleDeletePattern = useCallback((patternId) => {
    if (confirm('Are you sure you want to delete this pattern?')) {
      deletePattern(patternId);
      
      // Reload saved patterns
      const userPatterns = loadSavedPatterns();
      const builtInPatterns = patternsData.map(clonePattern);
      setSavedPatterns([...builtInPatterns, ...userPatterns]);
      
      // If the deleted pattern was currently loaded, switch to blank
      if (currentPattern.id === patternId) {
        handleNewPattern();
      }
    }
  }, [currentPattern.id, handleNewPattern]);

  const handleColorChange = useCallback((color) => {
    if (!color) return;
    
    // Update the selected stitch color state (used for drawing new stitches)
    setSelectedStitchColor(color);
    
    // Auto-apply the color to selected stitches
    if (selectedStitchIds.size > 0) {
      setStitchColors((prev) => {
        const next = new Map(prev);
        selectedStitchIds.forEach((id) => next.set(id, color));
        return next;
      });
    }
    // When no selection, just updating selectedStitchColor is enough
    // This will be used for the next drawn stitch
  }, [selectedStitchIds]);

  const handleClearColors = useCallback(() => {
    setStitchColors(new Map());
  }, []);

  const handleExportPattern = useCallback(() => {
    const exportPattern = {
      ...currentPattern,
      stitches: currentPattern.stitches.map((stitch) => ({
        ...stitch,
        color: stitchColors.get(stitch.id) ?? stitch.color ?? null,
      })),
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
  }, [currentPattern, stitchColors]);

  const handleImportPattern = useCallback((file) => {
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
      } catch (error) {
        console.error('Failed to import pattern:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleExportImage = useCallback(() => {
    const dataUrl = canvasRef.current?.exportAsImage?.();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    const slug = (currentPattern.name || 'pattern').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `${slug || 'pattern'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentPattern.name]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedStitchIds.size > 0) {
        event.preventDefault();
        handleDeleteSelected();
      }
      if (event.key === 'Escape') {
        setDrawingState((prev) => ({ ...prev, firstPoint: null }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected, selectedStitchIds.size]);

  return (
    <SidebarProvider className="flex h-screen overflow-hidden">
      {/* Left Sidebar */}
      <AppSidebar
        sidebarTab={sidebarTab}
        onSidebarTabChange={setSidebarTab}
        patternTiles={patternTiles}
        onPatternTilesChange={handlePatternTilesChange}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={setBackgroundColor}
        defaultStitchColor={defaultStitchColor}
        onDefaultStitchColorChange={setDefaultStitchColor}
        patternName={currentPattern.name}
        onPatternNameChange={handlePatternNameChange}
        tileSize={currentPattern.tileSize || 10}
        onTileSizeChange={handleTileSizeChange}
        gridSize={currentPattern.gridSize || CELL_SIZE}
        onGridSizeChange={handleGridSizeChange}
                canvasInfo={`${patternTiles}×${patternTiles} tiles · Grid size ${currentPattern.gridSize || CELL_SIZE}px (5mm)`}
        onNewPattern={handleNewPattern}
        onSavePattern={handleSavePattern}
        onResetSettings={handleResetSettings}
        onExportPattern={handleExportPattern}
        onImportPattern={handleImportPattern}
        onExportImage={handleExportImage}
        savedPatterns={savedPatterns}
        activePatternId={currentPattern.id}
        onSelectPattern={(pattern) => {
          handleSelectPattern(pattern);
        }}
        onDeletePattern={handleDeletePattern}
      />

      {/* Main Content Area */}
      <main className="flex h-screen flex-1 flex-col overflow-hidden bg-background text-foreground">
        <header className="flex-none border-b border-border bg-sidebar px-6 py-4 ">
          <div className="flex items-center gap-4">
            <Toolbar
              drawingMode={drawingState.mode}
              onModeChange={handleModeChange}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              repeatPattern={repeatPattern}
              onRepeatPatternChange={handleChangeRepeatPattern}
              selectedStitchColor={selectedStitchColor}
              onSelectedStitchColorChange={handleColorChange}
              onClearColors={handleClearColors}
              colorPresets={COLOR_PRESETS}
              stitchSize={stitchSize}
              onStitchSizeChange={handleChangeSelectedStitchSize}
              showGrid={showGrid}
              onShowGridChange={setShowGrid}
            />
          </div>
        </header>

        <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        

          <CanvasViewport
            ref={canvasRef}
            patternTiles={patternTiles}
            pattern={currentPattern}
            stitchColors={stitchColors}
            selectedStitchIds={selectedStitchIds}
            onSelectStitchIds={setSelectedStitchIds}
            onAddStitch={handleAddStitch}
            drawingState={drawingState}
            onDrawingStateChange={setDrawingState}
            defaultStitchColor={defaultStitchColor}
            backgroundColor={backgroundColor}
            stitchSize={stitchSize}
            repeatPattern={repeatPattern}
            showGrid={showGrid}
          />
        </div>
      </main>
    </SidebarProvider>
  );
}
