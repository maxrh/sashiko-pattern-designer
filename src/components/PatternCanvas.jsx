import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

const SNAP_THRESHOLD = 15;
const SELECT_THRESHOLD = 10;
const DOT_RADIUS = 2.5;

function wrapCoordinate(value, gridSize) {
  if (!gridSize) return value;
  if (value === 0) return 0;
  const remainder = value % gridSize;
  return remainder === 0 ? gridSize : remainder;
}

function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));
  const projX = x1 + clampedT * dx;
  const projY = y1 + clampedT * dy;
  return Math.hypot(px - projX, py - projY);
}

function getNearestGridPoint(clickX, clickY, cellSize) {
  const gridX = Math.round(clickX / cellSize);
  const gridY = Math.round(clickY / cellSize);
  const pixelX = gridX * cellSize;
  const pixelY = gridY * cellSize;
  const distance = Math.hypot(clickX - pixelX, clickY - pixelY);
  return distance < SNAP_THRESHOLD ? { gridX, gridY } : null;
}

// Check if a line intersects with a rectangle
function lineIntersectsRect(x1, y1, x2, y2, rectMinX, rectMinY, rectMaxX, rectMaxY) {
  // Check if either endpoint is inside the rectangle
  const startInside = x1 >= rectMinX && x1 <= rectMaxX && y1 >= rectMinY && y1 <= rectMaxY;
  const endInside = x2 >= rectMinX && x2 <= rectMaxX && y2 >= rectMinY && y2 <= rectMaxY;
  
  if (startInside || endInside) return true;
  
  // Check if line bounding box overlaps with rectangle
  const lineMinX = Math.min(x1, x2);
  const lineMaxX = Math.max(x1, x2);
  const lineMinY = Math.min(y1, y2);
  const lineMaxY = Math.max(y1, y2);
  
  return !(lineMaxX < rectMinX || lineMinX > rectMaxX || lineMaxY < rectMinY || lineMinY > rectMaxY);
}

// Check if a line segment intersects or is contained within a rectangle
// Extended by extraMargin on all sides to allow drawing beyond artboard edges
function lineIntersectsArtboard(startX, startY, endX, endY, artboardX, artboardY, artboardSize, extraMargin = 0) {
  const minX = artboardX - extraMargin;
  const maxX = artboardX + artboardSize + extraMargin;
  const minY = artboardY - extraMargin;
  const maxY = artboardY + artboardSize + extraMargin;
  
  // Check if either endpoint is inside the artboard
  const startInside = startX >= minX && startX <= maxX && startY >= minY && startY <= maxY;
  const endInside = endX >= minX && endX <= maxX && endY >= minY && endY <= maxY;
  
  if (startInside || endInside) return true;
  
  // Check if line intersects any of the four edges of the artboard
  // This handles cases where line passes through artboard without endpoints inside
  const lineMinX = Math.min(startX, endX);
  const lineMaxX = Math.max(startX, endX);
  const lineMinY = Math.min(startY, endY);
  const lineMaxY = Math.max(startY, endY);
  
  // If line bounding box doesn't overlap artboard, no intersection
  if (lineMaxX < minX || lineMinX > maxX || lineMaxY < minY || lineMinY > maxY) {
    return false;
  }
  
  // At this point, bounding boxes overlap, so line likely intersects
  return true;
}

export const PatternCanvas = forwardRef(function PatternCanvas({
  canvasSize,
  cellSize,
  artboardOffset = 0,
  artboardSize,
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
  repeatPattern = true,
}, ref) {
  const canvasRef = useRef(null);
  const [dragSelectRect, setDragSelectRect] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const justFinishedDragRef = useRef(false);
  const patternGridSize = Math.max(1, pattern?.gridSize ?? 1);
  const canvasGridSize = useMemo(() => Math.round(canvasSize / cellSize), [canvasSize, cellSize]);
  const artboardGridSize = useMemo(() => Math.round(artboardSize / cellSize), [artboardSize, cellSize]);
  const tilesPerSide = useMemo(
    () => Math.ceil(artboardGridSize / patternGridSize),
    [artboardGridSize, patternGridSize]
  );

  useImperativeHandle(ref, () => ({
    exportAsImage: () => canvasRef.current?.toDataURL('image/png'),
    getCanvasElement: () => canvasRef.current,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    console.log('Canvas rendering with', selectedStitchIds.size, 'selected stitches:', Array.from(selectedStitchIds));
    const dpr = window.devicePixelRatio ?? 1;

    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw artboard boundary
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(artboardOffset, artboardOffset, artboardSize, artboardSize);

    // Draw pattern cell boundaries (only within artboard)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    const patternCellPixelSize = patternGridSize * cellSize;
    for (let row = 0; row <= tilesPerSide; row += 1) {
      for (let col = 0; col <= tilesPerSide; col += 1) {
        const x = artboardOffset + (col * patternCellPixelSize);
        const y = artboardOffset + (row * patternCellPixelSize);
        if (x <= artboardOffset + artboardSize && y <= artboardOffset + artboardSize) {
          ctx.strokeRect(x, y, Math.min(patternCellPixelSize, artboardSize - col * patternCellPixelSize), Math.min(patternCellPixelSize, artboardSize - row * patternCellPixelSize));
        }
      }
    }

    // Draw grid dots across entire canvas
    ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
    for (let x = 0; x <= canvasGridSize; x += 1) {
      for (let y = 0; y <= canvasGridSize; y += 1) {
        const centerX = x * cellSize;
        const centerY = y * cellSize;
        ctx.fillRect(centerX - 1.5, centerY - 1.5, 3, 3);
      }
    }

    const stitches = pattern?.stitches ?? [];

    const stitchOffset = 4; // Start stitches 4px from grid point
    const gapBetweenStitches = 8; // 8px gap between adjacent stitches

    ctx.lineCap = 'butt'; // Use butt to get precise pixel alignment
    stitches.forEach((stitch) => {
      const colorOverride = stitchColors.get(stitch.id) ?? stitch.color ?? defaultThreadColor;
      
      // Check if coordinates are absolute (new format) or wrapped (old format)
      // New format: coordinates can exceed patternGridSize
      // Old format: coordinates are 0 to patternGridSize-1
      const isAbsoluteCoords = stitch.start.x >= patternGridSize || stitch.start.y >= patternGridSize ||
                               stitch.end.x >= patternGridSize || stitch.end.y >= patternGridSize ||
                               stitch.start.x < 0 || stitch.start.y < 0 ||
                               stitch.end.x < 0 || stitch.end.y < 0;
      
      if (isAbsoluteCoords) {
        // New format: use absolute coordinates
        // If repeat is on, draw the line in each tile by offsetting by tile amounts
        const shouldRepeat = stitch.repeat !== false;

        if (shouldRepeat) {
          // Repeat the line across all tiles
          // We need to try all possible tile offsets to cover all visible tiles
          for (let tileRow = -1; tileRow <= tilesPerSide; tileRow++) {
            for (let tileCol = -1; tileCol <= tilesPerSide; tileCol++) {
              // Offset by tile amounts (including negative to cover tiles to the left/above)
              const tileOffsetX = tileCol * patternGridSize;
              const tileOffsetY = tileRow * patternGridSize;
              
              // Use absolute coordinates directly, just offset by tile position
              const startX = artboardOffset + ((stitch.start.x + tileOffsetX) * cellSize);
              const startY = artboardOffset + ((stitch.start.y + tileOffsetY) * cellSize);
              const endX = artboardOffset + ((stitch.end.x + tileOffsetX) * cellSize);
              const endY = artboardOffset + ((stitch.end.y + tileOffsetY) * cellSize);

            if (startX > canvasSize + cellSize || startY > canvasSize + cellSize) {
              continue;
            }

            const isSelected = selectedStitchIds.has(stitch.id);
            if (isSelected && tileRow === 0 && tileCol === 0) {
              console.log('Rendering selected stitch (absolute):', stitch.id, 'will be BLUE');
            }

            // Calculate the offset direction (unit vector from start to end)
            const dx = endX - startX;
            const dy = endY - startY;
            const length = Math.hypot(dx, dy);
            if (length === 0) continue;

            const unitX = dx / length;
            const unitY = dy / length;

            // Offset start and end by 4px along the line
            const offsetStartX = startX + unitX * stitchOffset;
            const offsetStartY = startY + unitY * stitchOffset;
            const offsetEndX = endX - unitX * stitchOffset;
            const offsetEndY = endY - unitY * stitchOffset;

            // Calculate the drawable length (after removing offsets)
            const drawableLength = length - (2 * stitchOffset);

            // Get stitch size info from stitch metadata (or use default 'medium')
            const stitchSizeForLine = stitch.stitchSize || 'medium';
            
            // Determine target dash count based on stitch size and actual line length
            // Use the ACTUAL line length (before offsets) to determine stitch count
            let targetDashCount;
            const actualCellsInLine = length / 20; // How many 20px cells in the actual line
            const cellsInLine = drawableLength / 20; // Drawable length for calculations
            
            // For xlarge, we use large calculation as base
            const isXLarge = stitchSizeForLine === 'xlarge';
            const sizeForCalc = isXLarge ? 'large' : stitchSizeForLine;
            
            switch (sizeForCalc) {
              case 'medium':
                // Medium: 2 dashes per 20px cell, scale to actual line length
                targetDashCount = Math.max(2, Math.round(actualCellsInLine * 2));
                break;
              case 'large':
              default:
                // Large: 1 dash per 20px cell
                // For exactly 1 cell (20px), we want 1 dash total (not 2)
                targetDashCount = Math.max(1, Math.round(actualCellsInLine * 1));
                break;
            }
            
            // Calculate dash and gap lengths based on drawable length
            let dashLength, gapLength;
            
            if (targetDashCount === 1) {
              // Single dash: use entire drawable length, no gaps
              dashLength = drawableLength;
              gapLength = 0;
            } else if (isXLarge) {
              // XLarge: ensure even count for pairing
              if (targetDashCount % 2 !== 0) {
                targetDashCount += 1;
              }
              // XLarge: merge pairs of dashes
              // Each "super dash" = 2 dashes + 1 gap between them
              const superDashCount = targetDashCount / 2;
              const gapCount = superDashCount - 1; // gaps between super dashes
              
              // Calculate space
              const totalGapSpace = gapCount * gapBetweenStitches;
              const totalDashSpace = drawableLength - totalGapSpace;
              
              // Each super dash gets equal space
              const superDashLength = totalDashSpace / superDashCount;
              
              // Set pattern: long dash, then gap
              dashLength = superDashLength;
              gapLength = gapBetweenStitches;
            } else {
              // Regular calculation (medium/large with multiple dashes)
              const gapCount = targetDashCount - 1;
              const totalGapSpace = gapCount * gapBetweenStitches;
              const totalDashSpace = drawableLength - totalGapSpace;
              
              dashLength = totalDashSpace / targetDashCount;
              gapLength = gapBetweenStitches;
            }
            
            // Only draw if dash length is positive (line is long enough)
            if (dashLength <= 0) continue;

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([dashLength, gapLength]);
            ctx.strokeStyle = isSelected ? '#0000FF' : (colorOverride ?? defaultThreadColor);
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(offsetStartX, offsetStartY);
            ctx.lineTo(offsetEndX, offsetEndY);
            ctx.stroke();
            ctx.restore();
            }
          }
        } else {
          // Don't repeat - just draw once at absolute position
          const startX = artboardOffset + (stitch.start.x * cellSize);
          const startY = artboardOffset + (stitch.start.y * cellSize);
          const endX = artboardOffset + (stitch.end.x * cellSize);
          const endY = artboardOffset + (stitch.end.y * cellSize);

          if (startX > canvasSize + cellSize || startY > canvasSize + cellSize) {
            return;
          }

          const isSelected = selectedStitchIds.has(stitch.id);

          // Calculate the offset direction (unit vector from start to end)
          const dx = endX - startX;
          const dy = endY - startY;
          const length = Math.hypot(dx, dy);
          if (length === 0) return;

          const unitX = dx / length;
          const unitY = dy / length;

          // Offset start and end by 4px along the line
          const offsetStartX = startX + unitX * stitchOffset;
          const offsetStartY = startY + unitY * stitchOffset;
          const offsetEndX = endX - unitX * stitchOffset;
          const offsetEndY = endY - unitY * stitchOffset;

          // Calculate the drawable length (after removing offsets)
          const drawableLength = length - (2 * stitchOffset);

          // Get stitch size info from stitch metadata (or use default 'medium')
          const stitchSizeForLine = stitch.stitchSize || 'medium';
          
          // Determine target dash count based on stitch size and actual line length
          let targetDashCount;
          const actualCellsInLine = length / 20;
          
          const isXLarge = stitchSizeForLine === 'xlarge';
          const sizeForCalc = isXLarge ? 'large' : stitchSizeForLine;
          
          switch (sizeForCalc) {
            case 'medium':
              targetDashCount = Math.max(2, Math.round(actualCellsInLine * 2));
              break;
            case 'large':
            default:
              targetDashCount = Math.max(1, Math.round(actualCellsInLine * 1));
              break;
          }
          
          // Calculate dash and gap lengths
          let dashLength, gapLength;
          
          if (targetDashCount === 1) {
            dashLength = drawableLength;
            gapLength = 0;
          } else if (isXLarge) {
            if (targetDashCount % 2 !== 0) {
              targetDashCount += 1;
            }
            const superDashCount = targetDashCount / 2;
            const gapCount = superDashCount - 1;
            const totalGapSpace = gapCount * gapBetweenStitches;
            const totalDashSpace = drawableLength - totalGapSpace;
            const superDashLength = totalDashSpace / superDashCount;
            dashLength = superDashLength;
            gapLength = gapBetweenStitches;
          } else {
            const gapCount = targetDashCount - 1;
            const totalGapSpace = gapCount * gapBetweenStitches;
            const totalDashSpace = drawableLength - totalGapSpace;
            dashLength = totalDashSpace / targetDashCount;
            gapLength = gapBetweenStitches;
          }
          
          if (dashLength <= 0) return;

          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([dashLength, gapLength]);
          ctx.strokeStyle = isSelected ? '#0000FF' : (colorOverride ?? defaultThreadColor);
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(offsetStartX, offsetStartY);
          ctx.lineTo(offsetEndX, offsetEndY);
          ctx.stroke();
          ctx.restore();
        }
      } else {
        // Old format: use wrapped coordinates with tiling
        const shouldRepeat = stitch.repeat !== false;
        const tilesToRender = shouldRepeat ? tilesPerSide : 1;

        for (let tileRow = 0; tileRow < tilesToRender; tileRow++) {
          for (let tileCol = 0; tileCol < tilesToRender; tileCol++) {
            const baseTileX = artboardOffset + (tileCol * patternGridSize * cellSize);
            const baseTileY = artboardOffset + (tileRow * patternGridSize * cellSize);

            const startX = baseTileX + (stitch.start.x * cellSize);
            const startY = baseTileY + (stitch.start.y * cellSize);
            const endX = baseTileX + (stitch.end.x * cellSize);
            const endY = baseTileY + (stitch.end.y * cellSize);

            if (startX > canvasSize + cellSize || startY > canvasSize + cellSize) {
              continue;
            }

            const isSelected = selectedStitchIds.has(stitch.id);

            // Calculate the offset direction (unit vector from start to end)
            const dx = endX - startX;
            const dy = endY - startY;
            const length = Math.hypot(dx, dy);
            if (length === 0) continue;

            const unitX = dx / length;
            const unitY = dy / length;

            // Offset start and end by 4px along the line
            const offsetStartX = startX + unitX * stitchOffset;
            const offsetStartY = startY + unitY * stitchOffset;
            const offsetEndX = endX - unitX * stitchOffset;
            const offsetEndY = endY - unitY * stitchOffset;

            // Calculate the drawable length (after removing offsets)
            const drawableLength = length - (2 * stitchOffset);

            // Get stitch size info from stitch metadata (or use default 'medium')
            const stitchSizeForLine = stitch.stitchSize || 'medium';
            
            // Determine target dash count based on stitch size and actual line length
            // Use the ACTUAL line length (before offsets) to determine stitch count
            let targetDashCount;
            const actualCellsInLine = length / 20; // How many 20px cells in the actual line
            const cellsInLine = drawableLength / 20; // Drawable length for calculations
            
            // For xlarge, we use large calculation as base
            const isXLarge = stitchSizeForLine === 'xlarge';
            const sizeForCalc = isXLarge ? 'large' : stitchSizeForLine;
            
            switch (sizeForCalc) {
              case 'medium':
                // Medium: 2 dashes per 20px cell, scale to actual line length
                targetDashCount = Math.max(2, Math.round(actualCellsInLine * 2));
                break;
              case 'large':
              default:
                // Large: 1 dash per 20px cell
                // For exactly 1 cell (20px), we want 1 dash total (not 2)
                targetDashCount = Math.max(1, Math.round(actualCellsInLine * 1));
                break;
            }
            
            // Calculate dash and gap lengths based on drawable length
            let dashLength, gapLength;
            
            if (targetDashCount === 1) {
              // Single dash: use entire drawable length, no gaps
              dashLength = drawableLength;
              gapLength = 0;
            } else if (isXLarge) {
              // XLarge: ensure even count for pairing
              if (targetDashCount % 2 !== 0) {
                targetDashCount += 1;
              }
              // XLarge: merge pairs of dashes
              // Each "super dash" = 2 dashes + 1 gap between them
              const superDashCount = targetDashCount / 2;
              const gapCount = superDashCount - 1; // gaps between super dashes
              
              // Calculate space
              const totalGapSpace = gapCount * gapBetweenStitches;
              const totalDashSpace = drawableLength - totalGapSpace;
              
              // Each super dash gets equal space
              const superDashLength = totalDashSpace / superDashCount;
              
              // Set pattern: long dash, then gap
              dashLength = superDashLength;
              gapLength = gapBetweenStitches;
            } else {
              // Regular calculation (medium/large with multiple dashes)
              const gapCount = targetDashCount - 1;
              const totalGapSpace = gapCount * gapBetweenStitches;
              const totalDashSpace = drawableLength - totalGapSpace;
              
              dashLength = totalDashSpace / targetDashCount;
              gapLength = gapBetweenStitches;
            }
            
            // Only draw if dash length is positive (line is long enough)
            if (dashLength <= 0) continue;

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([dashLength, gapLength]);
            ctx.strokeStyle = isSelected ? '#0000FF' : (colorOverride ?? defaultThreadColor);
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(offsetStartX, offsetStartY);
            ctx.lineTo(offsetEndX, offsetEndY);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    });

    if (drawingState.mode === 'draw' && drawingState.firstPoint) {
      ctx.save();
      ctx.fillStyle = '#0000FF';
      ctx.beginPath();
      const firstPointX = drawingState.firstPoint.x * cellSize;
      const firstPointY = drawingState.firstPoint.y * cellSize;
      ctx.arc(firstPointX, firstPointY, 2, 0, Math.PI * 2); // 2px radius = 4px diameter
      ctx.fill();
      ctx.restore();
    }

    // Draw drag selection rectangle
    if (dragSelectRect) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const x = Math.min(dragSelectRect.startX, dragSelectRect.endX);
      const y = Math.min(dragSelectRect.startY, dragSelectRect.endY);
      const width = Math.abs(dragSelectRect.endX - dragSelectRect.startX);
      const height = Math.abs(dragSelectRect.endY - dragSelectRect.startY);
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.restore();
    }
  }, [
    artboardOffset,
    artboardSize,
    backgroundColor,
    canvasGridSize,
    canvasSize,
    cellSize,
    defaultThreadColor,
    dragSelectRect,
    drawingState.firstPoint,
    drawingState.mode,
    pattern,
    patternGridSize,
    selectedStitchIds,
    stitchColors,
    tilesPerSide,
  ]);

  const handleMouseDown = (event) => {
    if (drawingState.mode !== 'select') return;
    
    // Prevent default to avoid any text selection or other browser behaviors
    event.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log('Drag select started:', { x, y, mode: drawingState.mode });
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragSelectRect({ startX: x, startY: y, endX: x, endY: y });
  };

  const handleMouseMove = (event) => {
    if (!isDraggingRef.current || drawingState.mode !== 'select') {
      if (isDraggingRef.current) {
        console.log('Mouse move blocked:', { isDragging: isDraggingRef.current, mode: drawingState.mode });
      }
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log('Drag moving:', { x, y });
    setDragSelectRect((prev) => prev ? { ...prev, endX: x, endY: y } : null);
  };

  const handleMouseUp = (event) => {
    console.log('Mouse up:', { isDragging: isDraggingRef.current, mode: drawingState.mode, hasDragRect: !!dragSelectRect });
    
    // If we're not dragging, just clear the rect state and return without touching selection
    if (!isDraggingRef.current) {
      setDragSelectRect(null);
      return;
    }
    
    // If we were dragging but not in select mode or no rect, clean up and return
    if (drawingState.mode !== 'select' || !dragSelectRect) {
      isDraggingRef.current = false;
      setIsDragging(false);
      setDragSelectRect(null);
      return;
    }
    
    isDraggingRef.current = false;
    setIsDragging(false);
    
    // Calculate selection rectangle bounds
    const minX = Math.min(dragSelectRect.startX, dragSelectRect.endX);
    const maxX = Math.max(dragSelectRect.startX, dragSelectRect.endX);
    const minY = Math.min(dragSelectRect.startY, dragSelectRect.endY);
    const maxY = Math.max(dragSelectRect.startY, dragSelectRect.endY);
    
    console.log('Drag selection bounds:', { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY });
    
    // Check if it was just a tiny drag (essentially a click)
    const width = maxX - minX;
    const height = maxY - minY;
    if (width < 5 && height < 5) {
      console.log('Drag too small, treating as click');
      setDragSelectRect(null);
      return; // Let handleCanvasClick handle it
    }
    
    // Find all stitches that intersect with the selection rectangle
    const stitches = pattern?.stitches ?? [];
    const selectedIds = new Set();
    
    console.log('Checking', stitches.length, 'stitches for intersection');
    
    stitches.forEach((stitch) => {
      const isAbsoluteCoords = stitch.start.x >= patternGridSize || stitch.start.y >= patternGridSize ||
                               stitch.end.x >= patternGridSize || stitch.end.y >= patternGridSize ||
                               stitch.start.x < 0 || stitch.start.y < 0 ||
                               stitch.end.x < 0 || stitch.end.y < 0;

      if (isAbsoluteCoords) {
        const shouldRepeat = stitch.repeat !== false;

        if (shouldRepeat) {
          // Check all possible tile offsets (including negative)
          for (let tileRow = -1; tileRow <= tilesPerSide; tileRow += 1) {
            for (let tileCol = -1; tileCol <= tilesPerSide; tileCol += 1) {
              const tileOffsetX = tileCol * patternGridSize;
              const tileOffsetY = tileRow * patternGridSize;
            
              const startX = artboardOffset + ((stitch.start.x + tileOffsetX) * cellSize);
              const startY = artboardOffset + ((stitch.start.y + tileOffsetY) * cellSize);
              const endX = artboardOffset + ((stitch.end.x + tileOffsetX) * cellSize);
              const endY = artboardOffset + ((stitch.end.y + tileOffsetY) * cellSize);

              // Check if line intersects with selection rectangle
              const intersects = lineIntersectsRect(startX, startY, endX, endY, minX, minY, maxX, maxY);
              if (intersects) {
                console.log('Line intersects!', { stitchId: stitch.id, startX, startY, endX, endY, tileRow, tileCol });
                selectedIds.add(stitch.id);
                break;
              }
            }
            if (selectedIds.has(stitch.id)) break;
          }
        } else {
          // No repeat - just check the original position
          const startX = artboardOffset + (stitch.start.x * cellSize);
          const startY = artboardOffset + (stitch.start.y * cellSize);
          const endX = artboardOffset + (stitch.end.x * cellSize);
          const endY = artboardOffset + (stitch.end.y * cellSize);

          // Check if line intersects with selection rectangle
          if (lineIntersectsRect(startX, startY, endX, endY, minX, minY, maxX, maxY)) {
            selectedIds.add(stitch.id);
          }
        }
      } else {
        const shouldRepeat = stitch.repeat !== false;
        const tilesToCheck = shouldRepeat ? tilesPerSide : 1;

        for (let tileRow = 0; tileRow < tilesToCheck; tileRow += 1) {
          for (let tileCol = 0; tileCol < tilesToCheck; tileCol += 1) {
            const offsetX = tileCol * patternGridSize;
            const offsetY = tileRow * patternGridSize;
            
            const startX = artboardOffset + ((stitch.start.x + offsetX) * cellSize);
            const startY = artboardOffset + ((stitch.start.y + offsetY) * cellSize);
            const endX = artboardOffset + ((stitch.end.x + offsetX) * cellSize);
            const endY = artboardOffset + ((stitch.end.y + offsetY) * cellSize);

            // Check if line intersects with selection rectangle
            if (lineIntersectsRect(startX, startY, endX, endY, minX, minY, maxX, maxY)) {
              selectedIds.add(stitch.id);
              break;
            }
          }
          if (selectedIds.has(stitch.id)) break;
        }
      }
    });
    
    console.log('Found', selectedIds.size, 'stitches in selection:', Array.from(selectedIds));
    
    // Mark that we just finished a drag selection to prevent click handler from firing
    justFinishedDragRef.current = true;
    
    // Update selection (add to existing if shift/ctrl is held)
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      const combined = new Set([...selectedStitchIds, ...selectedIds]);
      console.log('Updating selection (combined):', Array.from(combined));
      onSelectStitchIds(combined);
    } else {
      console.log('Updating selection (replace):', Array.from(selectedIds));
      onSelectStitchIds(selectedIds);
    }
    
    setDragSelectRect(null);
  };

  const handleCanvasClick = (event) => {
    // Ignore click if it's right after a drag selection
    if (justFinishedDragRef.current) {
      console.log('Ignoring click after drag selection');
      justFinishedDragRef.current = false;
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    if (drawingState.mode === 'draw') {
      const point = getNearestGridPoint(clickX, clickY, cellSize);
      if (!point) {
        return;
      }
      if (!drawingState.firstPoint) {
        onDrawingStateChange({ ...drawingState, firstPoint: { x: point.gridX, y: point.gridY } });
        return;
      }
      if (point.gridX === drawingState.firstPoint.x && point.gridY === drawingState.firstPoint.y) {
        onDrawingStateChange({ ...drawingState, firstPoint: null });
        return;
      }

      // Check if the line intersects with the artboard (extended by 1 tile on all sides)
      const startPixelX = drawingState.firstPoint.x * cellSize;
      const startPixelY = drawingState.firstPoint.y * cellSize;
      const endPixelX = point.gridX * cellSize;
      const endPixelY = point.gridY * cellSize;
      
      const tileSize = patternGridSize * cellSize;
      if (!lineIntersectsArtboard(startPixelX, startPixelY, endPixelX, endPixelY, artboardOffset, artboardOffset, artboardSize, tileSize)) {
        // Line doesn't intersect drawable area, don't add it
        onDrawingStateChange({ ...drawingState, firstPoint: null });
        return;
      }

      // Convert canvas grid coordinates to artboard-relative coordinates
      const artboardGridOffset = Math.round(artboardOffset / cellSize);
      const startGridX = drawingState.firstPoint.x - artboardGridOffset;
      const startGridY = drawingState.firstPoint.y - artboardGridOffset;
      const endGridX = point.gridX - artboardGridOffset;
      const endGridY = point.gridY - artboardGridOffset;

      // Store absolute artboard coordinates (not wrapped)
      const absoluteStart = {
        x: startGridX,
        y: startGridY,
      };
      const absoluteEnd = {
        x: endGridX,
        y: endGridY,
      };
      
      // Include stitch size and repeat setting in the stitch data
      onAddStitch({ start: absoluteStart, end: absoluteEnd, stitchSize, repeat: repeatPattern });
      onDrawingStateChange({ ...drawingState, firstPoint: null });
      return;
    }

    const stitches = pattern?.stitches ?? [];
    let closest = null;
    let closestDistance = SELECT_THRESHOLD;

    stitches.forEach((stitch) => {
      // Check if coordinates are absolute (new format) or wrapped (old format)
      const isAbsoluteCoords = stitch.start.x >= patternGridSize || stitch.start.y >= patternGridSize ||
                               stitch.end.x >= patternGridSize || stitch.end.y >= patternGridSize ||
                               stitch.start.x < 0 || stitch.start.y < 0 ||
                               stitch.end.x < 0 || stitch.end.y < 0;

      if (isAbsoluteCoords) {
        // New format: use absolute coordinates
        // Check all tile positions if repeat is on
        const shouldRepeat = stitch.repeat !== false;

        if (shouldRepeat) {
          // For repeat, check all tiles including negative offsets
          for (let tileRow = -1; tileRow <= tilesPerSide; tileRow += 1) {
            for (let tileCol = -1; tileCol <= tilesPerSide; tileCol += 1) {
              const tileOffsetX = tileCol * patternGridSize;
              const tileOffsetY = tileRow * patternGridSize;
            
              const startX = artboardOffset + ((stitch.start.x + tileOffsetX) * cellSize);
              const startY = artboardOffset + ((stitch.start.y + tileOffsetY) * cellSize);
              const endX = artboardOffset + ((stitch.end.x + tileOffsetX) * cellSize);
              const endY = artboardOffset + ((stitch.end.y + tileOffsetY) * cellSize);

              if (startX > canvasSize || startY > canvasSize) {
                continue;
              }

              const distance = distancePointToSegment(clickX, clickY, startX, startY, endX, endY);
              if (distance < closestDistance) {
                closestDistance = distance;
                closest = stitch.id;
              }
            }
          }
        } else {
          // For non-repeat, check single position at origin
          const tileOffsetX = 0;
          const tileOffsetY = 0;
          
          const startX = artboardOffset + ((stitch.start.x + tileOffsetX) * cellSize);
          const startY = artboardOffset + ((stitch.start.y + tileOffsetY) * cellSize);
          const endX = artboardOffset + ((stitch.end.x + tileOffsetX) * cellSize);
          const endY = artboardOffset + ((stitch.end.y + tileOffsetY) * cellSize);

          if (startX > canvasSize || startY > canvasSize) {
            // Skip this stitch if it's outside canvas
          } else {
            const distance = distancePointToSegment(clickX, clickY, startX, startY, endX, endY);
            if (distance < closestDistance) {
              closestDistance = distance;
              closest = stitch.id;
            }
          }
        }
      } else {
        // Old format: use wrapped coordinates with tiling
        const shouldRepeat = stitch.repeat !== false;
        const tilesToCheck = shouldRepeat ? tilesPerSide : 1;

        for (let tileRow = 0; tileRow < tilesToCheck; tileRow += 1) {
          for (let tileCol = 0; tileCol < tilesToCheck; tileCol += 1) {
            const offsetX = tileCol * patternGridSize;
            const offsetY = tileRow * patternGridSize;
            // Add artboardOffset to stitch coordinates
            const startX = artboardOffset + (stitch.start.x + offsetX) * cellSize;
            const startY = artboardOffset + (stitch.start.y + offsetY) * cellSize;
            const endX = artboardOffset + (stitch.end.x + offsetX) * cellSize;
            const endY = artboardOffset + (stitch.end.y + offsetY) * cellSize;

            if (startX > canvasSize || startY > canvasSize) {
              continue;
            }

            const distance = distancePointToSegment(clickX, clickY, startX, startY, endX, endY);
            if (distance < closestDistance) {
              closestDistance = distance;
              closest = stitch.id;
            }
          }
        }
      }
    });

    if (closest) {
      const next = new Set(selectedStitchIds);
      if (event.ctrlKey || event.metaKey || event.shiftKey) {
        if (next.has(closest)) {
          next.delete(closest);
        } else {
          next.add(closest);
        }
      } else {
        next.clear();
        next.add(closest);
      }
      onSelectStitchIds(next);
    } else if (!(event.ctrlKey || event.metaKey || event.shiftKey)) {
      onSelectStitchIds(new Set());
    }
  };

  const getCursorClass = () => {
    if (drawingState.mode === 'pan') return 'cursor-grab';
    if (drawingState.mode === 'draw') return 'cursor-crosshair';
    return 'cursor-default';
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className={`mx-auto bg-slate-950 ${getCursorClass()}`}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
});
