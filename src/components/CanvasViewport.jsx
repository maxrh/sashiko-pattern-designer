import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { PatternCanvas } from './PatternCanvas.jsx';

// Canvas terminology:
// - "canvas" = the entire grid area where drawing happens (with margin around artboard)
// - "artboard" = the total area of pattern tiles we draw inside
const CANVAS_MARGIN_CELLS = 40; // 40 grid cells of margin around artboard
const CELL_SIZE = 20;

export const CanvasViewport = forwardRef(function CanvasViewport({
  patternTiles,
  pattern,
  stitchColors,
  selectedStitchIds,
  onSelectStitchIds,
  onAddStitch,
  drawingState,
  onDrawingStateChange,
  defaultStitchColor,
  backgroundColor,
  stitchSize,
  repeatPattern,
  showGrid,
  gridColor,
  gridOpacity,
  tileOutlineColor,
  tileOutlineOpacity,
  artboardOutlineColor,
  artboardOutlineOpacity,
}, ref) {
  const containerRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Normalize tileSize to {x, y} format (supports legacy number format)
  const normalizeTileSize = (tileSize) => {
    if (typeof tileSize === 'number') return { x: tileSize, y: tileSize };
    if (tileSize && typeof tileSize === 'object') return { x: tileSize.x || 10, y: tileSize.y || 10 };
    return { x: 10, y: 10 };
  };
  
  const patternTileSize = normalizeTileSize(pattern?.tileSize);
  const patternGridSize = pattern?.gridSize ?? CELL_SIZE;
  // Artboard = the total area containing all pattern tiles (separate width and height for non-square tiles)
  const artboardWidth = patternTiles.x * patternTileSize.x * patternGridSize;
  const artboardHeight = patternTiles.y * patternTileSize.y * patternGridSize;
  // Canvas = artboard + 40 grid cells margin on all sides
  const canvasMarginPixels = CANVAS_MARGIN_CELLS * patternGridSize;
  const canvasWidth = artboardWidth + (2 * canvasMarginPixels);
  const canvasHeight = artboardHeight + (2 * canvasMarginPixels);
  // Artboard is centered in canvas (offset by margin)
  const artboardOffset = canvasMarginPixels;

  useImperativeHandle(ref, () => ({
    exportAsImage: (resolutionMultiplier) => canvasRef.current?.exportAsImage(resolutionMultiplier),
    getCanvasElement: () => canvasRef.current?.getCanvasElement(),
  }));

  // Center viewport on canvas (which contains artboard with padding) on mount and when size changes
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      
      // Calculate scroll position to center the canvas in viewport
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      const scrollX = Math.max(0, (canvasWidth - containerWidth) / 2);
      const scrollY = Math.max(0, (canvasHeight - containerHeight) / 2);
      
      containerRef.current.scrollLeft = scrollX;
      containerRef.current.scrollTop = scrollY;
    });
  }, [canvasWidth, canvasHeight]);

  const handleMouseDown = (e) => {
    // Don't interfere with canvas interactions in select or draw mode
    if (drawingState.mode === 'select' || drawingState.mode === 'draw') {
      return;
    }
    
    // Enable panning with middle mouse button OR left click in pan mode
    const shouldPan = e.button === 1 || (e.button === 0 && drawingState.mode === 'pan');
    
    if (shouldPan) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ 
        x: e.clientX + containerRef.current.scrollLeft, 
        y: e.clientY + containerRef.current.scrollTop 
      });
      containerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && containerRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const newScrollLeft = panStart.x - e.clientX;
      const newScrollTop = panStart.y - e.clientY;
      containerRef.current.scrollLeft = newScrollLeft;
      containerRef.current.scrollTop = newScrollTop;
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      // Reset cursor based on mode
      if (drawingState.mode === 'pan') {
        containerRef.current.style.cursor = 'grab';
      } else {
        containerRef.current.style.cursor = '';
      }
    }
  };

  // Handle spacebar hotkey for pan mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        // Always prevent default scroll behavior for spacebar
        e.preventDefault();
        e.stopPropagation();
        
        // Only change mode on first press (not on repeat)
        if (!e.repeat && drawingState.mode !== 'pan') {
          onDrawingStateChange({ ...drawingState, mode: 'pan', previousMode: drawingState.mode });
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        // Return to previous mode when spacebar is released
        if (drawingState.mode === 'pan' && drawingState.previousMode) {
          const prevMode = drawingState.previousMode;
          const newState = { ...drawingState, mode: prevMode };
          delete newState.previousMode;
          onDrawingStateChange(newState);
        }
      }
    };

    // Use capture phase to catch events before they trigger default scroll
    // This ensures we catch the spacebar before browser scroll
    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    window.addEventListener('keyup', handleKeyUp, { capture: true, passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [drawingState, onDrawingStateChange]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-auto bg-background"
      style={{ 
        cursor: isPanning ? 'grabbing' : (drawingState.mode === 'pan' ? 'grab' : 'default'),
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        outline: 'none',
        // Prevent spacebar from scrolling when in pan mode
        overflowAnchor: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={(e) => {
        // Prevent spacebar scroll at the container level
        if (e.code === 'Space' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }}
      onKeyUp={(e) => {
        // Prevent spacebar scroll at the container level
        if (e.code === 'Space' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }}
      tabIndex={-1}
    >
      <div
        ref={canvasWrapperRef}
        style={{
          width: canvasWidth,
          height: canvasHeight,
          position: 'relative',
        }}
      >
        <PatternCanvas
          ref={canvasRef}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          cellSize={patternGridSize}
          artboardOffset={artboardOffset}
          artboardWidth={artboardWidth}
          artboardHeight={artboardHeight}
          pattern={pattern}
          stitchColors={stitchColors}
          selectedStitchIds={selectedStitchIds}
          onSelectStitchIds={onSelectStitchIds}
          onAddStitch={onAddStitch}
          drawingState={drawingState}
          onDrawingStateChange={onDrawingStateChange}
          defaultStitchColor={defaultStitchColor}
          backgroundColor={backgroundColor}
          stitchSize={stitchSize}
          repeatPattern={repeatPattern}
          showGrid={showGrid}
          gridColor={gridColor}
          gridOpacity={gridOpacity}
          tileOutlineColor={tileOutlineColor}
          tileOutlineOpacity={tileOutlineOpacity}
          artboardOutlineColor={artboardOutlineColor}
          artboardOutlineOpacity={artboardOutlineOpacity}
        />
      </div>
    </div>
  );
});
