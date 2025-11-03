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
- **Icons** - Inline SVG icons using Heroicons paths
  - Reference: [Heroicons](https://www.shadcn.io/icons/heroicons)
  - Implementation: SVG markup embedded directly in components
  - No external icon library dependency

### Data Persistence
- **Local Storage API** - Browser-native storage for auto-save and pattern library
- **JSON Export/Import** - Pattern file format for sharing

## Constants & Configuration

### Fixed Values
- **Canvas Size**: 2200×2200px
- **Cell Size**: 20px per grid cell
- **Canvas Grid Size**: 110×110 cells (calculated: canvasSize / cellSize)
- **Stitch Offset**: 4px from grid points along line direction
- **Gap Between Stitches**: 8px
- **Selection Threshold**: 10px for click selection
- **Drag Threshold**: 5×5px minimum to count as drag (vs click)
- **Device Pixel Ratio**: window.devicePixelRatio for high-DPI displays

### Default Values
- **Pattern Grid Size**: 10 cells (configurable per pattern)
  - **CRITICAL**: gridSize represents number of CELLS per tile
  - Example: gridSize 10 = 10 cells = 11 grid points (0 through 10)
  - Valid coordinate range: 0 to gridSize (inclusive, 0-10 for gridSize 10)
  - Each tile spans exactly gridSize cells
- **Tiles Per Side**: 4×4 default (configurable)
- **Default Thread Color**: Configurable
- **Default Stitch Size**: 'medium' (or 'large' for straight lines)
- **Default Repeat**: true

## Canvas System

### Canvas Structure
- **Canvas Size**: 2200x2200px fixed size
- **Cell Size**: 20px per grid cell
- **Artboard**: Centered on canvas, size depends on pattern tiles × gridSize
  - Example: 5×5 tiles with 10×10 grid = 1000×1000px artboard
- **Extended Area**: 1 tile margin on all sides for cross-boundary line visibility
  - Example: 5×5 artboard has visual space for 6×6 area (with margins)
  - Only shows portions of repeating lines that cross from real artboard into margin
  - Cannot initiate drawing from margin area - drawing must start within artboard

### Coordinate System
- **Canvas Grid Coordinates**: Absolute position on entire 2200×2200 canvas
- **Artboard-Relative Coordinates**: Relative to artboard top-left corner
  - Can be negative (in left/top margins)
  - Can exceed artboard size (in right/bottom margins)
- **Pattern-Relative Coordinates**: Normalized to single tile (0 to patternGridSize-1)
  - Used for repeated lines that tile across the artboard

### Artboard Offset Calculation
```javascript
// gridSize represents cells per tile
const artboardSize = patternTiles * patternGridSize * cellSize;
const artboardOffset = (canvasSize - artboardSize) / 2;
```

**Example**: 4×4 tiles with gridSize 10
- Each tile = 10 cells = 200px
- Artboard = 4 × 10 cells × 20px = 800px
- Offset = (2200 - 800) / 2 = 700px

### Extended Margin Area (CRITICAL BEHAVIOR)

**The 1-tile margin around the artboard is for visualization only, not for independent drawing.**

#### Purpose:
- Shows continuations of lines that cross artboard boundaries
- Allows users to see how their pattern repeats at the edges
- Example: Line drawn from inside artboard that extends outward will show in margin

#### Constraints:
- ✅ **Can draw FROM** inside artboard TO outside (into margin)
- ❌ **Cannot draw FROM** margin area (drawing must start in artboard)
- ✅ Lines that cross boundaries show in adjacent margin tile
- ❌ Lines don't randomly repeat in margins unless they touch artboard

#### Implementation:
```javascript
// In rendering loop, for outer tiles (tileRow/Col < 0 or >= tilesPerSide):
const isOuterTile = tileRow < 0 || tileRow >= tilesPerSide || 
                    tileCol < 0 || tileCol >= tilesPerSide;

if (isOuterTile) {
  // Only render if line's bounding box intersects the real artboard
  const intersectsArtboard = /* intersection check */;
  if (!intersectsArtboard) continue; // Skip this line in this outer tile
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
  gridSize: number,        // Cells per tile (e.g., 10 = 10 cells = 11 grid points)
  stitches: [...]          // Array of stitch definitions
}
```

**Coordinate System:**
- **gridSize**: Number of cells per tile (e.g., gridSize 10 means each tile is 10×10 cells)
- **Grid Points**: gridSize + 1 points (e.g., gridSize 10 has points 0-10, spanning 10 cells)
- **Valid Coordinates**: 0 to gridSize (inclusive) for pattern lines
- **Boundary Points**: 
  - Coordinate 0 = left/top edge of tile (shared with previous tile's coordinate gridSize)
  - Coordinate gridSize = right/bottom edge of tile (shared with next tile's coordinate 0)

**Example - Asanoha Pattern (gridSize 10):**
```javascript
{
  "id": "asanoha",
  "name": "Asanoha",
  "gridSize": 10,
  "stitches": [
    { "start": { "x": 0, "y": 5 }, "end": { "x": 5, "y": 0 }, "repeat": true },
    { "start": { "x": 5, "y": 0 }, "end": { "x": 10, "y": 5 }, "repeat": true },
    { "start": { "x": 0, "y": 0 }, "end": { "x": 5, "y": 5 }, "repeat": true }
    // ... more stitches
  ]
}
```
- Grid points range: 0-10 (11 points total)
- Cell range: 10 cells per tile
- Coordinate 10 reaches the right/bottom edge
- All lines repeat across tiles since repeat: true

### Coordinate Storage Logic

#### When Drawing a Line:

**Repeat Mode ON + Line touches artboard:**
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

### Tile Boundary Handling (CRITICAL BEHAVIOR)

**Tile boundaries are SHARED grid points between adjacent tiles.**

#### Boundary Semantics:
- **Coordinate 0**: Left/top boundary of tile (same physical point as coordinate `gridSize` of previous tile)
- **Coordinate gridSize**: Right/bottom boundary of tile (same physical point as coordinate 0 of next tile)
- **Example with gridSize 10**:
  - Tile 0 spans grid points 0-10 (absolute positions 0-10)
  - Tile 1 spans grid points 0-10 (absolute positions 10-20)
  - Grid point at coordinate 10 in tile 0 = grid point at coordinate 0 in tile 1
  - Physical location: absolute position 10

#### Boundary Duplication Prevention:
**Problem**: Lines starting or ending at boundary coordinates (0 or gridSize) would render in multiple tiles at the same physical location, causing visual duplication.

**Solution**: Filter boundary-touching lines from outer tiles:
```javascript
// In rendering loop, for outer tiles only:
if (isOuterTile && (stitch.start.x === 0 || stitch.start.x === patternGridSize || 
                    stitch.start.y === 0 || stitch.start.y === patternGridSize ||
                    stitch.end.x === 0 || stitch.end.x === patternGridSize ||
                    stitch.end.y === 0 || stitch.end.y === patternGridSize)) {
  continue; // Skip rendering in outer tiles
}
```

**Effect**:
- ✅ Lines touching boundaries render correctly within artboard tiles
- ✅ Lines touching boundaries do NOT render in margin areas
- ✅ No visual duplication at tile boundaries
- ✅ User-drawn lines from edge points stay within artboard

**Example**: Line from (0,5) to (5,10) in gridSize 10 pattern
- Renders in artboard tiles: (0,5)→(5,10), (10,5)→(15,10), (20,5)→(25,10)...
- Does NOT render in outer tiles (tileRow/Col -1 or >= tilesPerSide)
- No duplication in margins despite coordinates touching boundaries

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

## Selection System

### Click Selection
- Checks all stitches for proximity to click point
- Threshold: 10px distance
- **For pattern lines** (start in [0, patternGridSize), repeat !== false):
  - Checks tiles 0 to tilesPerSide-1 if repeat true
  - Checks only tile 0 if repeat false
- **For absolute coordinate lines**:
  - Checks tiles -1 to tilesPerSide if repeat !== false
  - Checks only the absolute position if repeat false
- Modifiers:
  - Ctrl/Cmd/Shift: Toggle selection
  - No modifier: Replace selection

### Drag Selection
- Rectangle selection with visual feedback (blue dashed border)
- Uses `lineIntersectsRect()` to detect line-rectangle intersection
- **For pattern lines** (start in [0, patternGridSize), repeat !== false):
  - Checks tiles 0 to tilesPerSide-1 if repeat true
  - Checks only tile 0 if repeat false
- **For absolute coordinate lines**:
  - Checks tiles -1 to tilesPerSide if repeat !== false
  - Checks only the absolute position if repeat false
- Prevents onClick from firing after drag via `justFinishedDragRef`
- Ignores drags smaller than 5x5 pixels (treats as click instead)
- Modifiers:
  - Ctrl/Cmd/Shift: Add to existing selection
  - No modifier: Replace selection

### Selection Rendering
- Selected stitches render in blue (#0000FF)
- Non-selected stitches use their assigned color or default thread color

## Tools/Modes

### Select Mode
- Click to select individual stitches
- Drag to select multiple stitches with rectangle
- Works across all tiles for repeated stitches

### Draw Mode
- Click to set first point (blue dot indicator, 2px radius)
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

### CanvasSettings (Left Sidebar)

**Purpose:** Configure canvas-level settings that affect the entire pattern view

**Controls:**
1. **Pattern Name**: Text input for naming the pattern
2. **Pattern Tiles**: Dropdown (2×2 to 10×10) - controls artboard size
3. **Background Color**: Color picker for canvas background
4. **Default Thread Color**: Color picker for fallback thread color
   - Used when stitches have no color override
   - Independent from drawing color

**Display:** Badge showing canvas info (size, cell size, stitch count)

### ContextualSidebar (Right Sidebar)

**Purpose:** Control settings that apply to drawing and selection

**Context-Aware Behavior:**
- **No selection**: Shows "Default settings for draw tool"
  - Changes affect future drawn lines
- **Has selection**: Shows "X stitch(es) selected" badge
  - Changes apply immediately to all selected lines

**Controls:**
1. **Stitch Length**: Dropdown (medium | large | xlarge)
   - Works for both drawing and selection modes
2. **Repeat Pattern**: Toggle button (ON | OFF)
   - ON: Lines repeat across all tiles
   - OFF: Lines appear only where drawn
3. **Stitch Color**: Color picker with preset swatches
   - Color input: Standard HTML color picker
   - Preset swatches: 8-10 clickable color buttons
   - Used for drawing new stitches
   - Used for changing selected stitch colors
4. **Clear Custom Colors**: Button to clear `stitchColors` map
   - Removes all color overrides, stitches revert to `defaultThreadColor`
5. **Delete Selected**: Button (only visible with selection)
   - Deletes all selected stitches

### Auto-Apply Behavior
- All changes apply immediately without "Apply" buttons
- Stitch Length: Updates selected or sets default for drawing
- Repeat Pattern: Updates selected or sets default for drawing
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
2. Fill background color
3. Draw artboard boundary (blue outline, 2px, rgba(59, 130, 246, 0.5))
4. Draw pattern tile boundaries within artboard (light gray, 1px)
5. Draw grid dots across entire canvas (3x3px squares, rgba(148, 163, 184, 0.25))
6. Render all stitches (forEach loop):
   - Detect pattern vs absolute coordinates
   - For pattern lines: Loop through tiles (-1 to tilesPerSide), apply outer tile filtering
   - For absolute lines: Render once at position
   - Calculate dash pattern based on stitch size and line length
   - Apply 4px offset from grid points along the line direction
   - Use color override → stitch.color → defaultThreadColor
   - Selected stitches render in blue (#0000FF)
7. Draw first point indicator (blue 2px radius circle, if in draw mode with firstPoint)
8. Draw drag selection rectangle (blue dashed 2px border, if isDragging)

### Stitch Rendering Details
- **Offset**: 4px from start/end grid points along the line direction (using unit vector)
- **Drawable Length**: Total length - 8px (4px offset on each end)
- **Gap Between Stitches**: 8px fixed
- **Dash Count Calculation**:
  - Medium: 2 dashes per 20px cell (Math.round(actualCellsInLine * 2))
  - Large: 1 dash per 20px cell (Math.round(actualCellsInLine * 1))
  - XLarge: Same as large, but pairs of dashes merged (even count required)
- **Line Cap**: Round (for dashes), Butt (for base line)
- **Line Join**: Round
- **Line Width**: 3px
- **Selection Color**: #0000FF (blue)
- **Canvas Line Cap**: Butt (for precise pixel alignment)

## State Management

### PatternDesigner State
- `currentPattern`: Pattern data with stitches array
- `selectedStitchIds`: Set of selected stitch IDs
- `stitchColors`: Map of stitch ID to color overrides (specific color assignments)
- `drawingState`: { mode, firstPoint, previousMode }
- `defaultThreadColor`: Fallback color for stitches without color overrides (Canvas Settings)
- `selectedStitchColor`: Color for drawing new stitches and changing selected stitches (ContextualSidebar)
- `backgroundColor`: Canvas background color (Canvas Settings)
- `stitchSize`: Default stitch size for new stitches
- `repeatPattern`: Default repeat setting for new stitches
- `patternTiles`: Number of tiles per side (e.g., 5 = 5×5 artboard)

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

**Two Independent Color Controls:**

1. **Default Thread Color** (Canvas Settings, left sidebar)
   - Purpose: Display color for stitches without explicit color overrides
   - Controlled by: `defaultThreadColor` state
   - Changed via: CanvasSettings component only
   - Used for: Rendering fallback when `stitchColors.get(id)` and `stitch.color` are null
   - Initial value: `#ffffff` (white)

2. **Stitch Color** (ContextualSidebar, right sidebar)
   - Purpose: Color for drawing new stitches and changing selected stitches
   - Controlled by: `selectedStitchColor` state
   - Changed via: ContextualSidebar component only
   - Used for: 
     - Drawing: All new stitches get this color in `stitchColors` map
     - Selection: Applied to all selected stitches in `stitchColors` map
   - Initial value: `#fb7185` (pink)
   - Includes color presets for quick selection

**Color Precedence (Rendering):**
```javascript
const colorOverride = stitchColors.get(stitch.id) ?? stitch.color ?? defaultThreadColor;
ctx.strokeStyle = isSelected ? '#0000FF' : colorOverride;
```
1. If selected: Blue (#0000FF)
2. Else if in `stitchColors` map: Use that color
3. Else if `stitch.color` exists: Use that color
4. Else: Use `defaultThreadColor`

**Key Behaviors:**
- New stitches always get `selectedStitchColor` applied (stored in `stitchColors` map)
- Changing `selectedStitchColor` with selection: Updates all selected stitches
- Changing `selectedStitchColor` without selection: Only affects next drawn stitch
- `defaultThreadColor` and `selectedStitchColor` are completely independent
- "Clear Custom Colors" button clears entire `stitchColors` map

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
