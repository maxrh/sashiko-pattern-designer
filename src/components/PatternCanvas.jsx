import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

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

export const PatternCanvas = forwardRef(function PatternCanvas({
  canvasSize,
  cellSize,
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
}, ref) {
  const canvasRef = useRef(null);
  const patternGridSize = Math.max(1, pattern?.gridSize ?? 1);
  const canvasGridSize = useMemo(() => Math.round(canvasSize / cellSize), [canvasSize, cellSize]);
  const tilesPerSide = useMemo(
    () => Math.ceil(canvasGridSize / patternGridSize),
    [canvasGridSize, patternGridSize]
  );

  useImperativeHandle(ref, () => ({
    exportAsImage: () => canvasRef.current?.toDataURL('image/png'),
    getCanvasElement: () => canvasRef.current,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio ?? 1;

    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw pattern cell boundaries (discrete outline)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    const patternCellPixelSize = patternGridSize * cellSize;
    for (let row = 0; row <= tilesPerSide; row += 1) {
      for (let col = 0; col <= tilesPerSide; col += 1) {
        const x = col * patternCellPixelSize;
        const y = row * patternCellPixelSize;
        if (x <= canvasSize && y <= canvasSize) {
          ctx.strokeRect(x, y, Math.min(patternCellPixelSize, canvasSize - x), Math.min(patternCellPixelSize, canvasSize - y));
        }
      }
    }

    // Draw grid dots as 3x3px squares with center pixel as connection point
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
      for (let tileRow = 0; tileRow < tilesPerSide; tileRow += 1) {
        for (let tileCol = 0; tileCol < tilesPerSide; tileCol += 1) {
          const offsetX = tileCol * patternGridSize;
          const offsetY = tileRow * patternGridSize;
          const startX = (stitch.start.x + offsetX) * cellSize;
          const startY = (stitch.start.y + offsetY) * cellSize;
          const endX = (stitch.end.x + offsetX) * cellSize;
          const endY = (stitch.end.y + offsetY) * cellSize;

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

          // Offset start and end by 2px along the line
          const offsetStartX = startX + unitX * stitchOffset;
          const offsetStartY = startY + unitY * stitchOffset;
          const offsetEndX = endX - unitX * stitchOffset;
          const offsetEndY = endY - unitY * stitchOffset;

          // Calculate the drawable length (after removing offsets)
          const drawableLength = length - (2 * stitchOffset);

          // Get stitch size info from stitch metadata (or use default 'medium')
          const stitchSizeForLine = stitch.stitchSize || 'medium';
          
          // Determine target dash count based on stitch size and actual line length
          // Use the actual length to determine how many stitches should fit
          let targetDashCount;
          const cellsInLine = drawableLength / 20; // How many 20px cells in this line
          
          // For xlarge, we use large calculation as base
          const isXLarge = stitchSizeForLine === 'xlarge';
          const sizeForCalc = isXLarge ? 'large' : stitchSizeForLine;
          
          switch (sizeForCalc) {
            case 'medium':
              // Medium: 2 dashes per 20px cell, scale to actual line length
              targetDashCount = Math.max(2, Math.round(cellsInLine * 2));
              break;
            case 'large':
            default:
              // Large: 1 dash per 20px cell, scale to actual line length
              // Use floor to avoid rounding up (e.g., 0.6 cells -> 0, then make it 2 minimum)
              targetDashCount = Math.max(2, Math.floor(cellsInLine * 1));
              // For lines close to 1 cell, ensure we get exactly 2 dashes
              if (cellsInLine >= 0.8 && cellsInLine <= 1.2) {
                targetDashCount = 2;
              }
              break;
          }
          
          // Ensure even number of dashes for symmetry
          if (targetDashCount % 2 !== 0) {
            targetDashCount += 1;
          }
          
          // For xlarge: combine every 2 dashes into 1 longer stitch
          // Pattern becomes: [longDash, gap, longDash, gap] instead of [dash, gap, dash, gap, dash, gap, dash, gap]
          let dashLength, gapLength, dashPattern;
          
          if (isXLarge) {
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
            // Regular calculation
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
          ctx.strokeStyle = isSelected ? '#3b82f6' : (colorOverride ?? defaultThreadColor);
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(offsetStartX, offsetStartY);
          ctx.lineTo(offsetEndX, offsetEndY);
          ctx.stroke();
          ctx.restore();
        }
      }
    });

    if (drawingState.mode === 'draw' && drawingState.firstPoint) {
      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(drawingState.firstPoint.x * cellSize, drawingState.firstPoint.y * cellSize, DOT_RADIUS * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [
    backgroundColor,
    canvasGridSize,
    canvasSize,
    cellSize,
    defaultThreadColor,
    drawingState.firstPoint,
    drawingState.mode,
    pattern,
    patternGridSize,
    selectedStitchIds,
    stitchColors,
    tilesPerSide,
  ]);

  const handleCanvasClick = (event) => {
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

      const wrappedStart = {
        x: wrapCoordinate(drawingState.firstPoint.x, patternGridSize),
        y: wrapCoordinate(drawingState.firstPoint.y, patternGridSize),
      };
      const wrappedEnd = {
        x: wrapCoordinate(point.gridX, patternGridSize),
        y: wrapCoordinate(point.gridY, patternGridSize),
      };
      
      // Include stitch size in the stitch data
      onAddStitch({ start: wrappedStart, end: wrappedEnd, stitchSize });
      onDrawingStateChange({ ...drawingState, firstPoint: null });
      return;
    }

    const stitches = pattern?.stitches ?? [];
    let closest = null;
    let closestDistance = SELECT_THRESHOLD;

    stitches.forEach((stitch) => {
      for (let tileRow = 0; tileRow < tilesPerSide; tileRow += 1) {
        for (let tileCol = 0; tileCol < tilesPerSide; tileCol += 1) {
          const offsetX = tileCol * patternGridSize;
          const offsetY = tileRow * patternGridSize;
          const startX = (stitch.start.x + offsetX) * cellSize;
          const startY = (stitch.start.y + offsetY) * cellSize;
          const endX = (stitch.end.x + offsetX) * cellSize;
          const endY = (stitch.end.y + offsetY) * cellSize;

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

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className={`mx-auto rounded-xl bg-slate-950 ${drawingState.mode === 'draw' ? 'cursor-crosshair' : 'cursor-default'}`}
      onClick={handleCanvasClick}
    />
  );
});
