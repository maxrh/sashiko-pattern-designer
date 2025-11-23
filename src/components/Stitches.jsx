import { 
  DEFAULT_GAP_SIZE,
  DEFAULT_STITCH_COLOR,
  DEFAULT_STITCH_SIZE,
  DEFAULT_STITCH_WIDTH,
  DEFAULT_SELECTED_COLOR,
} from '../hooks/useUiState.js';

// ===================================
// STITCH APPEARANCE CONFIGURATION
// ===================================

// Minimum dash lengths (in pixels) - below these, dash count is reduced
export const MIN_DASH_LENGTHS = {
  small: 1,   // Small stitches can be very fine (1px minimum)
  medium: 11, // 
  large: 21   // 
};

// Stitch size ratios (dashes per grid cell)
export const STITCH_SIZE_RATIOS = {
  small: 2,    // 2 dashes per grid cell
  medium: 1.5, // 1.5 dashes per grid cell (between small and large)
  large: 1     // Uses medium calculation, then merges pairs into super dashes
};

// Stitch line widths (in pixels)
export const STITCH_WIDTHS = {
  thin: 2,
  normal: 3,
  thick: 4
};

// Stitch offset from grid points (in pixels)
// This is calculated as gapSize / 2 to center gaps on grid dots
export const calculateStitchOffset = (gapSize) => gapSize / 2;

export const STITCH_DEFAULTS = {
  size: DEFAULT_STITCH_SIZE,
  width: DEFAULT_STITCH_WIDTH,
  color: DEFAULT_STITCH_COLOR,
  gapSize: DEFAULT_GAP_SIZE,
  selectedColor: DEFAULT_SELECTED_COLOR,
  curvature: 0
};

// ===================================
// STITCH CALCULATION FUNCTIONS
// ===================================

// Calculate circle parameters from start, end, and bulge (curvature)
export function getArcParams(x1, y1, x2, y2, bulge) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const chordLength = Math.hypot(dx, dy);
  
  if (chordLength === 0 || Math.abs(bulge) < 0.1) return null; // Treat as straight

  // Radius R = ( (L/2)^2 + b^2 ) / (2|b|)
  const radius = (Math.pow(chordLength / 2, 2) + Math.pow(bulge, 2)) / (2 * Math.abs(bulge));

  // Midpoint of chord
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  
  // Distance from chord midpoint to center
  // dist = R - |b| (if bulge < radius)
  const distToCenter = radius - Math.abs(bulge);
  
  // Normal vector to chord (rotated 90 degrees)
  const nx = -dy / chordLength;
  const ny = dx / chordLength;
  
  // Determine center position
  // If bulge > 0, center is on one side; if < 0, on the other
  const sign = bulge > 0 ? 1 : -1;
  
  // If bulge is "small" (minor arc), center is away from bulge
  // If bulge is "large" (major arc), center is towards bulge
  const centerDir = Math.abs(bulge) > radius ? sign : -sign;
  
  const cx = mx + nx * distToCenter * centerDir;
  const cy = my + ny * distToCenter * centerDir;
  
  // Calculate start and end angles
  const startAngle = Math.atan2(y1 - cy, x1 - cx);
  const endAngle = Math.atan2(y2 - cy, x2 - cx);
  
  // Determine direction
  // If bulge > 0, we want the arc on the "left" of the vector start->end (counter-clockwise)
  const counterClockwise = bulge > 0;
  
  return { cx, cy, radius, startAngle, endAngle, counterClockwise };
}

// Calculate dash and gap lengths for stitches with intelligent sizing
// Returns { dashLength, gapLength } based on stitch size, line length, and gap settings
export function calculateStitchDashPattern(drawableLength, lineLength, stitchSize, gapBetweenStitches, gridSize) {
  // Calculate target dash count based on stitch size and actual line length
  const actualCellsInLine = lineLength / gridSize; // How many grid cells in the actual line
  
  // For large, we use medium calculation as base
  const isLarge = stitchSize === 'large';
  const sizeForCalc = isLarge ? 'medium' : stitchSize;
  
  let targetDashCount;
  switch (sizeForCalc) {
    case 'small':
      // Small: use small ratio from config
      targetDashCount = Math.max(2, Math.round(actualCellsInLine * STITCH_SIZE_RATIOS.small));
      break;
    case 'medium':
    default:
      // Medium: use medium ratio from config
      targetDashCount = Math.max(1, Math.round(actualCellsInLine * STITCH_SIZE_RATIOS.medium));
      break;
  }
  
  // Calculate dash and gap lengths with automatic dash count reduction when dashes become too small
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
    let superDashCount = targetDashCount / 2;
    
    // Reduce dash count if dashes would be too small
    while (superDashCount > 1) {
      const gapCount = superDashCount - 1;
      const totalGapSpace = gapCount * gapBetweenStitches;
      const totalDashSpace = drawableLength - totalGapSpace;
      const testDashLength = totalDashSpace / superDashCount;
      
      if (testDashLength >= MIN_DASH_LENGTHS.large) break;
      
      // Reduce by 1 super dash (which is 2 regular dashes)
      superDashCount -= 1;
      targetDashCount = superDashCount * 2;
    }
    
    const gapCount = superDashCount - 1;
    const totalGapSpace = gapCount * gapBetweenStitches;
    const totalDashSpace = drawableLength - totalGapSpace;
    
    dashLength = totalDashSpace / superDashCount;
    gapLength = gapBetweenStitches;
  } else if (stitchSize === 'medium') {
    // Medium: uses 1.5 cells per gap ratio
    
    // Reduce dash count if dashes would be too small
    while (targetDashCount > 1) {
      const gapCount = targetDashCount - 1;
      const totalGapSpace = gapCount * gapBetweenStitches;
      const totalDashSpace = drawableLength - totalGapSpace;
      const testDashLength = totalDashSpace / targetDashCount;
      
      if (testDashLength >= MIN_DASH_LENGTHS.medium) break;
      
      targetDashCount -= 1;
    }
    
    const gapCount = targetDashCount - 1;
    const totalGapSpace = gapCount * gapBetweenStitches;
    const totalDashSpace = drawableLength - totalGapSpace;
    dashLength = totalDashSpace / targetDashCount;
    gapLength = gapBetweenStitches;
  } else {
    // Small: use minimum from config
    
    // Reduce dash count if dashes would be too small
    while (targetDashCount > 1) {
      const gapCount = targetDashCount - 1;
      const totalGapSpace = gapCount * gapBetweenStitches;
      const totalDashSpace = drawableLength - totalGapSpace;
      const testDashLength = totalDashSpace / targetDashCount;
      
      if (testDashLength >= MIN_DASH_LENGTHS.small) break;
      
      targetDashCount -= 1;
    }
    
    const gapCount = targetDashCount - 1;
    const totalGapSpace = gapCount * gapBetweenStitches;
    const totalDashSpace = drawableLength - totalGapSpace;
    dashLength = totalDashSpace / targetDashCount;
    gapLength = gapBetweenStitches;
  }
  
  return { dashLength, gapLength };
}

// Calculate line width based on stitchWidth property
export function calculateLineWidth(stitchWidth) {
  return STITCH_WIDTHS[stitchWidth] || STITCH_WIDTHS.normal;
}

// Render a single stitch instance on the canvas
export function renderStitch(
  ctx, 
  startX, 
  startY, 
  endX, 
  endY, 
  stitchOffset,
  gapBetweenStitches,
  stitchSizeForLine,
  stitchWidthValue,
  colorOverride,
  isSelected,
  gridSize,
  curvature = 0
) {
  // Calculate bulge from curvature percentage
  // curvature is percentage of chord length (e.g. 25 for 25%)
  const dx = endX - startX;
  const dy = endY - startY;
  const chordLength = Math.hypot(dx, dy);
  const bulge = chordLength * (curvature / 100);

  // Check if we should draw an arc
  const arcParams = getArcParams(startX, startY, endX, endY, bulge);

  if (arcParams) {
    // === DRAW ARC ===
    const { cx, cy, radius, startAngle, endAngle, counterClockwise } = arcParams;
    
    // Calculate angular offset for the gaps at ends
    // Arc Length S = R * theta -> theta = S / R
    const angleOffset = stitchOffset / radius;
    
    // Apply offset to angles (shorten the arc)
    // Direction depends on counterClockwise
    const direction = counterClockwise ? -1 : 1;
    const offsetStartAngle = startAngle + (angleOffset * direction);
    const offsetEndAngle = endAngle - (angleOffset * direction);
    
    // Calculate drawable arc length
    // Total angle difference
    let angleDiff = offsetEndAngle - offsetStartAngle;
    // Normalize angle diff
    if (counterClockwise && angleDiff > 0) angleDiff -= 2 * Math.PI;
    if (!counterClockwise && angleDiff < 0) angleDiff += 2 * Math.PI;
    
    const drawableLength = Math.abs(angleDiff * radius);
    const totalLength = drawableLength + (2 * stitchOffset); // Approx
    
    // Calculate dash and gap pattern
    const { dashLength, gapLength } = calculateStitchDashPattern(
      drawableLength, 
      totalLength, 
      stitchSizeForLine, 
      gapBetweenStitches,
      gridSize
    );
    
    if (dashLength <= 0) return false;

    const lineWidth = calculateLineWidth(stitchWidthValue);

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([dashLength, gapLength]);
    ctx.strokeStyle = isSelected ? DEFAULT_SELECTED_COLOR : colorOverride;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.arc(cx, cy, radius, offsetStartAngle, offsetEndAngle, counterClockwise);
    
    ctx.stroke();
    ctx.restore();
    return true;
  }

  // === DRAW STRAIGHT LINE ===
  // dx and dy are already calculated at the top of the function
  const length = Math.hypot(dx, dy);
  if (length === 0) return false;

  const unitX = dx / length;
  const unitY = dy / length;

  // Offset start and end along the line
  const offsetStartX = startX + unitX * stitchOffset;
  const offsetStartY = startY + unitY * stitchOffset;
  const offsetEndX = endX - unitX * stitchOffset;
  const offsetEndY = endY - unitY * stitchOffset;

  // Calculate the drawable length (after removing offsets)
  const drawableLength = length - (2 * stitchOffset);

  // Calculate dash and gap pattern
  const { dashLength, gapLength } = calculateStitchDashPattern(
    drawableLength, 
    length, 
    stitchSizeForLine, 
    gapBetweenStitches,
    gridSize
  );
  
  // Only draw if dash length is positive (line is long enough)
  if (dashLength <= 0) return false;

  // Calculate line width
  const lineWidth = calculateLineWidth(stitchWidthValue);

  // Render the stitch
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([dashLength, gapLength]);
  ctx.strokeStyle = isSelected ? DEFAULT_SELECTED_COLOR : colorOverride;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(offsetStartX, offsetStartY);
  ctx.lineTo(offsetEndX, offsetEndY);
  ctx.stroke();
  ctx.restore();

  return true; // Successfully rendered
}
