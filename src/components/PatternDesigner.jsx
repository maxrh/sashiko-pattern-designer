import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import patternsData from '../data/patterns.json';
import { PatternCanvas } from './PatternCanvas.jsx';
import { CanvasSettings } from './CanvasSettings.jsx';
import { Toolbar } from './Toolbar.jsx';
import { ExportPanel } from './ExportPanel.jsx';
import { PatternSelector } from './PatternSelector.jsx';
import { ContextualSidebar } from './ContextualSidebar.jsx';
import { Badge } from './ui/badge.jsx';
import { Separator } from './ui/separator.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx';

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
  const [savedPatterns] = useState(() => patternsData.map(clonePattern));
  const [currentPattern, setCurrentPattern] = useState(() => {
    const fallback = savedPatterns.find((pattern) => pattern.id === 'blank') ?? savedPatterns[0];
    return clonePattern(fallback);
  });
  const [stitchColors, setStitchColors] = useState(() => deriveColorMap(currentPattern));
  const [selectedStitchIds, setSelectedStitchIds] = useState(() => new Set());
  const [drawingState, setDrawingState] = useState({ mode: 'select', firstPoint: null });
  const [patternTiles, setPatternTiles] = useState(4);
  const [defaultThreadColor, setDefaultThreadColor] = useState('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState('#0f172a');
  const [selectedStitchColor, setSelectedStitchColor] = useState('#fb7185');
  const [sidebarTab, setSidebarTab] = useState('controls');
  const [stitchSize, setStitchSize] = useState('large');

  const canvasRef = useRef(null);

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

  const handleAddStitch = useCallback(({ start, end, stitchSize }) => {
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
    };
    setCurrentPattern((prev) => ({
      ...prev,
      stitches: [...prev.stitches, newStitch],
    }));
    setSelectedStitchIds(new Set([newId]));
  }, []);

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
    if (selectedStitchIds.size === 0) return;
    setCurrentPattern((prev) => ({
      ...prev,
      stitches: prev.stitches.map((stitch) =>
        selectedStitchIds.has(stitch.id)
          ? { ...stitch, stitchSize: newSize }
          : stitch
      ),
    }));
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

  const handleApplySelectedColor = useCallback((color) => {
    if (!color || selectedStitchIds.size === 0) return;
    setStitchColors((prev) => {
      const next = new Map(prev);
      selectedStitchIds.forEach((id) => next.set(id, color));
      return next;
    });
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
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Interactive Sashiko Pattern Designer</h1>
            <p className="text-sm text-slate-400">Connect stitches on the grid, tile patterns, and craft your own sashiko designs.</p>
          </div>
          <Badge variant="outline" className="self-start">
            {drawingState.mode === 'draw' ? 'Draw Mode ✏️' : 'Select Mode'}
          </Badge>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-6 py-6 lg:flex-row">
        {/* Left Sidebar */}
        <aside className="flex w-full flex-col lg:w-80 xl:w-96">
          <Tabs
            value={sidebarTab}
            onValueChange={setSidebarTab}
            defaultValue="controls"
            className="flex-1"
          >
            <TabsList className="w-full justify-between">
              <TabsTrigger value="controls" className="flex-1 text-center">
                Controls
              </TabsTrigger>
              <TabsTrigger value="patterns" className="flex-1 text-center">
                Saved Patterns
              </TabsTrigger>
            </TabsList>

            <TabsContent value="controls" className="space-y-6">
              <CanvasSettings
                patternTiles={patternTiles}
                onPatternTilesChange={setPatternTiles}
                backgroundColor={backgroundColor}
                onBackgroundColorChange={setBackgroundColor}
                defaultThreadColor={defaultThreadColor}
                onDefaultThreadColorChange={setDefaultThreadColor}
                patternName={currentPattern.name}
                onPatternNameChange={handlePatternNameChange}
                canvasInfo={`${canvasSize}px · ${CELL_SIZE}px cells · ${currentPattern.stitches.length} stitches`}
              />
              <ExportPanel
                onNewPattern={handleNewPattern}
                onExportPattern={handleExportPattern}
                onImportPattern={handleImportPattern}
                onExportImage={handleExportImage}
              />
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              <PatternSelector
                patterns={savedPatterns}
                activePatternId={currentPattern.id}
                onSelectPattern={(pattern) => {
                  handleSelectPattern(pattern);
                  setSidebarTab('controls');
                }}
              />
            </TabsContent>
          </Tabs>
        </aside>

        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Main Canvas Area */}
        <main className="flex flex-1 flex-col gap-4">
          <Toolbar
            drawingMode={drawingState.mode}
            onModeChange={handleModeChange}
            stitchSize={stitchSize}
            onStitchSizeChange={setStitchSize}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />

          <div className="overflow-auto">
            <PatternCanvas
              ref={canvasRef}
              canvasSize={canvasSize}
              cellSize={CELL_SIZE}
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
            />
          </div>
        </main>

        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Right Sidebar - Contextual Settings */}
        <aside className="flex w-full flex-col lg:w-80">
          <ContextualSidebar
            selectedCount={selectedStitchIds.size}
            selectedStitchColor={selectedStitchColor}
            onSelectedStitchColorChange={setSelectedStitchColor}
            onApplySelectedColor={handleApplySelectedColor}
            onClearColors={handleClearColors}
            onChangeSelectedStitchSize={handleChangeSelectedStitchSize}
            onDeleteSelected={handleDeleteSelected}
            colorPresets={COLOR_PRESETS}
          />
        </aside>
      </div>
    </div>
  );
}
