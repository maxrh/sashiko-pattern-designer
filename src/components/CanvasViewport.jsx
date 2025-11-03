import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { PatternCanvas } from './PatternCanvas.jsx';

const CANVAS_SIZE = 2200; // Fixed large canvas size
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
  defaultThreadColor,
  backgroundColor,
  stitchSize,
  repeatPattern,
}, ref) {
  const containerRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const patternGridSize = Math.max(1, pattern?.gridSize ?? 1);
  const artboardSize = patternTiles * patternGridSize * CELL_SIZE;
  const artboardOffset = (CANVAS_SIZE - artboardSize) / 2;

  useImperativeHandle(ref, () => ({
    exportAsImage: () => canvasRef.current?.exportAsImage(),
    getCanvasElement: () => canvasRef.current?.getCanvasElement(),
  }));

  // Center viewport on artboard on mount and when artboard size changes
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      
      // Calculate scroll position to center the artboard
      const scrollX = artboardOffset - (containerRef.current.clientWidth - artboardSize) / 2;
      const scrollY = artboardOffset - (containerRef.current.clientHeight - artboardSize) / 2;
      
      containerRef.current.scrollLeft = scrollX;
      containerRef.current.scrollTop = scrollY;
    });
  }, [artboardSize, artboardOffset]);

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
      document.body.style.cursor = 'grabbing';
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
        document.body.style.cursor = 'grab';
      } else {
        document.body.style.cursor = '';
      }
    }
  };

  // Handle spacebar hotkey for pan mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        // Toggle to pan mode when spacebar is pressed
        if (drawingState.mode !== 'pan') {
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

    const handleScroll = (e) => {
      // Prevent any scroll triggered by spacebar
      if (drawingState.mode === 'pan') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Use capture phase to catch events before they trigger default scroll
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    document.addEventListener('scroll', handleScroll, { passive: false, capture: true });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [drawingState, onDrawingStateChange]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-auto bg-slate-950"
      style={{ 
        cursor: isPanning ? 'grabbing' : (drawingState.mode === 'pan' ? 'grab' : 'default'),
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        outline: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={(e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onKeyUp={(e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      tabIndex={-1}
    >
      <div
        ref={canvasWrapperRef}
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          position: 'relative',
        }}
      >
        <PatternCanvas
          ref={canvasRef}
          canvasSize={CANVAS_SIZE}
          cellSize={CELL_SIZE}
          artboardOffset={artboardOffset}
          artboardSize={artboardSize}
          pattern={pattern}
          stitchColors={stitchColors}
          selectedStitchIds={selectedStitchIds}
          onSelectStitchIds={onSelectStitchIds}
          onAddStitch={onAddStitch}
          drawingState={drawingState}
          onDrawingStateChange={onDrawingStateChange}
          defaultThreadColor={defaultThreadColor}
          backgroundColor={backgroundColor}
          stitchSize={stitchSize}
          repeatPattern={repeatPattern}
        />
      </div>
    </div>
  );
});
