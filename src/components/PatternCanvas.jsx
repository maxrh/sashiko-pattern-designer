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

function getNearestGridPoint(clickX, clickY, patternGridSize) {
  const gridX = Math.round(clickX / patternGridSize);
  const gridY = Math.round(clickY / patternGridSize);
  const pixelX = gridX * patternGridSize;
  const pixelY = gridY * patternGridSize;
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

// Check if a line segment intersects or is contained within the artboard area
// Artboard = the total area containing all pattern tiles
// Extended by extraMargin on all sides to allow drawing beyond artboard edges into canvas padding
function lineIntersectsArtboard(startX, startY, endX, endY, artboardX, artboardY, artboardSize, extraMargin = 0) {
  const minX = artboardX - extraMargin;
  const maxX = artboardX + artboardSize + extraMargin;
  const minY = artboardY - extraMargin;
  const maxY = artboardY + artboardSize + extraMargin;
  
  // Check if either endpoint is inside the artboard (with margin)
  const startInside = startX >= minX && startX <= maxX && startY >= minY && startY <= maxY;
  const endInside = endX >= minX && endX <= maxX && endY >= minY && endY <= maxY;
  
  if (startInside || endInside) return true;
  
  // Check if line intersects any of the four edges of the artboard
  // This handles cases where line passes through artboard without endpoints inside
  const lineMinX = Math.min(startX, endX);
  const lineMaxX = Math.max(startX, endX);
  const lineMinY = Math.min(startY, endY);
  const lineMaxY = Math.max(startY, endY);
  
  // If line bounding box doesn't overlap artboard (with margin), no intersection
  if (lineMaxX < minX || lineMinX > maxX || lineMaxY < minY || lineMinY > maxY) {
    return false;
  }
  
  // At this point, bounding boxes overlap, so line likely intersects
  return true;
}

// PatternCanvas component renders the drawing surface:
// - Canvas = the entire grid area (includes artboard + padding)
// - Artboard = the total area containing all pattern tiles (inside the canvas)
export const PatternCanvas = forwardRef(function PatternCanvas({
  canvasSize,        // Size of entire canvas (grid area)
  cellSize,          // Size of each grid cell in pixels
  artboardOffset = 0, // Padding between canvas edge and artboard (typically 40px)
  artboardSize,      // Size of artboard (total pattern tile area)
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
  repeatPattern = true,
  showGrid = true,
  gridColor = '#94a3b8',
  gridOpacity = 0.25,
  tileOutlineColor = '#94a3b8',
  tileOutlineOpacity = 0.15,
  artboardOutlineColor = '#3b82f6',
  artboardOutlineOpacity = 0.5,
}, ref) {
  const canvasRef = useRef(null);
  const [dragSelectRect, setDragSelectRect] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const justFinishedDragRef = useRef(false);
  const patternTileSize = Math.max(1, pattern?.tileSize ?? 1);
  const patternGridSize = cellSize; // Pixel size per grid cell
  const canvasGridSize = useMemo(() => Math.round(canvasSize / patternGridSize), [canvasSize, patternGridSize]);
  const artboardGridSize = useMemo(() => Math.round(artboardSize / patternGridSize), [artboardSize, patternGridSize]);
  const tilesPerSide = useMemo(
    () => Math.ceil(artboardGridSize / patternTileSize),
    [artboardGridSize, patternTileSize]
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

    // Fill entire canvas background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    if (showGrid) {
      // Draw artboard boundary (the area where pattern tiles are drawn)
      const artboardR = parseInt(artboardOutlineColor.slice(1, 3), 16);
      const artboardG = parseInt(artboardOutlineColor.slice(3, 5), 16);
      const artboardB = parseInt(artboardOutlineColor.slice(5, 7), 16);
      ctx.strokeStyle = `rgba(${artboardR}, ${artboardG}, ${artboardB}, ${artboardOutlineOpacity})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(artboardOffset, artboardOffset, artboardSize, artboardSize);

      // Draw pattern tile boundaries (only within artboard and when repeat pattern is enabled)
      if (repeatPattern) {
        const tileR = parseInt(tileOutlineColor.slice(1, 3), 16);
        const tileG = parseInt(tileOutlineColor.slice(3, 5), 16);
        const tileB = parseInt(tileOutlineColor.slice(5, 7), 16);
        ctx.strokeStyle = `rgba(${tileR}, ${tileG}, ${tileB}, ${tileOutlineOpacity})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        const patternTilePixelSize = patternTileSize * patternGridSize;
        for (let row = 0; row <= tilesPerSide; row += 1) {
          for (let col = 0; col <= tilesPerSide; col += 1) {
            const x = artboardOffset + (col * patternTilePixelSize);
            const y = artboardOffset + (row * patternTilePixelSize);
            if (x <= artboardOffset + artboardSize && y <= artboardOffset + artboardSize) {
              ctx.strokeRect(x, y, Math.min(patternTilePixelSize, artboardSize - col * patternTilePixelSize), Math.min(patternTilePixelSize, artboardSize - row * patternTilePixelSize));
            }
          }
        }
      }
    }

    // Draw grid dots across entire canvas (not just artboard)
    if (showGrid) {
      const gridR = parseInt(gridColor.slice(1, 3), 16);
      const gridG = parseInt(gridColor.slice(3, 5), 16);
      const gridB = parseInt(gridColor.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${gridR}, ${gridG}, ${gridB}, ${gridOpacity})`;
      for (let x = 0; x <= canvasGridSize; x += 1) {
        for (let y = 0; y <= canvasGridSize; y += 1) {
          const centerX = x * patternGridSize;
          const centerY = y * patternGridSize;
          ctx.fillRect(centerX - 1.5, centerY - 1.5, 3, 3);
        }
      }
    }

    const stitches = pattern?.stitches ?? [];

    const stitchOffset = 4; // Start stitches 4px from grid point
    const gapBetweenStitches = 8; // 8px gap between adjacent stitches

    ctx.lineCap = 'butt'; // Use butt to get precise pixel alignment
    stitches.forEach((stitch) => {
      const colorOverride = stitchColors.get(stitch.id) ?? stitch.color ?? defaultStitchColor;
      
      // Check if this is a repeatable pattern line vs absolute positioned line
      // Pattern lines have start point WITHIN first tile (0 to tileSize)
      // tileSize represents cells per tile, valid pattern coords are 0 to tileSize (inclusive)
      // Note: Lines starting at tileSize boundary need special handling to avoid duplication
      const isPatternLine = stitch.repeat !== false &&
                           stitch.start.x >= 0 && stitch.start.x <= patternTileSize &&
                           stitch.start.y >= 0 && stitch.start.y <= patternTileSize;
      
      // Check if this line starts exactly at a tile boundary
      const startsAtBoundaryX = stitch.start.x === patternTileSize || stitch.start.x === 0;
      const startsAtBoundaryY = stitch.start.y === patternTileSize || stitch.start.y === 0;
      
      if (isPatternLine) {
        // Pattern line with repeat ON - render in all artboard tiles (0 to tilesPerSide-1)
        // Also render in outer tiles (-1 and tilesPerSide) for lines that cross into canvas padding
        for (let tileRow = -1; tileRow < tilesPerSide + 1; tileRow++) {
          for (let tileCol = -1; tileCol < tilesPerSide + 1; tileCol++) {
            // Check if this is an outer tile (beyond the artboard, in the canvas padding)
            const isOuterTile = tileRow < 0 || tileRow >= tilesPerSide || 
                                tileCol < 0 || tileCol >= tilesPerSide;
            
            // BOUNDARY LINE HANDLING:
            // - Lines crossing boundaries OR running along boundaries: repeat in outer tiles in crossing/running direction
            // - Lines crossing corners: repeat 5x5 (all outer tiles)
            // - Lines just touching boundaries: repeat 4x4 (skip outer tiles)
            if (isOuterTile) {
              // A line crosses if BOTH start and end are not within normal tile bounds
              // OR if end extends beyond bounds and start is not on the boundary it's leaving from
              const startOnLeftBoundary = stitch.start.x === 0;
              const startOnRightBoundary = stitch.start.x === patternTileSize;
              const startOnTopBoundary = stitch.start.y === 0;
              const startOnBottomBoundary = stitch.start.y === patternTileSize;
              
              // If line goes slightly outside bounds (by 1), it's just touching boundary, not crossing
              // True crossing: goes outside by more than 1 grid cell
              const lineLength = Math.sqrt(Math.pow(stitch.end.x - stitch.start.x, 2) + Math.pow(stitch.end.y - stitch.start.y, 2));
              const justTouchingBoundary = lineLength <= 1.5; // Allow for diagonal (sqrt(2) ≈ 1.41)
              
              const crossesHorizontally = !justTouchingBoundary && (stitch.end.x < 0 || stitch.end.x > patternTileSize);
              const crossesVertically = !justTouchingBoundary && (stitch.end.y < 0 || stitch.end.y > patternTileSize);
              
              // A line runs along a boundary if BOTH endpoints are on the SAME boundary
              const bothOnVerticalBoundary = 
                (stitch.start.x === 0 || stitch.start.x === patternTileSize) &&
                (stitch.end.x === 0 || stitch.end.x === patternTileSize) &&
                stitch.start.x === stitch.end.x;
              
              const bothOnHorizontalBoundary = 
                (stitch.start.y === 0 || stitch.start.y === patternTileSize) &&
                (stitch.end.y === 0 || stitch.end.y === patternTileSize) &&
                stitch.start.y === stitch.end.y;
              
              // Lines crossing horizontally OR running along vertical boundary: repeat in X direction (left/right outer tiles)
              const shouldRepeatInXDirection = crossesHorizontally || bothOnVerticalBoundary;
              
              // Lines crossing vertically OR running along horizontal boundary: repeat in Y direction (top/bottom outer tiles)
              const shouldRepeatInYDirection = crossesVertically || bothOnHorizontalBoundary;
              
              // Determine which outer tiles to render in
              const isLeftRightOuterTile = tileCol < 0 || tileCol >= tilesPerSide;
              const isTopBottomOuterTile = tileRow < 0 || tileRow >= tilesPerSide;
              
              // Skip this outer tile if line shouldn't repeat in this direction
              if (isLeftRightOuterTile && !shouldRepeatInXDirection) {
                continue;
              }
              if (isTopBottomOuterTile && !shouldRepeatInYDirection) {
                continue;
              }
            }
            
            // Calculate position within this specific tile
            const tileBaseX = tileCol * patternTileSize;
            const tileBaseY = tileRow * patternTileSize;
            
            // Pattern-relative coordinates + tile base = absolute position in this tile
            const startX = artboardOffset + ((stitch.start.x + tileBaseX) * patternGridSize);
            const startY = artboardOffset + ((stitch.start.y + tileBaseY) * patternGridSize);
            const endX = artboardOffset + ((stitch.end.x + tileBaseX) * patternGridSize);
            const endY = artboardOffset + ((stitch.end.y + tileBaseY) * patternGridSize);

            // Skip if line is completely outside canvas bounds
            if (startX > canvasSize + patternGridSize || startY > canvasSize + patternGridSize) {
              continue;
            }
            
            // For outer tiles (in canvas padding), only render if the line actually crosses into the artboard
            if (isOuterTile) {
              // Calculate the artboard boundaries in canvas pixels
              const artboardStartPixel = artboardOffset;
              const artboardEndPixel = artboardOffset + artboardSize;
              
              // Check if this line segment intersects with the artboard area
              // A line intersects if any part of it is within [artboardStart, artboardEnd] for both x and y
              const lineMinX = Math.min(startX, endX);
              const lineMaxX = Math.max(startX, endX);
              const lineMinY = Math.min(startY, endY);
              const lineMaxY = Math.max(startY, endY);
              
              const intersectsArtboard = !(
                lineMaxX < artboardStartPixel ||
                lineMinX > artboardEndPixel ||
                lineMaxY < artboardStartPixel ||
                lineMinY > artboardEndPixel
              );
              
              if (!intersectsArtboard) {
                continue; // Skip - line doesn't touch the artboard from this outer tile
              }
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

            // Get stitch size info from stitch metadata (or use default 'small')
            const stitchSizeForLine = stitch.stitchSize || 'small';
            
            // Determine target dash count based on stitch size and actual line length
            // Use the ACTUAL line length (before offsets) to determine stitch count
            let targetDashCount;
            const actualCellsInLine = length / 20; // How many 20px cells in the actual line
            const cellsInLine = drawableLength / 20; // Drawable length for calculations
            
            // For large, we use medium calculation as base
            const isLarge = stitchSizeForLine === 'large';
            const sizeForCalc = isLarge ? 'medium' : stitchSizeForLine;
            
            switch (sizeForCalc) {
              case 'small':
                // Small: 2 dashes per 20px cell, scale to actual line length
                targetDashCount = Math.max(2, Math.round(actualCellsInLine * 2));
                break;
              case 'medium':
              default:
                // Medium: 1 dash per 20px cell
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
            } else if (isLarge) {
              // Large: ensure even count for pairing
              if (targetDashCount % 2 !== 0) {
                targetDashCount += 1;
              }
              // Large: merge pairs of dashes
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
            ctx.strokeStyle = isSelected ? '#0000FF' : (colorOverride ?? defaultStitchColor);
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
        // Absolute coordinates - non-repeating line at specific position
        const startX = artboardOffset + (stitch.start.x * patternGridSize);
          const startY = artboardOffset + (stitch.start.y * patternGridSize);
          const endX = artboardOffset + (stitch.end.x * patternGridSize);
          const endY = artboardOffset + (stitch.end.y * patternGridSize);

          if (startX > canvasSize + patternGridSize || startY > canvasSize + patternGridSize) {
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

          // Get stitch size info from stitch metadata (or use default 'small')
          const stitchSizeForLine = stitch.stitchSize || 'small';
          
          // Determine target dash count based on stitch size and actual line length
          let targetDashCount;
          const actualCellsInLine = length / 20;
          
          const isLarge = stitchSizeForLine === 'large';
          const sizeForCalc = isLarge ? 'medium' : stitchSizeForLine;
          
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
          } else if (isLarge) {
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
          ctx.strokeStyle = isSelected ? '#0000FF' : (colorOverride ?? defaultStitchColor);
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(offsetStartX, offsetStartY);
          ctx.lineTo(offsetEndX, offsetEndY);
          ctx.stroke();
          ctx.restore();
        }
    });

    if (drawingState.mode === 'draw' && drawingState.firstPoint) {
      ctx.save();
      ctx.fillStyle = '#0000FF';
      ctx.beginPath();
      const firstPointX = drawingState.firstPoint.x * patternGridSize;
      const firstPointY = drawingState.firstPoint.y * patternGridSize;
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
    patternGridSize,
    defaultStitchColor,
    dragSelectRect,
    drawingState.firstPoint,
    drawingState.mode,
    pattern,
    patternTileSize,
    repeatPattern,
    selectedStitchIds,
    showGrid,
    stitchColors,
    tilesPerSide,
    gridColor,
    gridOpacity,
    tileOutlineColor,
    tileOutlineOpacity,
    artboardOutlineColor,
    artboardOutlineOpacity,
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
    
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragSelectRect({ startX: x, startY: y, endX: x, endY: y });
  };

  const handleMouseMove = (event) => {
    if (!isDraggingRef.current || drawingState.mode !== 'select') {
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setDragSelectRect((prev) => prev ? { ...prev, endX: x, endY: y } : null);
  };

  const handleMouseUp = (event) => {
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
    
    // Check if it was just a tiny drag (essentially a click)
    const width = maxX - minX;
    const height = maxY - minY;
    if (width < 5 && height < 5) {
      setDragSelectRect(null);
      return; // Let handleCanvasClick handle it
    }
    
    // Find all stitches that intersect with the selection rectangle
    const stitches = pattern?.stitches ?? [];
    const selectedIds = new Set();
    
    stitches.forEach((stitch) => {
      const isAbsoluteCoords = stitch.start.x >= patternTileSize || stitch.start.y >= patternTileSize ||
                               stitch.end.x >= patternTileSize || stitch.end.y >= patternTileSize ||
                               stitch.start.x < 0 || stitch.start.y < 0 ||
                               stitch.end.x < 0 || stitch.end.y < 0;

      if (isAbsoluteCoords) {
        const shouldRepeat = stitch.repeat !== false;

        if (shouldRepeat) {
          // Check all possible tile offsets (including negative)
          for (let tileRow = -1; tileRow <= tilesPerSide; tileRow += 1) {
            for (let tileCol = -1; tileCol <= tilesPerSide; tileCol += 1) {
              const tileOffsetX = tileCol * patternTileSize;
              const tileOffsetY = tileRow * patternTileSize;
            
              const startX = artboardOffset + ((stitch.start.x + tileOffsetX) * patternGridSize);
              const startY = artboardOffset + ((stitch.start.y + tileOffsetY) * patternGridSize);
              const endX = artboardOffset + ((stitch.end.x + tileOffsetX) * patternGridSize);
              const endY = artboardOffset + ((stitch.end.y + tileOffsetY) * patternGridSize);

              // Check if line intersects with selection rectangle
              if (lineIntersectsRect(startX, startY, endX, endY, minX, minY, maxX, maxY)) {
                selectedIds.add(stitch.id);
                break;
              }
            }
            if (selectedIds.has(stitch.id)) break;
          }
        } else {
          // No repeat - just check the original position
          const startX = artboardOffset + (stitch.start.x * patternGridSize);
          const startY = artboardOffset + (stitch.start.y * patternGridSize);
          const endX = artboardOffset + (stitch.end.x * patternGridSize);
          const endY = artboardOffset + (stitch.end.y * patternGridSize);

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
            const offsetX = tileCol * patternTileSize;
            const offsetY = tileRow * patternTileSize;
            
            const startX = artboardOffset + ((stitch.start.x + offsetX) * patternGridSize);
            const startY = artboardOffset + ((stitch.start.y + offsetY) * patternGridSize);
            const endX = artboardOffset + ((stitch.end.x + offsetX) * patternGridSize);
            const endY = artboardOffset + ((stitch.end.y + offsetY) * patternGridSize);

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
    
    // Mark that we just finished a drag selection to prevent click handler from firing
    justFinishedDragRef.current = true;
    
    // Update selection (add to existing if shift/ctrl is held)
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      const combined = new Set([...selectedStitchIds, ...selectedIds]);
      onSelectStitchIds(combined);
    } else {
      onSelectStitchIds(selectedIds);
    }
    
    setDragSelectRect(null);
  };

  const handleCanvasClick = (event) => {
    // Ignore click if it's right after a drag selection
    if (justFinishedDragRef.current) {
      justFinishedDragRef.current = false;
      return;
    }

    // Ignore click if pan mode is active (hand tool)
    if (drawingState.mode === 'pan') {
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    if (drawingState.mode === 'draw') {
      const point = getNearestGridPoint(clickX, clickY, patternGridSize);
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
      const startPixelX = drawingState.firstPoint.x * patternGridSize;
      const startPixelY = drawingState.firstPoint.y * patternGridSize;
      const endPixelX = point.gridX * patternGridSize;
      const endPixelY = point.gridY * patternGridSize;
      
      const tileSize = patternTileSize * patternGridSize;
      if (!lineIntersectsArtboard(startPixelX, startPixelY, endPixelX, endPixelY, artboardOffset, artboardOffset, artboardSize, tileSize)) {
        // Line doesn't intersect drawable area, don't add it
        onDrawingStateChange({ ...drawingState, firstPoint: null });
        return;
      }

      // Convert canvas grid coordinates to artboard-relative coordinates
      const artboardGridOffset = Math.round(artboardOffset / patternGridSize);
      const startGridX = drawingState.firstPoint.x - artboardGridOffset;
      const startGridY = drawingState.firstPoint.y - artboardGridOffset;
      const endGridX = point.gridX - artboardGridOffset;
      const endGridY = point.gridY - artboardGridOffset;

      // Check if the line intersects the actual artboard (not just the drawable area)
      const artboardGridSize = Math.round(artboardSize / patternGridSize);
      const lineIntersectsArtboardArea = !(
        (startGridX < 0 && endGridX < 0) ||
        (startGridY < 0 && endGridY < 0) ||
        (startGridX > artboardGridSize && endGridX > artboardGridSize) ||
        (startGridY > artboardGridSize && endGridY > artboardGridSize)
      );

      // When repeat is ON and line touches artboard, reduce coordinates to first tile pattern
      // For cross-tile lines, we keep the relative offset so they repeat correctly
      let finalStart, finalEnd;
      let shouldRepeat = false;
      
      if (repeatPattern && lineIntersectsArtboardArea) {
        // Reduce coordinates to the first tile while preserving cross-tile relationships
        // We want lines to stay within the pattern space (0 to patternTileSize) for their "base" position
        // But they can extend beyond that to represent cross-tile lines
        
        // Check if this is a boundary line (runs exactly along a tile edge)
        const isVerticalBoundaryLine = startGridX === endGridX && (startGridX % patternTileSize === 0);
        const isHorizontalBoundaryLine = startGridY === endGridY && (startGridY % patternTileSize === 0);
        
        if (isVerticalBoundaryLine || isHorizontalBoundaryLine) {
          // Boundary lines need special handling
          // Lines at tile multiples (x=10,20,30 with tileSize=10) should all map to the SAME boundary
          // We use modulo, but when result is 0 for non-zero input, we treat it as the boundary
          
          const normalizeBoundaryCoord = (coord) => {
            const mod = coord % patternTileSize;
            // coord=0 -> 0 (left/top edge)
            // coord=10,20,30... -> 0 (these are all the same repeating boundary)
            return mod;
          };
          
          // Calculate the offset between start and end
          const dx = endGridX - startGridX;
          const dy = endGridY - startGridY;
          
          // Normalize the start point
          finalStart = {
            x: normalizeBoundaryCoord(startGridX),
            y: normalizeBoundaryCoord(startGridY),
          };
          
          // Apply the offset to get the end point
          finalEnd = {
            x: finalStart.x + dx,
            y: finalStart.y + dy,
          };
        } else {
          // Non-boundary lines: use floor-based normalization
          // Find which tile the START and END points are in
          const startTileX = Math.floor(startGridX / patternTileSize);
          const startTileY = Math.floor(startGridY / patternTileSize);
          const endTileX = Math.floor(endGridX / patternTileSize);
          const endTileY = Math.floor(endGridY / patternTileSize);
          
          // If start and end are in adjacent tiles (line just touches boundary),
          // normalize to the tile that contains the majority of the line
          // For lines going from boundary into tile, use the "inner" tile
          
          // Use the tile of whichever point is NOT on a boundary, or use end tile for ties
          const startOnBoundary = (startGridX % patternTileSize === 0) || (startGridY % patternTileSize === 0);
          const endOnBoundary = (endGridX % patternTileSize === 0) || (endGridY % patternTileSize === 0);
          
          let baseTileX, baseTileY;
          if (startOnBoundary && !endOnBoundary) {
            // Start on boundary, end inside - use end's tile (regardless of line length)
            // This ensures lines drawn from boundary inward normalize to the correct tile
            baseTileX = endTileX;
            baseTileY = endTileY;
          } else {
            // Normal case: use start's tile
            baseTileX = startTileX;
            baseTileY = startTileY;
          }
          
          // Normalize both points to the base tile
          const normalizedStartX = startGridX - (baseTileX * patternTileSize);
          const normalizedStartY = startGridY - (baseTileY * patternTileSize);
          const normalizedEndX = endGridX - (baseTileX * patternTileSize);
          const normalizedEndY = endGridY - (baseTileY * patternTileSize);
          
          finalStart = {
            x: normalizedStartX,
            y: normalizedStartY,
          };
          finalEnd = {
            x: normalizedEndX,
            y: normalizedEndY,
          };
        }
        shouldRepeat = true;
      } else {
        // Store absolute artboard coordinates (not wrapped)
        // This handles: repeat OFF or margin-only lines
        finalStart = {
          x: startGridX,
          y: startGridY,
        };
        finalEnd = {
          x: endGridX,
          y: endGridY,
        };
        shouldRepeat = false;
      }
      
      // Include stitch size and repeat setting in the stitch data
      onAddStitch({ start: finalStart, end: finalEnd, stitchSize, repeat: shouldRepeat });
      onDrawingStateChange({ ...drawingState, firstPoint: null });
      return;
    }

    const stitches = pattern?.stitches ?? [];
    let closest = null;
    let closestDistance = SELECT_THRESHOLD;

    stitches.forEach((stitch) => {
      // Check if coordinates are absolute (new format) or wrapped (old format)
      const isAbsoluteCoords = stitch.start.x >= patternTileSize || stitch.start.y >= patternTileSize ||
                               stitch.end.x >= patternTileSize || stitch.end.y >= patternTileSize ||
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
              // Check if this is an outer tile
              const isOuterTile = tileRow < 0 || tileRow >= tilesPerSide || 
                                  tileCol < 0 || tileCol >= tilesPerSide;
              
              // Apply same filtering as rendering: skip outer tiles for boundary lines
              if (isOuterTile) {
                const lineLength = Math.sqrt(Math.pow(stitch.end.x - stitch.start.x, 2) + Math.pow(stitch.end.y - stitch.start.y, 2));
                const justTouchingBoundary = lineLength <= 1.5;
                
                const crossesHorizontally = !justTouchingBoundary && (stitch.end.x < 0 || stitch.end.x > patternTileSize);
                const crossesVertically = !justTouchingBoundary && (stitch.end.y < 0 || stitch.end.y > patternTileSize);
                
                // A line runs along a boundary if BOTH endpoints are on the SAME boundary
                const bothOnVerticalBoundary = 
                  (stitch.start.x === 0 || stitch.start.x === patternTileSize) &&
                  (stitch.end.x === 0 || stitch.end.x === patternTileSize) &&
                  stitch.start.x === stitch.end.x;
                
                const bothOnHorizontalBoundary = 
                  (stitch.start.y === 0 || stitch.start.y === patternTileSize) &&
                  (stitch.end.y === 0 || stitch.end.y === patternTileSize) &&
                  stitch.start.y === stitch.end.y;
                
                // Lines crossing horizontally OR running along vertical boundary: clickable in X direction (left/right outer tiles)
                const shouldRepeatInXDirection = crossesHorizontally || bothOnVerticalBoundary;
                
                // Lines crossing vertically OR running along horizontal boundary: clickable in Y direction (top/bottom outer tiles)
                const shouldRepeatInYDirection = crossesVertically || bothOnHorizontalBoundary;
                
                // Determine which outer tiles to check
                const isLeftRightOuterTile = tileCol < 0 || tileCol >= tilesPerSide;
                const isTopBottomOuterTile = tileRow < 0 || tileRow >= tilesPerSide;
                
                // Skip this outer tile if line shouldn't be clickable in this direction
                if (isLeftRightOuterTile && !shouldRepeatInXDirection) {
                  continue;
                }
                if (isTopBottomOuterTile && !shouldRepeatInYDirection) {
                  continue;
                }
              }
              
              const tileOffsetX = tileCol * patternTileSize;
              const tileOffsetY = tileRow * patternTileSize;
            
              const startX = artboardOffset + ((stitch.start.x + tileOffsetX) * patternGridSize);
              const startY = artboardOffset + ((stitch.start.y + tileOffsetY) * patternGridSize);
              const endX = artboardOffset + ((stitch.end.x + tileOffsetX) * patternGridSize);
              const endY = artboardOffset + ((stitch.end.y + tileOffsetY) * patternGridSize);

              if (startX > canvasSize || startY > canvasSize) {
                continue;
              }
              
              // For outer tiles, only check if line intersects artboard
              if (isOuterTile) {
                const artboardStartPixel = artboardOffset;
                const artboardEndPixel = artboardOffset + artboardSize;
                
                const lineMinX = Math.min(startX, endX);
                const lineMaxX = Math.max(startX, endX);
                const lineMinY = Math.min(startY, endY);
                const lineMaxY = Math.max(startY, endY);
                
                const intersectsArtboard = !(
                  lineMaxX < artboardStartPixel ||
                  lineMinX > artboardEndPixel ||
                  lineMaxY < artboardStartPixel ||
                  lineMinY > artboardEndPixel
                );
                
                if (!intersectsArtboard) {
                  continue;
                }
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
          
          const startX = artboardOffset + ((stitch.start.x + tileOffsetX) * patternGridSize);
          const startY = artboardOffset + ((stitch.start.y + tileOffsetY) * patternGridSize);
          const endX = artboardOffset + ((stitch.end.x + tileOffsetX) * patternGridSize);
          const endY = artboardOffset + ((stitch.end.y + tileOffsetY) * patternGridSize);

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
            const offsetX = tileCol * patternTileSize;
            const offsetY = tileRow * patternTileSize;
            // Add artboardOffset to stitch coordinates
            const startX = artboardOffset + (stitch.start.x + offsetX) * patternGridSize;
            const startY = artboardOffset + (stitch.start.y + offsetY) * patternGridSize;
            const endX = artboardOffset + (stitch.end.x + offsetX) * patternGridSize;
            const endY = artboardOffset + (stitch.end.y + offsetY) * patternGridSize;

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
      className={`mx-auto ${getCursorClass()}`}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
});
