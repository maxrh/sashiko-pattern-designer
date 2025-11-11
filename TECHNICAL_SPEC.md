# Sashiko App - Technical Specification

> **⚠️ CRITICAL: DO NOT UPDATE THIS DOCUMENT WITHOUT EXPLICIT USER PERMISSION**
> 
> This is a living documentation file. Only update it when the user explicitly asks you to document changes or review the spec. Do not automatically update it after making code changes.

## Technology Stack

### Core Framework
- **Astro** v5.15.3 - Static site framework
- **React** v19.2.0 - UI library
- **Tailwind CSS** v4.1.16 - Utility-first CSS framework

### UI & Icons
- **Custom UI Components** - Hand-built shadcn-style components in `src/components/ui/`
- **Icons** - Using `lucide-react` package (v0.552.0)
  - Reference: [Lucide Icons](https://lucide.dev/)
  - Implementation: Import icons from package: `import { Edit3, Hand } from 'lucide-react'`
  - Package dependency in package.json

### Data Persistence
- **Local Storage API** - Browser-native storage for auto-save and pattern library
- **JSON Export/Import** - Pattern file format for sharing

## Constants & Configuration

### Fixed Values
- **Canvas Size**: Dynamic (calculated: artboard size + 2 × `CANVAS_MARGIN_CELLS` × gridSize)
- **Canvas Margin**: `CANVAS_MARGIN_CELLS` grid cells on all sides
- **Grid Size**: `DEFAULT_GRID_SIZE` pixels per grid cell (configurable)
- **Stitch Offset**: `calculateStitchOffset(gapSize)` where calculation = `gapSize / 2`
- **Gap Between Stitches**: `DEFAULT_GAP_SIZE` pixels
- **Snap Threshold**: `SNAP_THRESHOLD` pixels for grid snapping
- **Selection Threshold**: `SELECT_THRESHOLD` pixels for click selection
- **Drag Threshold**: 5×5 pixels minimum to count as drag (vs click)
- **Grid Dot Radius**: `DOT_RADIUS` pixels
- **Device Pixel Ratio**: window.devicePixelRatio for high-DPI displays

### Default Values
- **Pattern Grid Size**: `DEFAULT_GRID_SIZE` pixels per cell (configurable per pattern)
  - **CRITICAL**: gridSize represents number of CELLS per tile in tileSize (e.g., tileSize.x = 10 means 10 cells)
  - Example: tileSize 10 = 10 cells = 11 grid points (0 through 10)
  - Valid coordinate range: 0 to tileSize (inclusive, 0-10 for tileSize 10)
  - Each tile spans exactly tileSize cells
- **Pattern Tiles**: `DEFAULT_PATTERN_TILES` (configurable)
- **Stitch Colors**: `DEFAULT_STITCH_COLOR` for new stitches
- **Stitch Size**: `DEFAULT_STITCH_SIZE`
- **Stitch Width**: `DEFAULT_STITCH_WIDTH`
- **Gap Size**: `DEFAULT_GAP_SIZE` pixels between stitches
- **Repeat Pattern**: `DEFAULT_REPEAT_PATTERN`
- **Background Color**: `DEFAULT_BACKGROUND_COLOR`
- **Grid Color**: `DEFAULT_GRID_COLOR` (with alpha channel)
- **Tile Outline Color**: `DEFAULT_TILE_OUTLINE_COLOR` (with alpha channel)
- **Artboard Outline Color**: `DEFAULT_ARTBOARD_OUTLINE_COLOR` (with alpha channel)
- **Show Grid**: `DEFAULT_SHOW_GRID`

## Canvas System

### Canvas Structure (UPDATED)
- **Canvas Size**: Dynamic, calculated based on artboard + margins
- **Canvas Margin**: `CANVAS_MARGIN_CELLS` grid cells on all sides of artboard
- **Artboard**: Centered in canvas, size depends on pattern tiles × tileSize × gridSize
  - Example: 5×5 tiles with 10×10 grid cells and 20px grid size = 1000×1000px artboard
- **Extended Area**: 1 tile margin on all sides for cross-boundary line visibility
  - Example: 5×5 artboard has visual space for 6×6 area (with tile margins)
  - Only shows portions of repeating lines that cross from real artboard into margin
  - Cannot initiate drawing from margin area - drawing must start within artboard

### Terminology (CRITICAL)
- **Canvas**: The entire grid area where drawing happens (includes artboard + `CANVAS_MARGIN_CELLS` cell margin)
- **Artboard**: The total area of pattern tiles we draw inside (the actual pattern area)
- **Grid Cell**: A single cell in the grid (size controlled by gridSize parameter in pixels)
- **Grid Point**: Intersection points where grid cells meet (where stitches can connect)

### Coordinate System
- **Canvas Grid Coordinates**: Absolute position on entire dynamic canvas
- **Artboard-Relative Coordinates**: Relative to artboard top-left corner
  - Can be negative (in left/top margins)
  - Can exceed artboard size (in right/bottom margins)
- **Pattern-Relative Coordinates**: Normalized to single tile (0 to patternTileSize)
  - Used for repeated lines that tile across the artboard

#### Shared Boundary Coordinates (CRITICAL)
Tile boundaries are **shared** between adjacent tiles:
- **y=0** is the top boundary of tile row 0 AND the bottom boundary of tile row -1
- **y=10** (tileSize) is the bottom boundary of tile row 0 AND the top boundary of tile row 1
- **x=0** is the left boundary of tile col 0 AND the right boundary of tile col -1
- **x=10** (tileSize) is the right boundary of tile col 0 AND the left boundary of tile col 1

**Coordinate Normalization for Shared Boundaries:**
When a line is drawn on the canvas crossing a shared boundary, the system normalizes it to avoid duplication:
- Lines starting at **y=0** with **negative Y** (going upward) are normalized to y=0 with negative end
  - Example: Canvas line from (5, bottom) to (10, middle) → normalized to (5,0) to (10,-5)
  - These lines belong to the tiles BELOW, not the first row
- Lines starting at **x=0** with **negative X** (going leftward) are normalized to x=0 with negative end
  - Example: Canvas line from (right, 5) to (middle, 10) → normalized to (0,5) to (-5,10)
  - These lines belong to the tiles to the RIGHT, not the first column

**Rendering Shift for Shared Boundary Lines:**
Lines that start on a shared boundary with negative direction skip the first row/column:
- **y=0 with negative Y**: Skip tile row 0 and top outer tile (row -1)
  - Renders in rows 1, 2, 3 (artboard) + bottom outer tile
  - Result: 4x4 grid shifted down by one row
- **x=0 with negative X**: Skip tile col 0 and left outer tile (col -1)
  - Renders in cols 1, 2, 3 (artboard) + right outer tile
  - Result: 4x4 grid shifted right by one column

This ensures lines on shared boundaries only render once at their actual position, not duplicated across adjacent tiles.

### Canvas Size Calculation (UPDATED)
```javascript
const CANVAS_MARGIN_CELLS = 40; // 40 grid cells of margin around artboard
const patternGridSize = pattern?.gridSize ?? 20; // Pixel size per grid cell

// Artboard = the total area containing all pattern tiles
const artboardSize = patternTiles * patternTileSize * patternGridSize;

// Canvas = artboard + 40 grid cells margin on all sides
const canvasMarginPixels = CANVAS_MARGIN_CELLS * patternGridSize;
const canvasSize = artboardSize + (2 * canvasMarginPixels);

// Artboard is centered in canvas (offset by margin)
const artboardOffset = canvasMarginPixels;
```

**Example**: 4×4 tiles with tileSize 10, gridSize 20px
- Each tile = 10 cells × 20px = 200px
- Artboard = 4 tiles × 200px = 800px
- Canvas margin = 40 cells × 20px = 800px
- Canvas size = 800px + (2 × 800px) = 2400px
- Artboard offset = 800px (centered)

**Example**: 5×5 tiles with tileSize 10, gridSize 10px
- Each tile = 10 cells × 10px = 100px
- Artboard = 5 tiles × 100px = 500px
- Canvas margin = 40 cells × 10px = 400px
- Canvas size = 500px + (2 × 400px) = 1300px
- Artboard offset = 400px (centered)

### Extended Margin Area (CRITICAL BEHAVIOR)

**The 1-tile extended area around the artboard allows bidirectional drawing with the artboard.**

#### Purpose:
- Shows continuations of lines that cross artboard boundaries
- Allows users to see how their pattern repeats at the edges
- Enables drawing lines that span from artboard into extended area or vice versa

#### Constraints:
- ✅ **Can draw FROM** inside artboard TO extended area (1-tile margin)
- ✅ **Can draw FROM** extended area TO inside artboard
- ❌ **Cannot draw in** canvas margin area (the 40-cell area beyond extended tiles)
- ✅ Lines that cross artboard boundaries repeat when repeat mode is ON
- ❌ Lines entirely in extended area (not crossing artboard) do NOT repeat

#### Key Behavior:
- **Repeat Mode ON**: Only lines that intersect the artboard boundaries will repeat across tiles
- **Repeat Mode OFF**: Lines appear only where drawn, regardless of location
- **Extended area purpose**: Visual feedback for pattern continuity, not independent drawing space

#### Implementation:
```javascript
// In rendering loop, for outer tiles (tileRow/Col < 0 or >= tilesPerSide):
const isOuterTile = tileRow < 0 || tileRow >= tilesY || 
                    tileCol < 0 || tileCol >= tilesX;

if (isOuterTile) {
  // Boundary line filtering logic (see Tile Boundary Handling section)
  // ... shouldRepeatInXDirection, shouldRepeatInYDirection checks ...
  
  // Only render if line's bounding box intersects the artboard
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
    continue; // Skip - line doesn't touch artboard from this outer tile
  }
}
```

## Stitch/Line System

### Stitch Data Structure
```javascript
{
  id: string,              // Unique identifier
  start: { x, y },         // Start point coordinates (0 to gridSize for pattern lines)
  end: { x, y },          // End point coordinates (can exceed gridSize for cross-tile lines)
  color: string,          // Optional color override
  stitchSize: string,     // 'medium' | 'large' | 'xlarge'
  repeat: boolean         // Whether to repeat across tiles
}
```

### Pattern Data Storage (patterns.json)

**Pattern Definition:**
```javascript
{
  id: string,              // Pattern identifier (e.g., "asanoha")
  name: string,            // Display name
  description: string,     // Pattern description
  tileSize: {x, y},        // Grid cells per tile (e.g., {x:10, y:10})
  gridSize: number,        // Pixel size per grid cell (e.g., 20 = 20px per cell)
  patternTiles: {x, y},    // Number of times pattern repeats (e.g., {x:4, y:4})
  stitches: [...]          // Array of stitch definitions
}
```

**Coordinate System:**
- **tileSize**: Must be `{x, y}` object format - defines grid cells per tile dimension
- **gridSize**: Pixel size of each grid cell (e.g., 20 = 20px per cell)
- **patternTiles**: Must be `{x, y}` object format - how many times pattern repeats on artboard
- **Grid Points**: tileSize + 1 points per dimension (e.g., tileSize 10 has points 0-10, spanning 10 cells)
- **Valid Coordinates**: 0 to tileSize (inclusive) for pattern lines
- **Boundary Points**: 
  - Coordinate 0 = left/top edge of tile (shared with previous tile's coordinate tileSize)
  - Coordinate tileSize = right/bottom edge of tile (shared with next tile's coordinate 0)

**Example - Asanoha Pattern:**
```javascript
{
  "id": "asanoha",
  "name": "Asanoha",
  "tileSize": {"x":12,"y":20},
  "gridSize": 13,
  "patternTiles": {"x":4,"y":2},
  "stitches": [
    { "start": { "x": 0, "y": 0 }, "end": { "x": 0, "y": 7 }, "repeat": true },
    { "start": { "x": 6, "y": 10 }, "end": { "x": 0, "y": 7 }, "repeat": true },
    { "start": { "x": 6, "y": 10 }, "end": { "x": 12, "y": 7 }, "repeat": true }
    // ... more stitches
  ]
}
```
- Grid points range: 0-12 in X (13 points), 0-20 in Y (21 points)
- Tile size: 12×20 grid cells
- Pattern repeats: 4×2 (4 columns, 2 rows)
- All lines repeat across tiles since repeat: true

### Coordinate Storage Logic

#### When Drawing a Line:

**Line Direction (Anchor Point):**
- Each endpoint is normalized to its tile coordinates [0, tileSize]
- Distance from each normalized point to tile origin (0,0) is calculated
- Whichever point is closer to its tile origin becomes the anchor (start point)
- This ensures consistent normalization behavior across all tiles and drawable areas
- Guarantees start point always normalizes cleanly to [0, tileSize] range

**Repeat Mode ON + Line touches artboard:**
- Calculate distance of each endpoint to its tile origin
- Swap start/end if needed so closer-to-origin point is the anchor
- Normalize START point by subtracting tile offset: `startGridX - (startTileX * patternGridSize)`
- Calculate dx/dy offset from start to end
- Apply offset to normalized start to get end: `normalizedStart + dx`
- Set `repeat: true`
- Result: Line appears in ALL tiles of the artboard + outer tiles where it crosses boundaries
- Works for both single-tile and cross-tile lines
- Cross-tile lines preserve direction (end coordinate can exceed patternGridSize-1)

**Repeat Mode ON + Line entirely in margin:**
- Store absolute artboard coordinates
- Set `repeat: false`
- Result: Line appears only where drawn (no repeat)

**Repeat Mode OFF:**
- Store absolute artboard coordinates
- Set `repeat: false`
- Result: Line appears only where drawn

### Rendering Logic

**Pattern Line Detection:**
```javascript
const isPatternLine = stitch.repeat !== false &&
                     stitch.start.x >= 0 && stitch.start.x <= patternGridSize &&
                     stitch.start.y >= 0 && stitch.start.y <= patternGridSize;
```

#### Pattern Lines (start point in [0, patternGridSize], repeat !== false):
- Render in all artboard tiles (0 to tilesPerSide-1)
- Also render in outer margin tiles (-1 and tilesPerSide) with special filtering:
  - **Boundary Duplication Prevention**: Lines touching tile boundaries (coordinates 0 or gridSize) are NOT rendered in outer tiles
  - This prevents duplication since boundary points are shared between adjacent tiles
  - Lines with start/end at coordinate 0 or gridSize are filtered: `if (isOuterTile && (start/end at 0 or gridSize)) continue;`
  - Lines not touching boundaries still render in outer tiles if they intersect the artboard
- Loop: `for (tileRow = -1; tileRow < tilesPerSide + 1; tileRow++)`
- Position calculation: `artboardOffset + ((stitch.start.x + tileBaseX) * cellSize)`
  - tileBaseX/Y = tileCol/Row * patternGridSize
- Note: End coordinates can exceed patternGridSize for cross-tile lines

#### Non-Pattern Lines (any coordinate < 0 or > patternGridSize, or repeat === false):
- Render once at absolute artboard-relative position
- Position calculation: `artboardOffset + (stitch.start.x * cellSize)`
- No tiling or repetition

### Tile Boundary Handling (CRITICAL BEHAVIOR - UPDATED)

**Tile boundaries are SHARED grid points between adjacent tiles.**

#### Boundary Semantics:
- **Coordinate 0**: Left/top boundary of tile (same physical point as coordinate `tileSize` of previous tile)
- **Coordinate tileSize**: Right/bottom boundary of tile (same physical point as coordinate 0 of next tile)
- **Example with tileSize 10**:
  - Tile 0 spans grid points 0-10 (absolute positions 0-10)
  - Tile 1 spans grid points 0-10 (absolute positions 10-20)
  - Grid point at coordinate 10 in tile 0 = grid point at coordinate 0 in tile 1
  - Physical location: absolute position 10

#### Boundary Line Handling (UPDATED - Final with Corner Fix):

**The system distinguishes between four types of boundary-related lines:**

1. **Corner Lines Going Backward** (SPECIAL CASE): Start at corner with negative end coordinates
   - Corner position: Both x AND y are 0 or patternTileSize (e.g., (0,0), (10,0), (0,10), (10,10))
   - Going backward: End coordinate is negative (e.g., end.x < 0 or end.y < 0)
   - Examples:
     - Vertical from corner going UP: (0,0)→(0,-5) normalized to (0,0)→(0,-5)
     - Horizontal from corner going LEFT: (0,0)→(-4,0) normalized to (0,0)→(-4,0)
   - **CRITICAL FIX**: These lines were incorrectly appearing in first row/col due to boundary detection
   - **Behavior**: Skip in first row/col and corresponding outer tiles
     - Vertical (negative Y): Skip in tileRow === 0 and tileRow < 0
     - Horizontal (negative X): Skip in tileCol === 0 and tileCol < 0
     - Appear in all other tiles (rows 1,2,3... and bottom/right extended areas)
   - **Why**: Lines going backward from corner wrap around to opposite edge, should not duplicate at origin

2. **Lines Running Along Boundaries**: Both start and end on the SAME boundary
   - Vertical boundary line: `start.x === end.x && (x === 0 || x === patternTileSize)`
   - Horizontal boundary line: `start.y === end.y && (y === 0 || y === patternTileSize)`
   - **Behavior**: Repeat in perpendicular direction only
     - Vertical boundary → repeats in left/right outer tiles (5x in X direction on 4x4 board)
     - Horizontal boundary → repeats in top/bottom outer tiles (5x in Y direction on 4x4 board)

3. **Lines Crossing Tile Boundaries**: Endpoint extends beyond tile bounds
   - Detected by: End coordinate outside [0, tileSize] range (e.g., end.x < 0 or end.x > tileSize)
   - Example: (5,5) to (11,5) - end.x exceeds patternTileSize
   - **Behavior**: Repeat in ALL outer tiles in the crossing direction (5x5 if crossing both X and Y)

4. **Lines Entirely Within Tile**: Start and end both within [0, tileSize] range
   - Detected by: Both start and end coordinates within tile bounds, not running along boundary
   - Examples:
     - (5,5) to (7,8) - regular internal line
     - (9,10) to (10,9) - diagonal touching two boundaries but contained within tile
   - **Behavior**: Repeat normally in artboard tiles only (4x4 on 4x4 artboard, skip all outer tiles)


**Detection Logic:**
```javascript
// BEFORE entering outer tile checks - applies to ALL tiles
// CORNER-SPECIFIC FIX: Lines from corners with negative coords
const startOnLeftEdge = stitch.start.x === 0;
const startOnRightEdge = stitch.start.x === patternTileSize;
const startOnTopEdge = stitch.start.y === 0;
const startOnBottomEdge = stitch.start.y === patternTileSize;
const startsAtNormalizedCorner = (startOnLeftEdge || startOnRightEdge) && 
                                 (startOnTopEdge || startOnBottomEdge);

const hasNegativeX = stitch.end.x < 0;
const hasNegativeY = stitch.end.y < 0;

const isInFirstRow = tileRow === 0;
const isInFirstCol = tileCol === 0;
const isInTopOuterTile = tileRow < 0;
const isInLeftOuterTile = tileCol < 0;

// Vertical line from corner going UP: skip in first row and top outer tiles
if (startsAtNormalizedCorner && startOnTopEdge && hasNegativeY && 
    (isInFirstRow || isInTopOuterTile)) {
  continue;
}
// Horizontal line from corner going LEFT: skip in first col and left outer tiles
if (startsAtNormalizedCorner && startOnLeftEdge && hasNegativeX && 
    (isInFirstCol || isInLeftOuterTile)) {
  continue;
}

// THEN for outer tiles only:
if (isOuterTile) {
  // A line ACTUALLY CROSSES a tile boundary if the endpoint goes outside [0, tileSize]
  // This is different from just touching a boundary point
  const crossesHorizontally = stitch.end.x < 0 || stitch.end.x > patternTileSize.x;
  const crossesVertically = stitch.end.y < 0 || stitch.end.y > patternTileSize.y;
  
  // Detect lines running along boundaries (both endpoints on SAME boundary)
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
  
  // Determine which directions should repeat in outer tiles
  const shouldRepeatInXDirection = crossesHorizontally || bothOnVerticalBoundary;
  const shouldRepeatInYDirection = crossesVertically || bothOnHorizontalBoundary;
  
  const isLeftRightOuterTile = tileCol < 0 || tileCol >= tilesPerSide;
  const isTopBottomOuterTile = tileRow < 0 || tileRow >= tilesPerSide;
  
  // Skip outer tile if line shouldn't repeat in this direction
  if (isLeftRightOuterTile && !shouldRepeatInXDirection) continue;
  if (isTopBottomOuterTile && !shouldRepeatInYDirection) continue;
}
```

**Normalization Logic for Boundary-Touching Lines (UPDATED):**

When storing a line that starts on a boundary and goes inward (regardless of length), the system normalizes to the tile that contains the END point (the "inner" tile) to ensure correct repeat positioning:

```javascript
// Detect if line is going from boundary inward
const startOnBoundary = (startGridX % patternTileSize === 0) || 
                       (startGridY % patternTileSize === 0);
const endOnBoundary = (endGridX % patternTileSize === 0) || 
                     (endGridY % patternTileSize === 0);

let baseTileX, baseTileY;
if (startOnBoundary && !endOnBoundary) {
  // Start on boundary, end inside - use END's tile for normalization
  // This works regardless of line length (1 cell, 2 cells, 3 cells, etc.)
  baseTileX = Math.floor(endGridX / patternTileSize);
  baseTileY = Math.floor(endGridY / patternTileSize);
} else {
  // Normal case: use START's tile
  baseTileX = Math.floor(startGridX / patternTileSize);
  baseTileY = Math.floor(startGridY / patternTileSize);
}

// Normalize both points to the chosen base tile
const normalizedStartX = startGridX - (baseTileX * patternTileSize);
const normalizedEndX = endGridX - (baseTileX * patternTileSize);
```

**Key Fix**: Removed the `lineLength <= 1.5` restriction. The normalization now works for ANY line that starts on a boundary and ends inside a tile, regardless of how long the line is (1 cell, 2 cells, 3 cells, etc.).

**Examples (tileSize 10, 4×4 artboard):**

1. **Corner line going UP** (0,0) to (0,-5):
   - Starts at corner (0,0), end.y = -5 (negative) → corner going backward
   - **FILTERED** from row 0 and top outer tiles (tileRow < 0)
   - Appears in rows 1, 2, 3 and bottom outer tiles
   - Wraps to bottom edge visually

2. **Corner line going LEFT** (0,0) to (-4,0):
   - Starts at corner (0,0), end.x = -4 (negative) → corner going backward
   - **FILTERED** from col 0 and left outer tiles (tileCol < 0)
   - Appears in cols 1, 2, 3 and right outer tiles
   - Wraps to right edge visually

3. **Vertical boundary line** (10,0) to (10,10):
   - Both on x=10 boundary → runs along vertical boundary
   - NOT a corner backward case (end.y = 10, not negative)
   - Repeats in X direction: 5 times (tiles 0,1,2,3 + left outer)
   - Does NOT repeat in Y direction (stays at row positions)

4. **Horizontal boundary line** (0,10) to (10,10):
   - Both on y=10 boundary → runs along horizontal boundary
   - NOT a corner backward case (end.x = 10, not negative)
   - Repeats in Y direction: 5 times (tiles 0,1,2,3 + top outer)
   - Does NOT repeat in X direction

5. **Crossing line** (5,5) to (11,5):
   - Length = 6, end.x = 11 > 10 → crosses horizontally
   - Repeats in X direction: 5 times
   - Repeats in Y direction: 4 times normally

6. **Corner crossing** (9,9) to (11,11):
   - Length = 2.83, end.x = 11, end.y = 11 → crosses both
   - Repeats in both directions: 5×5

7. **Boundary touch inward** (10,2) to (9,2) or (10,2) to (8,2):
   - Start on boundary, end inside → normalizes to END's tile
   - 1-cell: (10,2)→(9,2) normalizes to tile 0, stored as (10,2)→(9,2)
   - 2-cell: (10,2)→(8,2) normalizes to tile 0, stored as (10,2)→(8,2)
   - Works for ANY length as long as end is inside tile
   - Repeats normally: 4×4 (no outer tiles)

**Effect**:
- ✅ Corner lines going backward skip first row/col (no duplication at origin)
- ✅ Lines along boundaries repeat 5x in perpendicular direction on 4×4 board
- ✅ Lines crossing boundaries repeat 5x in crossing direction(s)
- ✅ Lines just touching boundaries repeat 4×4 normally
- ✅ Boundary-touching lines normalize to correct tile for proper positioning
- ✅ No unwanted duplication at tile boundaries or corners

### Cross-Tile Lines (CRITICAL BEHAVIOR)

**Cross-tile lines preserve their direction by normalizing the START point only, then applying the dx/dy offset.**

#### How It Works:
1. **User draws line** from (9,5) to (11,5) with repeat ON (gridSize 10)
2. **Coordinate normalization** (in PatternCanvas.jsx handleCanvasClick):
   - Find which tile the START point is in: `Math.floor(startGridX / patternGridSize)` = tile 0
   - Normalize START point: `startGridX - (startTileX * patternGridSize)` = 9 - 0 = 9
   - Calculate offset: `dx = endGridX - startGridX` = 11 - 9 = 2
   - Apply offset: `normalizedEnd = normalizedStart + dx` = 9 + 2 = 11
   - Result: Line stored as (9,5) to (11,5) - END coordinate exceeds gridSize (10)!
3. **Pattern detection** (in PatternCanvas.jsx rendering):
   - Checks if start point is in valid range (0 to gridSize): 9 ✓
   - Checks if repeat flag is true ✓
   - If both true → treat as pattern line
4. **Rendering with tile loops**:
   - Loops through all tiles: -1 to tilesPerSide (e.g., -1 to 4 for 4×4 artboard)
   - For each tile, adds tileBase offset: `tileCol * patternGridSize`
   - Example in tile 1: (9+10, 5+0) to (11+10, 5+0) = (19,5) to (21,5)
   - Example in tile 2: (9+20, 5+0) to (11+20, 5+0) = (29,5) to (31,5)
   - The cross-tile nature is preserved because end coordinate maintains offset from start
5. **Boundary filtering**:
   - This line has end.x = 11 which exceeds gridSize (10)
   - But since end coordinate doesn't equal 0 or gridSize exactly, it's NOT filtered
   - However, it may be filtered if start.x touches boundary (9 doesn't touch 0 or 10, so passes)
   - Lines with start at boundaries (like (10,5)→(12,5)) would be filtered from outer tiles

#### Key Examples (gridSize 10):
- **Horizontal cross**: (9,5)→(11,5) stays (9,5)→(11,5), repeats as (19,5)→(21,5), (29,5)→(31,5)...
- **Vertical cross**: (5,9)→(5,11) stays (5,9)→(5,11), repeats as (5,19)→(5,21), (5,29)→(5,31)...
- **Diagonal cross**: (9,9)→(11,11) stays (9,9)→(11,11), repeats as (19,19)→(21,21), (29,29)→(31,31)...
- **From tile 1**: (19,5)→(21,5) normalizes to (9,5)→(11,5), then repeats correctly
- **Boundary line**: (10,5)→(10,10) filtered from outer tiles (start.x = gridSize)

#### What NOT to Do:
- ❌ Don't use modulo on both start and end independently - this breaks cross-tile offset preservation
- ❌ Don't normalize the end point separately - calculate dx/dy and apply to normalized start
- ❌ Don't use absolute coordinates for cross-tile lines - they won't repeat
- ❌ Don't allow boundary lines in outer tiles - creates duplication
- ❌ Don't constrain end coordinates to gridSize - they need to exceed for cross-tile lines

### Artboard Intersection Detection
A line intersects the actual artboard if it's not entirely in the margins:
```javascript
const intersects = !(
  (startX < 0 && endX < 0) ||
  (startY < 0 && endY < 0) ||
  (startX >= artboardGridSize && endX >= artboardGridSize) ||
  (startY >= artboardGridSize && endY >= artboardGridSize)
);
```

For outer tile rendering, check if line's bounding box intersects artboard:
```javascript
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
```

### Tile Size Changes (Stitch Filtering)

When user resizes the tile dimensions, stitches may become invalid and must be removed to prevent crashes.

**Filtering Logic (PatternDesigner.jsx `handleTileSizeChange`):**

1. **Absolute stitches (`repeat: false`)**: Always kept - they use artboard coordinates, not tile coordinates
2. **Pattern stitches (`repeat !== false`)**: Keep if start point is within [0, newTileSize] bounds
3. **Simple check**: Only the start point (anchor) is checked - it's guaranteed to be closest to origin (0,0)
4. **Works for growing and shrinking**: Same logic applies whether tile is getting larger or smaller

**Logic:**
```javascript
const startXValid = stitch.start.x >= 0 && stitch.start.x <= newTileSize.x;
const startYValid = stitch.start.y >= 0 && stitch.start.y <= newTileSize.y;
return startXValid && startYValid;
```

**Why it works:**
- Start point is auto-oriented to be closest to tile origin during drawing
- If start leaves [0, tileSize] bounds, the stitch can't be properly normalized
- End points can extend beyond for cross-tile lines, so they don't need checking

**Cleanup:**
- Removed stitches' colors are deleted from `stitchColors` Map
- Removed stitches are cleared from `selectedStitchIds` Set
- Prevents orphaned data and selection inconsistencies

## Selection System

### Unified Selection Logic (CRITICAL)
Both click and drag selection use `visibleStitchInstancesRef` which is populated during rendering:
- **Single Source of Truth**: Selection checks ONLY the stitch instances that were actually rendered
- **Automatic Filtering**: All rendering filters (coordinate shifts, boundary handling, outer tile logic) automatically apply to selection
- **No Code Duplication**: Selection logic is ~10 lines instead of 200+ lines of duplicated filtering
- **Guaranteed Consistency**: If a stitch isn't visible, it can't be selected

### Click Selection
- Checks all visible stitch instances from `visibleStitchInstancesRef`
- Uses `distancePointToSegment()` with `SELECT_THRESHOLD` pixels
- Finds closest visible stitch to click point
- Modifiers:
  - Ctrl/Cmd/Shift: Toggle selection (add/remove from set)
  - No modifier: Replace selection (clear and select one)

### Drag Selection
- Rectangle selection with visual feedback (see Canvas Render Order for colors)
- Checks all visible stitch instances from `visibleStitchInstancesRef`
- Uses `lineIntersectsRect()` to detect line-rectangle intersection
- Selects all stitches with at least one visible instance intersecting the rectangle
- Prevents onClick from firing after drag via `justFinishedDragRef`
- Ignores drags smaller than 5×5 pixels (treats as click instead)
- Modifiers:
  - Ctrl/Cmd/Shift: Add to existing selection
  - No modifier: Replace selection

### visibleStitchInstancesRef Structure
```javascript
// Map<stitchId: string, instances: Array<{startX, startY, endX, endY}>>
{
  "stitch-123": [
    { startX: 100, startY: 200, endX: 300, endY: 200 },  // Instance in tile 0
    { startX: 500, startY: 200, endX: 700, endY: 200 },  // Instance in tile 1
    // ... more instances for this stitch
  ],
  // ... more stitches
}
```
- Cleared at start of each render pass
- Populated right before `ctx.stroke()` for each visible stitch instance
- Used by both click and drag selection to ensure they match rendering exactly

### Selection Rendering
- Selected stitches render in `DEFAULT_SELECTED_COLOR`
- Non-selected stitches use their assigned color from `stitchColors` map or `DEFAULT_STITCH_COLOR`

## Tools/Modes

### Select Mode
- Click to select individual stitches
- Drag to select multiple stitches with rectangle
- Works across all tiles for repeated stitches

### Draw Mode
- Click to set first point (first point indicator: blue, 2px radius)
- Click same point again to cancel
- Click second point to create line
- **Line Validation**:
  1. Must intersect drawable area (artboard + 1 tile margin) using `lineIntersectsArtboard()`
  2. If repeat ON: Must intersect actual artboard (not just margins)
  3. If repeat OFF or line only in margins: Stored with repeat: false
- **Coordinate Processing**:
  1. Convert canvas click to nearest grid point
  2. Convert to artboard-relative coordinates
  3. If repeat ON + touches artboard: Normalize start point, preserve dx/dy offset
  4. If repeat OFF or margin-only: Store absolute artboard-relative coords
- Automatically applies current stitch size, repeat setting, and color

### Pan Mode
- Drag to pan the viewport
- Can also be activated temporarily with middle mouse button
- Spacebar: Hold to enter pan mode, release to return to previous mode

## UI Components

### CanvasSettings (Left Sidebar) (UPDATED)

**Purpose:** Configure canvas-level settings that affect the entire pattern view

**Controls:**
1. **Pattern Name**: Text input for naming the pattern
2. **Pattern Description**: Textarea for pattern description
3. **Artboard Size**: Display-only field showing artboard dimensions with unit selector (px/mm/cm)
4. **Columns (X)**: Slider (1 to 10, step 1) - controls horizontal pattern repetitions (`patternTiles.x`)
5. **Rows (Y)**: Slider (1 to 10, step 1) - controls vertical pattern repetitions (`patternTiles.y`)
6. **Column Width (X)**: Slider (5 to 20, step 1) - grid cells horizontally per pattern tile (`tileSize.x`)
7. **Row Height (Y)**: Slider (5 to 20, step 1) - grid cells vertically per pattern tile (`tileSize.y`)
8. **Grid Size**: Slider (10px to 50px, step 1) - pixel size of each grid cell
   - Displayed with unit conversion based on unit selector
9. **Fabric Color**: 6-char hex color picker with presets and text input (#RRGGBB)
10. **Grid Appearance** (collapsible):
    - **Grid Color**: 8-char hex color picker with alpha (#RRGGBBAA)
    - **Tile Outline Color**: 8-char hex color picker with alpha (#RRGGBBAA)
    - **Artboard Outline Color**: 8-char hex color picker with alpha (#RRGGBBAA)
11. **Action Buttons**:
    - **New**: Creates new blank pattern
    - **Save**: Saves pattern to library (shows state: Saving.../Saved!)
    - **Reset to Defaults**: Restores default settings
    - **Export / Import** (dropdown):
      - Export as JSON
      - Export as PNG (1x/2x/3x/4x quality options)
      - Export as SVG (disabled)
      - Copy JSON (for patterns.json)
      - Import JSON

**Interaction Effects:**
- Changing Columns/Rows: Artboard and canvas resize dynamically based on pattern repetitions
- Changing Column Width/Row Height: Pattern tile resolution changes, affects artboard size
- Changing Grid Size: Everything scales proportionally, canvas margin adjusts (40 cells × grid size)

### Toolbar (Top Bar)

**Purpose:** Tool selection and stitch property controls

**Controls:**
1. **Tool Selection**: Select, Draw, Pan modes
2. **Stitch Color**: Color picker with preset swatches (6-char hex #RRGGBB)
   - Used for drawing new stitches
   - Used for changing selected stitch colors
3. **Stitch Length**: Dropdown (small | medium | large)
4. **Stitch Gap**: Slider/popover control for gap between stitches
5. **Stitch Width**: Dropdown (thin | normal | bold)
6. **Repeat Pattern**: Toggle button (ON | OFF)
   - ON: Lines repeat across all tiles
   - OFF: Lines appear only where drawn
7. **Undo/Redo**: History navigation buttons
8. **Show/Hide Grid**: Toggle grid visibility

### Auto-Apply Behavior
- All changes apply immediately without "Apply" buttons
- Stitch properties: Updates selected or sets default for drawing
- Color: Updates `stitchColors` map for selected or affects next drawn stitch

## Event Flow

### Mouse Event Handling
1. **Viewport Container**: Handles panning (when in pan mode)
   - Returns early in select/draw mode to avoid interference
2. **Canvas Element**: Handles drawing and selection
   - onClick: Click selection or drawing
   - onMouseDown: Start drag selection (select mode only)
   - onMouseMove: Update drag rectangle
   - onMouseUp: Complete selection
   - onMouseLeave: Cancel drag

### Click vs Drag Disambiguation
- Drag < 5px width/height: Treated as click
- After successful drag: `justFinishedDragRef` prevents onClick from firing

## Rendering Pipeline

### Canvas Render Order
1. Clear canvas with high DPI scaling
2. Fill background color (`backgroundColor` state)
3. Draw artboard boundary (`DEFAULT_ARTBOARD_OUTLINE_COLOR`, 2px line width)
4. Draw pattern tile boundaries within artboard (`DEFAULT_TILE_OUTLINE_COLOR`, 1px line width)
5. Draw grid dots across entire canvas (`DOT_RADIUS`, `DEFAULT_GRID_COLOR`)
6. Render all stitches (forEach loop):
   - Detect pattern vs absolute coordinates
   - For pattern lines: Loop through tiles (-1 to tilesPerSide), apply outer tile filtering
   - For absolute lines: Render once at position
   - Calculate dash pattern based on stitch size and line length
   - Apply stitch offset from grid points: `calculateStitchOffset(gapSize)` 
   - Use color from `stitchColors` map or stitch.color
   - Selected stitches render in `DEFAULT_SELECTED_COLOR`
7. Draw first point indicator (blue, 2px radius, if in draw mode with firstPoint)
8. Draw drag selection rectangle (blue stroke with light fill, 5px dashed line, if isDragging)

### Stitch Rendering Details
- **Offset**: `calculateStitchOffset(gapSize)` where calculation = `gapSize / 2` from start/end grid points (using unit vector)
- **Drawable Length**: Total length - 2 × offset
- **Gap Between Stitches**: `DEFAULT_GAP_SIZE` pixels (configurable)
- **Stitch Size Ratios** (dashes per grid cell):
  - `STITCH_SIZE_RATIOS.small` (dashes per cell)
  - `STITCH_SIZE_RATIOS.medium` (dashes per cell)
  - `STITCH_SIZE_RATIOS.large` (uses medium calculation, then merges pairs)
- **Minimum Dash Lengths** (prevents too-small dashes):
  - `MIN_DASH_LENGTHS.small` pixels
  - `MIN_DASH_LENGTHS.medium` pixels
  - `MIN_DASH_LENGTHS.large` pixels
- **Line Widths**:
  - `STITCH_WIDTHS.thin` pixels
  - `STITCH_WIDTHS.normal` pixels
  - `STITCH_WIDTHS.bold` pixels
- **Line Cap**: Round (for dashes), Butt (for base line)
- **Line Join**: Round
- **Selection Color**: `DEFAULT_SELECTED_COLOR`

## State Management

### PatternDesigner State
- `currentPattern`: Pattern data with stitches array
- `selectedStitchIds`: Set of selected stitch IDs
- `stitchColors`: Map of stitch ID to color overrides (specific color assignments)
- `drawingState`: { mode, firstPoint, previousMode }
- `selectedStitchColor`: Color for drawing new stitches and changing selected stitches (Toolbar)
- `backgroundColor`: Canvas background color (Canvas Settings)
- `gridColor`: Grid dots color with alpha (Canvas Settings)
- `tileOutlineColor`: Tile boundary lines color with alpha (Canvas Settings)
- `artboardOutlineColor`: Artboard border color with alpha (Canvas Settings)
- `stitchSize`: Default stitch size for new stitches
- `repeatPattern`: Default repeat setting for new stitches
- `patternTiles`: Number of tiles (e.g., {x:4, y:4} = 4×4 artboard)

### PatternCanvas State
- `dragSelectRect`: { startX, startY, endX, endY } during drag selection
- `isDragging`: Boolean state for drag selection
- `isDraggingRef`: Ref for immediate drag state (no render delay)
- `justFinishedDragRef`: Flag to prevent click after drag

## Known Behaviors

### Line Drawing Rules
1. Lines that touch the artboard repeat across all artboard tiles + outer margin tiles (where they cross) when repeat mode is ON
2. Cross-tile lines are supported and repeat correctly (start point normalized, dx/dy offset preserved)
3. Lines entirely in margins don't repeat (even if repeat mode is ON) - stored with repeat: false
4. Drawing must start within artboard (or extended margin), but can extend anywhere
5. Line must intersect artboard to be created when repeat is ON

### Selection Rules
1. Repeated lines can be selected in any tile where they appear
2. Selecting a repeated line selects all instances (they share the same ID)
3. Drag selection checks all tile positions for repeated lines
4. Click selection checks all tile positions for repeated lines

### Color System (CRITICAL BEHAVIOR)

**Three Independent Color Categories:**

1. **Fabric Colors** (Canvas Settings, left sidebar)
   - `backgroundColor` - 6-char hex (#RRGGBB) for canvas/fabric background
   - Purpose: Background color of the canvas
   - User input limited to 6 chars (#RRGGBB), no alpha channel
   - Changed via: CanvasSettings component only
   - Includes preset color swatches

2. **Grid Appearance Colors** (Canvas Settings, left sidebar → "Grid Appearance" collapsible)
   - `gridColor` - 8-char hex (#RRGGBBAA) with alpha channel for grid dots
   - `tileOutlineColor` - 8-char hex (#RRGGBBAA) for tile boundary lines
   - `artboardOutlineColor` - 8-char hex (#RRGGBBAA) for artboard border
   - Purpose: Visual appearance of grid and boundaries
   - User input limited to 8 chars (#RRGGBBAA), includes alpha transparency
   - Changed via: CanvasSettings component only

3. **Stitch Colors** (Toolbar)
   - `selectedStitchColor` - 6-char hex (#RRGGBB) for drawing new stitches and editing selected
   - Purpose: Color for drawing new stitches and changing selected stitches
   - User input limited to 6 chars (#RRGGBB), no alpha channel
   - Applied via `stitchColors` Map (stitch ID → color string)
   - Changed via: Toolbar component only
   - Includes preset color swatches
   - Used for: 
     - Drawing: All new stitches get this color in `stitchColors` map
     - Selection: Applied to all selected stitches in `stitchColors` map

**Color Precedence (Rendering):**
```javascript
const colorOverride = stitchColors.get(stitch.id) ?? stitch.color;
ctx.strokeStyle = isSelected ? '#0000FF' : colorOverride;
```
1. If selected: Blue (#0000FF)
2. Else if in `stitchColors` map: Use that color
3. Else if `stitch.color` exists: Use that color

**Key Behaviors:**
- New stitches always get `selectedStitchColor` applied (stored in `stitchColors` map)
- Changing `selectedStitchColor` with selection: Updates all selected stitches
- Changing `selectedStitchColor` without selection: Only affects next drawn stitch

## Future Considerations

### Potential Edge Cases to Monitor
- Very long lines that span multiple tiles
- Lines drawn from one edge of drawable area to opposite edge
- Selecting many stitches at once (performance)
- Undo/redo with repeated vs non-repeated lines
- Exporting patterns with color overrides

### Performance Notes
- Repeated stitches loop through all 36 tiles (6×6) for rendering
- Selection checking also loops through all 36 tile positions
- Consider optimizing if patterns become very complex
