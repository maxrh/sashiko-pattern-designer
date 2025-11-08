import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { renderStitch, DEFAULT_GAP_SIZE, calculateStitchOffset } from './Stitches';
import { DEFAULT_GRID_COLOR, DEFAULT_TILE_OUTLINE_COLOR, DEFAULT_ARTBOARD_OUTLINE_COLOR } from './PatternDesigner';

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
function lineIntersectsArtboard(startX, startY, endX, endY, artboardX, artboardY, artboardWidth, artboardHeight, extraMargin = 0) {
  const minX = artboardX - extraMargin;
  const maxX = artboardX + artboardWidth + extraMargin;
  const minY = artboardY - extraMargin;
  const maxY = artboardY + artboardHeight + extraMargin;
  
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
  canvasWidth,       // Width of entire canvas (grid area)
  canvasHeight,      // Height of entire canvas (grid area)
  cellSize,          // Size of each grid cell in pixels
  artboardOffset = 0, // Padding between canvas edge and artboard (typically 40px)
  artboardWidth,     // Width of artboard (total pattern tile area)
  artboardHeight,    // Height of artboard (total pattern tile area)
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
  gridColor = DEFAULT_GRID_COLOR,
  tileOutlineColor = DEFAULT_TILE_OUTLINE_COLOR,
  artboardOutlineColor = DEFAULT_ARTBOARD_OUTLINE_COLOR,
}, ref) {
  const canvasRef = useRef(null);
  const [dragSelectRect, setDragSelectRect] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const justFinishedDragRef = useRef(false);
  
  // Store visible stitch instances (computed during rendering)
  // Map: stitchId -> Array of {startX, startY, endX, endY} in canvas pixel coordinates
  const visibleStitchInstancesRef = useRef(new Map());
  
  // Normalize tileSize to {x, y} format (supports legacy number format)
  const patternTileSize = useMemo(() => {
    const ts = pattern?.tileSize;
    if (typeof ts === 'number') {
      return { x: Math.max(1, ts), y: Math.max(1, ts) };
    }
    if (ts && typeof ts === 'object') {
      return { x: Math.max(1, ts.x ?? 1), y: Math.max(1, ts.y ?? 1) };
    }
    return { x: 1, y: 1 };
  }, [pattern?.tileSize]);
  
  const patternGridSize = cellSize; // Pixel size per grid cell
  const canvasGridWidth = useMemo(() => Math.round(canvasWidth / patternGridSize), [canvasWidth, patternGridSize]);
  const canvasGridHeight = useMemo(() => Math.round(canvasHeight / patternGridSize), [canvasHeight, patternGridSize]);
  const artboardGridWidth = useMemo(() => Math.round(artboardWidth / patternGridSize), [artboardWidth, patternGridSize]);
  const artboardGridHeight = useMemo(() => Math.round(artboardHeight / patternGridSize), [artboardHeight, patternGridSize]);
  
  // Calculate number of tiles in X and Y directions separately for non-square artboards
  const tilesX = useMemo(() => Math.ceil(artboardGridWidth / patternTileSize.x), [artboardGridWidth, patternTileSize.x]);
  const tilesY = useMemo(() => Math.ceil(artboardGridHeight / patternTileSize.y), [artboardGridHeight, patternTileSize.y]);
  
  // Memoize tile pixel dimensions to avoid repeated calculations
  const tilePixelWidth = useMemo(() => patternTileSize.x * patternGridSize, [patternTileSize.x, patternGridSize]);
  const tilePixelHeight = useMemo(() => patternTileSize.y * patternGridSize, [patternTileSize.y, patternGridSize]);
  
  // Memoize artboard boundaries for intersection checks
  const artboardBounds = useMemo(() => ({
    startPixelX: artboardOffset,
    endPixelX: artboardOffset + artboardWidth,
    startPixelY: artboardOffset,
    endPixelY: artboardOffset + artboardHeight,
  }), [artboardOffset, artboardWidth, artboardHeight]);

  useImperativeHandle(ref, () => ({
    exportAsImage: (resolutionMultiplier = 1) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      
      // Calculate the extended area: artboard + 1 tile margin on all sides
      // Extended area is where pattern stitches can repeat/extend
      // Use memoized tile dimensions
      const extendedAreaWidth = artboardWidth + (2 * tilePixelWidth);
      const extendedAreaHeight = artboardHeight + (2 * tilePixelHeight);
      
      // Extended area starts 1 tile before the artboard (inside the canvas margin)
      const extendedAreaOffsetX = artboardOffset - tilePixelWidth;
      const extendedAreaOffsetY = artboardOffset - tilePixelHeight;
      
      // Create a temporary canvas to hold only the artboard + extended area
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      const dpr = window.devicePixelRatio ?? 1;
      
      // Apply resolution multiplier for higher/lower quality exports
      const exportScale = dpr * resolutionMultiplier;
      
      // Set dimensions to include extended area only (no canvas margin)
      tempCanvas.width = extendedAreaWidth * exportScale;
      tempCanvas.height = extendedAreaHeight * exportScale;
      
      // Scale for device pixel ratio and resolution multiplier
      tempCtx.scale(exportScale, exportScale);
      
      // Draw the extended area portion from the main canvas
      // Source: extended area region from main canvas
      // Destination: entire temp canvas (scaled up/down by resolutionMultiplier)
      tempCtx.drawImage(
        canvas,
        extendedAreaOffsetX * dpr, extendedAreaOffsetY * dpr, // Source x, y (scaled)
        extendedAreaWidth * dpr, extendedAreaHeight * dpr,     // Source width, height (scaled)
        0, 0,                                                   // Dest x, y
        extendedAreaWidth, extendedAreaHeight                  // Dest width, height
      );
      
      return tempCanvas.toDataURL('image/png');
    },
    getCanvasElement: () => canvasRef.current,
  }));

  // Memoize visual settings to prevent unnecessary re-renders
  const visualSettings = useMemo(() => ({
    backgroundColor,
    gridColor,
    tileOutlineColor,
    artboardOutlineColor,
  }), [backgroundColor, gridColor, tileOutlineColor, artboardOutlineColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Clear visible stitch instances FIRST to prevent memory accumulation
    visibleStitchInstancesRef.current.clear();
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio ?? 1;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Fill entire canvas background
    ctx.fillStyle = visualSettings.backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (showGrid) {
      // Draw artboard boundary (the area where pattern tiles are drawn)
      const artboardHex = visualSettings.artboardOutlineColor;
      const artboardR = parseInt(artboardHex.slice(1, 3), 16);
      const artboardG = parseInt(artboardHex.slice(3, 5), 16);
      const artboardB = parseInt(artboardHex.slice(5, 7), 16);
      const artboardA = artboardHex.length === 9 ? parseInt(artboardHex.slice(7, 9), 16) / 255 : 1;
      ctx.strokeStyle = `rgba(${artboardR}, ${artboardG}, ${artboardB}, ${artboardA})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.strokeRect(artboardOffset, artboardOffset, artboardWidth, artboardHeight);

      // Draw pattern tile boundaries (only within artboard and when repeat pattern is enabled)
      if (repeatPattern) {
        const tileHex = visualSettings.tileOutlineColor;
        const tileR = parseInt(tileHex.slice(1, 3), 16);
        const tileG = parseInt(tileHex.slice(3, 5), 16);
        const tileB = parseInt(tileHex.slice(5, 7), 16);
        const tileA = tileHex.length === 9 ? parseInt(tileHex.slice(7, 9), 16) / 255 : 1;
        ctx.strokeStyle = `rgba(${tileR}, ${tileG}, ${tileB}, ${tileA})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        // Use memoized tile dimensions
        for (let row = 0; row <= tilesY; row += 1) {
          for (let col = 0; col <= tilesX; col += 1) {
            const x = artboardOffset + (col * tilePixelWidth);
            const y = artboardOffset + (row * tilePixelHeight);
            if (x <= artboardOffset + artboardWidth && y <= artboardOffset + artboardHeight) {
              ctx.strokeRect(
                x, 
                y, 
                Math.min(tilePixelWidth, artboardWidth - col * tilePixelWidth), 
                Math.min(tilePixelHeight, artboardHeight - row * tilePixelHeight)
              );
            }
          }
        }
      }
    }

    // Draw grid dots across entire canvas (not just artboard)
    if (showGrid) {
      // Parse grid color - support both 6-char (#RRGGBB) and 8-char (#RRGGBBAA) hex
      const gridHex = visualSettings.gridColor;
      const gridR = parseInt(gridHex.slice(1, 3), 16);
      const gridG = parseInt(gridHex.slice(3, 5), 16);
      const gridB = parseInt(gridHex.slice(5, 7), 16);
      const gridA = gridHex.length === 9 ? parseInt(gridHex.slice(7, 9), 16) / 255 : 1;
      ctx.fillStyle = `rgba(${gridR}, ${gridG}, ${gridB}, ${gridA})`;
      // Use 2×2 pixel dots for all grid sizes
      const dotSize = 2;
      const dotOffset = dotSize / 2;
      for (let x = 0; x <= canvasGridWidth; x += 1) {
        for (let y = 0; y <= canvasGridHeight; y += 1) {
          const centerX = x * patternGridSize;
          const centerY = y * patternGridSize;
          ctx.fillRect(centerX - dotOffset, centerY - dotOffset, dotSize, dotSize);
        }
      }
    }

    const stitches = pattern?.stitches ?? [];

    ctx.lineCap = 'round'; // Use butt to get precise pixel alignment
    stitches.forEach((stitch) => {
      const colorOverride = stitchColors.get(stitch.id) ?? stitch.color ?? defaultStitchColor;
      
      // Check if this is a repeatable pattern line vs absolute positioned line
      // Pattern lines have start point WITHIN first tile (0 to tileSize.x/y)
      // tileSize represents cells per tile, valid pattern coords are 0 to tileSize (inclusive)
      // Note: Lines starting at tileSize boundary need special handling to avoid duplication
      const isPatternLine = stitch.repeat !== false &&
                           stitch.start.x >= 0 && stitch.start.x <= patternTileSize.x &&
                           stitch.start.y >= 0 && stitch.start.y <= patternTileSize.y;
      
      // Check if this line starts exactly at a tile boundary
      const startsAtBoundaryX = stitch.start.x === patternTileSize.x || stitch.start.x === 0;
      const startsAtBoundaryY = stitch.start.y === patternTileSize.y || stitch.start.y === 0;
      
      if (isPatternLine) {
        // Pattern line with repeat ON - render in all artboard tiles
        // Also render in outer tiles (-1 and tilesX/tilesY) for lines that cross into canvas padding
        for (let tileRow = -1; tileRow < tilesY + 1; tileRow++) {
          for (let tileCol = -1; tileCol < tilesX + 1; tileCol++) {
            // CORNER-SPECIFIC FIX: Lines from corners with negative coords going backward
            // These should NOT appear in the first row/col or corresponding outer tiles
            // Example: corner (0,0)→(0,-5) is vertical going UP
            //          → should appear in rows 1,2,3... and bottom outer tiles
            //          → should NOT appear in first row (0) or top outer tiles
            const startOnLeftEdge = stitch.start.x === 0;
            const startOnRightEdge = stitch.start.x === patternTileSize.x;
            const startOnTopEdge = stitch.start.y === 0;
            const startOnBottomEdge = stitch.start.y === patternTileSize.y;
            const startsAtNormalizedCorner = (startOnLeftEdge || startOnRightEdge) && (startOnTopEdge || startOnBottomEdge);
            
            const hasNegativeX = stitch.end.x < 0;
            const hasNegativeY = stitch.end.y < 0;
            
            const isInFirstRow = tileRow === 0;
            const isInFirstCol = tileCol === 0;
            const isInTopOuterTile = tileRow < 0;
            const isInLeftOuterTile = tileCol < 0;
            
            // Lines starting at top edge (y=0) going UP (negative Y): skip in first row and top outer tiles
            // These lines belong to the row below, so shift rendering down
            if (startOnTopEdge && hasNegativeY && (isInFirstRow || isInTopOuterTile)) {
              continue;
            }
            // Lines starting at left edge (x=0) going LEFT (negative X): skip in first col and left outer tiles  
            // These lines belong to the column to the right, so shift rendering right
            if (startOnLeftEdge && hasNegativeX && (isInFirstCol || isInLeftOuterTile)) {
              continue;
            }
            
            // Check if this is an outer tile (beyond the artboard, in the canvas padding)
            const isOuterTile = tileRow < 0 || tileRow >= tilesY || 
                                tileCol < 0 || tileCol >= tilesX;
            
            // BOUNDARY LINE HANDLING:
            // - Lines crossing boundaries OR running along boundaries: repeat in outer tiles in crossing/running direction
            // - Lines crossing corners: repeat 5x5 (all outer tiles)
            // - Lines just touching boundaries: repeat 4x4 (skip outer tiles)
            if (isOuterTile) {
              const startOnCorner = (startOnLeftEdge || startOnRightEdge) && (startOnTopEdge || startOnBottomEdge);
              const extendsRightBeyond = stitch.end.x > patternTileSize.x;
              const extendsBottomBeyond = stitch.end.y > patternTileSize.y;
              const isInLeftOuterTile = tileCol < 0;
              const isInTopOuterTile = tileRow < 0;
              // CORNER-SPECIFIC: Line starting at corner extending right: skip in right outer tiles
              if (startOnCorner && startOnRightEdge && extendsRightBeyond && isInRightOuterTile) {
                continue;
              }
              // CORNER-SPECIFIC: Line starting at corner extending down: skip in bottom outer tiles
              if (startOnCorner && startOnBottomEdge && extendsBottomBeyond && isInBottomOuterTile) {
                continue;
              }
              
              // A line crosses if BOTH start and end are not within normal tile bounds
              // OR if end extends beyond bounds and start is not on the boundary it's leaving from
              const startOnLeftBoundary = stitch.start.x === 0;
              const startOnRightBoundary = stitch.start.x === patternTileSize.x;
              const startOnTopBoundary = stitch.start.y === 0;
              const startOnBottomBoundary = stitch.start.y === patternTileSize.y;
              
              // If line goes slightly outside bounds (by 1), it's just touching boundary, not crossing
              // True crossing: goes outside by more than 1 grid cell
              const lineLength = Math.sqrt(Math.pow(stitch.end.x - stitch.start.x, 2) + Math.pow(stitch.end.y - stitch.start.y, 2));
              const justTouchingBoundary = lineLength <= 1.5; // Allow for diagonal (sqrt(2) ≈ 1.41)
              
              const crossesHorizontally = !justTouchingBoundary && (stitch.end.x < 0 || stitch.end.x > patternTileSize.x);
              const crossesVertically = !justTouchingBoundary && (stitch.end.y < 0 || stitch.end.y > patternTileSize.y);
              
              // A line runs along a boundary if BOTH endpoints are on the SAME boundary
              // AND the line doesn't move in that direction (vertical line has same X, horizontal line has same Y)
              const bothOnVerticalBoundary = 
                (stitch.start.x === 0 || stitch.start.x === patternTileSize.x) &&
                (stitch.end.x === 0 || stitch.end.x === patternTileSize.x) &&
                stitch.start.x === stitch.end.x &&
                stitch.start.y !== stitch.end.y; // Must move in Y direction (vertical line)
              
              const bothOnHorizontalBoundary = 
                (stitch.start.y === 0 || stitch.start.y === patternTileSize.y) &&
                (stitch.end.y === 0 || stitch.end.y === patternTileSize.y) &&
                stitch.start.y === stitch.end.y &&
                stitch.start.x !== stitch.end.x; // Must move in X direction (horizontal line)
              
              // Lines crossing horizontally OR running along vertical boundary: repeat in X direction (left/right outer tiles)
              const shouldRepeatInXDirection = crossesHorizontally || bothOnVerticalBoundary;
              
              // Lines crossing vertically OR running along horizontal boundary: repeat in Y direction (top/bottom outer tiles)
              const shouldRepeatInYDirection = crossesVertically || bothOnHorizontalBoundary;
              
              // Determine which outer tiles to render in
              const isLeftRightOuterTile = tileCol < 0 || tileCol >= tilesX;
              const isTopBottomOuterTile = tileRow < 0 || tileRow >= tilesY;
              
              // Skip this outer tile if line shouldn't repeat in this direction
              if (isLeftRightOuterTile && !shouldRepeatInXDirection) {
                continue;
              }
              if (isTopBottomOuterTile && !shouldRepeatInYDirection) {
                continue;
              }
            }
            
            // Calculate position within this specific tile
            const tileBaseX = tileCol * patternTileSize.x;
            const tileBaseY = tileRow * patternTileSize.y;
            
            // Pattern-relative coordinates + tile base = absolute position in this tile
            const startX = artboardOffset + ((stitch.start.x + tileBaseX) * patternGridSize);
            const startY = artboardOffset + ((stitch.start.y + tileBaseY) * patternGridSize);
            const endX = artboardOffset + ((stitch.end.x + tileBaseX) * patternGridSize);
            const endY = artboardOffset + ((stitch.end.y + tileBaseY) * patternGridSize);

            // Skip if line is completely outside canvas bounds
            if (startX > canvasWidth + patternGridSize || startY > canvasHeight + patternGridSize) {
              continue;
            }
            
            // For outer tiles (in canvas padding), only render if the line actually crosses into the artboard
            if (isOuterTile) {
              // Use memoized artboard boundaries
              // Check if this line segment intersects with the artboard area
              // A line intersects if any part of it is within [artboardStart, artboardEnd] for both x and y
              const lineMinX = Math.min(startX, endX);
              const lineMaxX = Math.max(startX, endX);
              const lineMinY = Math.min(startY, endY);
              const lineMaxY = Math.max(startY, endY);
              
              const intersectsArtboard = !(
                lineMaxX < artboardBounds.startPixelX ||
                lineMinX > artboardBounds.endPixelX ||
                lineMaxY < artboardBounds.startPixelY ||
                lineMinY > artboardBounds.endPixelY
              );
              
              if (!intersectsArtboard) {
                continue; // Skip - line doesn't touch the artboard from this outer tile
              }
            }

            const isSelected = selectedStitchIds.has(stitch.id);
            const stitchSizeForLine = stitch.stitchSize || 'small';
            const stitchWidthValue = stitch.stitchWidth || 'normal';
            const stitchGapSize = stitch.gapSize;
            const stitchGapOffset = calculateStitchOffset(stitchGapSize);

            // Render the stitch using shared rendering function
            const rendered = renderStitch(
              ctx,
              startX,
              startY,
              endX,
              endY,
              stitchGapOffset,
              stitchGapSize,
              stitchSizeForLine,
              stitchWidthValue,
              colorOverride ?? defaultStitchColor,
              isSelected,
              patternGridSize
            );

            // Track this visible instance for selection (if rendered successfully)
            if (rendered) {
              if (!visibleStitchInstancesRef.current.has(stitch.id)) {
                visibleStitchInstancesRef.current.set(stitch.id, []);
              }
              // Use array instead of object to reduce memory overhead
              visibleStitchInstancesRef.current.get(stitch.id).push([startX, startY, endX, endY]);
            }
          }
        }
      } else {
        // Absolute coordinates - non-repeating line at specific position
        const startX = artboardOffset + (stitch.start.x * patternGridSize);
        const startY = artboardOffset + (stitch.start.y * patternGridSize);
        const endX = artboardOffset + (stitch.end.x * patternGridSize);
        const endY = artboardOffset + (stitch.end.y * patternGridSize);

        if (startX > canvasWidth + patternGridSize || startY > canvasHeight + patternGridSize) {
          return;
        }

        const isSelected = selectedStitchIds.has(stitch.id);
        const stitchSizeForLine = stitch.stitchSize || 'small';
        const stitchWidthValue = stitch.stitchWidth || 'normal';
        const stitchGapSize = stitch.gapSize;
        const stitchGapOffset = calculateStitchOffset(stitchGapSize);

        // Render the stitch using shared rendering function
        const rendered = renderStitch(
          ctx,
          startX,
          startY,
          endX,
          endY,
          stitchGapOffset,
          stitchGapSize,
          stitchSizeForLine,
          stitchWidthValue,
          colorOverride ?? defaultStitchColor,
          isSelected,
          patternGridSize
        );

        // Track this visible instance for selection (if rendered successfully)
        if (rendered) {
          if (!visibleStitchInstancesRef.current.has(stitch.id)) {
            visibleStitchInstancesRef.current.set(stitch.id, []);
          }
          // Use array instead of object to reduce memory overhead
          visibleStitchInstancesRef.current.get(stitch.id).push([startX, startY, endX, endY]);
        }
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
      ctx.lineWidth = 1;
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
    artboardWidth,
    artboardHeight,
    artboardBounds,
    canvasGridWidth,
    canvasGridHeight,
    canvasWidth,
    canvasHeight,
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
    tilesX,
    tilesY,
    tilePixelWidth,
    tilePixelHeight,
    visualSettings, // Single memoized object instead of 6 separate dependencies
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
    // Use the visible instances computed during rendering
    const selectedIds = new Set();
    
    visibleStitchInstancesRef.current.forEach((instances, stitchId) => {
      // Check if any visible instance of this stitch intersects with selection
      for (const instance of instances) {
        // instance is [startX, startY, endX, endY]
        if (lineIntersectsRect(instance[0], instance[1], instance[2], instance[3], minX, minY, maxX, maxY)) {
          selectedIds.add(stitchId);
          break;
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
      
      // Use memoized tile dimensions
      const maxTileSize = Math.max(tilePixelWidth, tilePixelHeight);
      if (!lineIntersectsArtboard(startPixelX, startPixelY, endPixelX, endPixelY, artboardOffset, artboardOffset, artboardWidth, artboardHeight, maxTileSize)) {
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
      const lineIntersectsArtboardArea = !(
        (startGridX < 0 && endGridX < 0) ||
        (startGridY < 0 && endGridY < 0) ||
        (startGridX > artboardGridWidth && endGridX > artboardGridWidth) ||
        (startGridY > artboardGridHeight && endGridY > artboardGridHeight)
      );

      // When repeat is ON and line touches artboard, reduce coordinates to first tile pattern
      // For cross-tile lines, we keep the relative offset so they repeat correctly
      let finalStart, finalEnd;
      let shouldRepeat = false;
      
      if (repeatPattern && lineIntersectsArtboardArea) {
        // Reduce coordinates to the first tile while preserving cross-tile relationships
        // We want lines to stay within the pattern space (0 to patternTileSize.x/y) for their "base" position
        // But they can extend beyond that to represent cross-tile lines
        
        // Check if this is a boundary line (runs exactly along a tile edge)
        const isVerticalBoundaryLine = startGridX === endGridX && (startGridX % patternTileSize.x === 0);
        const isHorizontalBoundaryLine = startGridY === endGridY && (startGridY % patternTileSize.y === 0);
        
        if (isVerticalBoundaryLine || isHorizontalBoundaryLine) {
          // Boundary lines need special handling
          // Lines at tile multiples (x=10,20,30 with tileSizeX=10) should all map to the SAME boundary
          // We use modulo, but when result is 0 for non-zero input, we treat it as the boundary
          
          const normalizeBoundaryCoordX = (coord) => {
            const mod = coord % patternTileSize.x;
            // coord=0 -> 0 (left edge)
            // coord=10,20,30... -> 0 (these are all the same repeating boundary)
            return mod;
          };
          
          const normalizeBoundaryCoordY = (coord) => {
            const mod = coord % patternTileSize.y;
            // coord=0 -> 0 (top edge)
            // coord=10,20,30... -> 0 (these are all the same repeating boundary)
            return mod;
          };
          
          // Calculate the offset between start and end
          const dx = endGridX - startGridX;
          const dy = endGridY - startGridY;
          
          // Normalize the start point
          finalStart = {
            x: normalizeBoundaryCoordX(startGridX),
            y: normalizeBoundaryCoordY(startGridY),
          };
          
          // Apply the offset to get the end point
          finalEnd = {
            x: finalStart.x + dx,
            y: finalStart.y + dy,
          };
        } else {
          // Non-boundary lines: use floor-based normalization
          // Find which tile the START and END points are in
          const startTileX = Math.floor(startGridX / patternTileSize.x);
          const startTileY = Math.floor(startGridY / patternTileSize.y);
          const endTileX = Math.floor(endGridX / patternTileSize.x);
          const endTileY = Math.floor(endGridY / patternTileSize.y);
          
          // If start and end are in adjacent tiles (line just touches boundary),
          // normalize to the tile that contains the majority of the line
          // For lines going from boundary into tile, use the "inner" tile
          
          // Use the tile of whichever point is NOT on a boundary, or use end tile for ties
          const startOnBoundary = (startGridX % patternTileSize.x === 0) || (startGridY % patternTileSize.y === 0);
          const endOnBoundary = (endGridX % patternTileSize.x === 0) || (endGridY % patternTileSize.y === 0);
          
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
          const normalizedStartX = startGridX - (baseTileX * patternTileSize.x);
          const normalizedStartY = startGridY - (baseTileY * patternTileSize.y);
          const normalizedEndX = endGridX - (baseTileX * patternTileSize.x);
          const normalizedEndY = endGridY - (baseTileY * patternTileSize.y);
          
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

    // Use visible stitch instances from rendering for click selection
    // This ensures selection matches exactly what's visible on screen
    let closest = null;
    let closestDistance = SELECT_THRESHOLD;

    visibleStitchInstancesRef.current.forEach((instances, stitchId) => {
      // Check each visible instance of this stitch for proximity to click
      for (const instance of instances) {
        // instance is [startX, startY, endX, endY]
        const distance = distancePointToSegment(
          clickX, clickY, 
          instance[0], instance[1], 
          instance[2], instance[3]
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = stitchId;
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
      width={canvasWidth}
      height={canvasHeight}
      className={`mx-auto ${getCursorClass()}`}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
});
