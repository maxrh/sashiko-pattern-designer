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

    // Draw grid dots as 3x3px squares with center pixel as connection point
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    for (let x = 0; x <= canvasGridSize; x += 1) {
      for (let y = 0; y <= canvasGridSize; y += 1) {
        const centerX = x * cellSize;
        const centerY = y * cellSize;
        ctx.fillRect(centerX - 1, centerY - 1, 3, 3);
      }
    }

    const stitches = pattern?.stitches ?? [];

    const stitchOffset = 2; // Start stitches 2px from grid point
    const gapBetweenStitches = 4; // 4px gap between adjacent stitches

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

          // Determine if this is a diagonal stitch by checking grid coordinates
          const gridDx = Math.abs(stitch.end.x - stitch.start.x);
          const gridDy = Math.abs(stitch.end.y - stitch.start.y);
          const isDiagonal = gridDx > 0 && gridDy > 0 && gridDx === gridDy;

          // Calculate dash length based on stitch orientation
          // Horizontal/Vertical (20px cell): 2px offset + 6px dash + 4px gap + 6px dash + 2px offset = 20px
          // Diagonal (28.2843px): 2px offset + 10.142px dash + 4px gap + 10.142px dash + 2px offset ≈ 28.28px
          let dashLength, gapLength;
          
          if (isDiagonal) {
            // For diagonal across single cell: (28.2843 - 4px offsets - 4px gap) / 2 = 10.142px
            dashLength = (28.2843 - (2 * stitchOffset) - gapBetweenStitches) / 2;
            gapLength = gapBetweenStitches;
          } else {
            // Horizontal or vertical: (20 - 4px offsets - 4px gap) / 2 = 6px
            dashLength = 6;
            gapLength = gapBetweenStitches;
          }

          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([dashLength, gapLength]);
          ctx.strokeStyle = colorOverride ?? defaultThreadColor;
          ctx.lineWidth = isSelected ? 4 : 2;
          if (isSelected) {
            ctx.shadowColor = colorOverride ?? defaultThreadColor;
            ctx.shadowBlur = 12;
          }
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
      onAddStitch({ start: wrappedStart, end: wrappedEnd });
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
      className="mx-auto rounded-xl border border-slate-800 bg-slate-950 shadow-lg"
      onClick={handleCanvasClick}
    />
  );
});
