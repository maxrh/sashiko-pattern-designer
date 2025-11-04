import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import patternsData from '../data/patterns.json';
import { CanvasViewport } from './CanvasViewport.jsx';
import { Toolbar } from './Toolbar.jsx';
import { ContextualSidebar } from './ContextualSidebar.jsx';
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
  { label: 'White', value: '#ffffff' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Coral', value: '#fb7185' },
  { label: 'Black', value: '#0b1120' },
];

function clonePattern(pattern) {
  if (!pattern) {
    return {
      id: 'pattern-blank',
      name: 'Untitled Pattern',
      description: '',
      gridSize: 10,
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
    typeof data.gridSize === 'number' &&
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
      return saved.pattern;
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

  // Load UI state from local storage
  const [patternTiles, setPatternTiles] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.patternTiles ?? 4;
  });
  const [defaultThreadColor, setDefaultThreadColor] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.defaultThreadColor ?? '#ffffff';
  });
  const [backgroundColor, setBackgroundColor] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.backgroundColor ?? '#0f172a';
  });
  const [selectedStitchColor, setSelectedStitchColor] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.selectedStitchColor ?? '#fb7185';
  });
  const [stitchSize, setStitchSize] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.stitchSize ?? 'large';
  });
  const [repeatPattern, setRepeatPattern] = useState(() => {
    const saved = loadCurrentPattern();
    return saved?.uiState?.repeatPattern ?? true;
  });

  const [sidebarTab, setSidebarTab] = useState('controls');
  const [isHydrated, setIsHydrated] = useState(false);
  const canvasRef = useRef(null);

  // Mark as hydrated after initial render to prevent SSR mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
      const colors = selectedStitches.map(s => stitchColors.get(s.id) || s.color || defaultThreadColor);
      const uniqueColors = [...new Set(colors)];
      if (uniqueColors.length === 1 && uniqueColors[0]) {
        setSelectedStitchColor(uniqueColors[0]);
      }
    } else {
      // When nothing selected, show the default draw tool settings
      setSelectedStitchColor(defaultThreadColor);
    }
  }, [selectedStitchIds, currentPattern.stitches, stitchColors, defaultThreadColor]);

  // Auto-save to local storage whenever pattern, colors, or settings change
  // This triggers when: stitches added/removed/modified, colors changed, or UI settings changed
  useEffect(() => {
    saveCurrentPattern(currentPattern, stitchColors, {
      patternTiles,
      defaultThreadColor,
      backgroundColor,
      selectedStitchColor,
      stitchSize,
      repeatPattern,
    });
  }, [
    currentPattern,
    stitchColors,
    patternTiles,
    defaultThreadColor,
    backgroundColor,
    selectedStitchColor,
    stitchSize,
    repeatPattern,
  ]);

  const canvasSize = useMemo(() => {
    const gridSize = Math.max(1, currentPattern.gridSize ?? 1);
    return patternTiles * gridSize * CELL_SIZE;
  }, [patternTiles, currentPattern.gridSize]);

  const patternInfo = useMemo(() => {
    const gridSize = Math.max(1, currentPattern.gridSize ?? 1);
    return `${patternTiles}×${patternTiles} pattern tiles (${gridSize}×${gridSize} grid each)`;
  }, [patternTiles, currentPattern.gridSize]);

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
    let defaultSize = 'medium';
    if (!stitchSize) {
      const gridDx = Math.abs(end.x - start.x);
      const gridDy = Math.abs(end.y - start.y);
      const isDiagonal = gridDx > 0 && gridDy > 0;
      defaultSize = isDiagonal ? 'medium' : 'large';
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
    const gridSize = currentPattern.gridSize || 10;
    const freshPattern = {
      id: `pattern-${Date.now()}`,
      name: 'Untitled Pattern',
      description: '',
      gridSize,
      stitches: [],
    };
    setCurrentPattern(freshPattern);
    setSelectedStitchIds(new Set());
    setStitchColors(new Map());
    setDrawingState((prev) => ({ ...prev, firstPoint: null }));
  }, [currentPattern.gridSize]);

  const handlePatternNameChange = useCallback((name) => {
    setCurrentPattern((prev) => ({ ...prev, name }));
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
        const normalized = clonePattern({
          ...parsed,
          id: parsed.id ?? `pattern-${Date.now()}`,
          name: parsed.name ?? 'Imported Pattern',
          description: parsed.description ?? '',
          gridSize: parsed.gridSize ?? 10,
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
        onPatternTilesChange={setPatternTiles}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={setBackgroundColor}
        defaultThreadColor={defaultThreadColor}
        onDefaultThreadColorChange={setDefaultThreadColor}
        patternName={currentPattern.name}
        onPatternNameChange={handlePatternNameChange}
        canvasInfo={isHydrated ? `2200px · ${CELL_SIZE}px cells · ${currentPattern.stitches.length} stitches` : `2200px · ${CELL_SIZE}px cells`}
        onNewPattern={handleNewPattern}
        onSavePattern={handleSavePattern}
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
        <header className="flex-none border-b border-border bg-background/80 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Sashiko Pattern Designer</h1>
                <p className="text-sm text-muted-foreground">Connect stitches on the grid, tile patterns, and craft your own sashiko designs.</p>
              </div>
            </div>
            <Badge variant="outline" className="self-start">
              {drawingState.mode === 'draw' ? 'Draw Mode ✏️' : drawingState.mode === 'pan' ? 'Pan Mode ✋' : 'Select Mode'}
            </Badge>
          </div>
        </header>

        <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
          {/* Toolbar - Centered at top */}
          <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2">
            <Toolbar
              drawingMode={drawingState.mode}
              onModeChange={handleModeChange}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />
          </div>

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
            defaultThreadColor={defaultThreadColor}
            backgroundColor={backgroundColor}
            stitchSize={stitchSize}
            repeatPattern={repeatPattern}
          />

            {/* Right Sidebar - Floating */}
            <aside className="absolute right-6 top-6 z-10 flex w-80 flex-col">
              <ContextualSidebar
                selectedCount={selectedStitchIds.size}
                stitchSize={stitchSize}
                onStitchSizeChange={handleChangeSelectedStitchSize}
                repeatPattern={repeatPattern}
                onRepeatPatternChange={handleChangeRepeatPattern}
                selectedStitchColor={selectedStitchColor}
                onSelectedStitchColorChange={handleColorChange}
                onClearColors={handleClearColors}
                onDeleteSelected={handleDeleteSelected}
                colorPresets={COLOR_PRESETS}
                isHydrated={isHydrated}
              />
            </aside>
        </div>
      </main>
    </SidebarProvider>
  );
}
