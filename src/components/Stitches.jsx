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

// Gap size between stitches (in pixels)
export const DEFAULT_GAP_SIZE = 9; // Space between adjacent dashes

// Stitch offset from grid points (in pixels)
// This is calculated as gapSize / 2 to center gaps on grid dots
export const calculateStitchOffset = (gapSize) => gapSize / 2;

// Default stitch appearance settings
export const DEFAULT_STITCH_COLOR = '#f5f5f5'; // Light gray color for stitches
export const DEFAULT_STITCH_SIZE = 'medium';
export const DEFAULT_STITCH_WIDTH = 'normal';
export const DEFAULT_SELECTED_COLOR = '#0000FF'; // Blue color for selected stitches

export const STITCH_DEFAULTS = {
  size: DEFAULT_STITCH_SIZE,
  width: DEFAULT_STITCH_WIDTH,
  color: DEFAULT_STITCH_COLOR,
  gapSize: DEFAULT_GAP_SIZE,
  selectedColor: DEFAULT_SELECTED_COLOR
};

// ===================================
// STITCH CALCULATION FUNCTIONS
// ===================================

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
  gridSize
) {
  const dx = endX - startX;
  const dy = endY - startY;
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
