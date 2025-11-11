# Sashiko Pattern Designer - AI Agent Instructions

## Project Overview
A web-based interactive tool for designing Sashiko embroidery patterns using **Astro 5** (static site) + **React 19** + **Tailwind CSS 4**. The app features a tile-based repeating pattern system with a dynamic canvas that auto-resizes based on pattern configuration.

## Critical Architecture Concepts

### Canvas System (THE MOST IMPORTANT CONCEPT)
- **Canvas**: Entire drawable grid area = Artboard + 40-cell margin on all sides
- **Extended Area**: Artboard + 1 tile margin on all sides (for showing pattern continuations at edges)
- **Artboard**: The pattern tile area = `patternTiles × tileSize × gridSize` (in pixels)
- **Grid Points vs Cells**: `gridSize` = number of CELLS per tile, which creates `gridSize + 1` grid points (e.g., 10 cells = points 0-10)
- **Dynamic Sizing**: Canvas size recalculates when user changes `gridSize`, `tileSize`, or `patternTiles`

**Formula**: `canvasSize = artboardSize + (2 × 40 × gridSize_pixels)`

### Pattern Tiles (REPEATING UNIT)
- **Pattern Tile**: Single unit of the repeating pattern, defined by `tileSize` (grid cells per tile)
- **Pattern Tiles (count)**: How many times the pattern repeats on the artboard (`patternTiles.x` × `patternTiles.y`)
- **Format**: Must be `{x, y}` object (e.g., `{"x":4,"y":4}`)
- **Example**: 4×4 pattern tiles with 10×10 tileSize = 16 total tiles arranged in a 4×4 grid
- **User Control**: Sliders in left sidebar (Columns/Rows) adjust how many times pattern repeats

**Extended Area Behavior**:
- Pattern stitches render in tiles from -1 to `tilesX/Y + 1` (includes outer tiles)
- User can draw from extended area into artboard and vice versa
- Only stitches partly or entirely inside artboard are repeated
- Purpose: Lets patterns repeat at edges
- Margin area (40 cells) is non-interactive; used for visual continuity only

### Coordinate Systems (CRITICAL FOR STITCH LOGIC)
Three distinct coordinate systems exist:

1. **Canvas Grid Coordinates**: Absolute position on entire canvas (includes margins)
2. **Artboard-Relative Coordinates**: Relative to artboard top-left (can be negative in margins)
3. **Pattern-Relative Coordinates**: Normalized to single tile (0 to `tileSize`) for repeating lines

**Tile Boundaries Are Shared**: Point at x=0 of tile 1 is the SAME physical point as x=10 (tileSize) of tile 0. This affects normalization and rendering logic in `PatternCanvas.jsx`.

### Stitch Storage & Rendering (READ `TECHNICAL_SPEC.md` FOR DETAILS)
**Pattern Lines** (`repeat: true`, coordinates within 0-tileSize range):
- Start point normalized to tile coordinates by subtracting tile offset
- End coordinate preserves offset (dx/dy), so can exceed tileSize for cross-tile lines
- Example: Line (9,5)→(11,5) stored as-is, renders in ALL tiles at (9,5)→(11,5), (19,5)→(21,5), etc.
- Corner lines with negative coordinates (e.g., (0,0)→(0,-5)) are filtered from first row/col to prevent duplication

**Absolute Lines** (`repeat: false` or coordinates outside 0-tileSize):
- Stored with absolute artboard-relative coordinates
- Render once at specified position
- Used for margin-only lines or single-instance designs

**Boundary Line Handling**: Lines on tile boundaries use special filtering to prevent duplication. See `TECHNICAL_SPEC.md` "Tile Boundary Handling" section for complete logic.

## Project Structure & Key Files

### State Management (Custom Hooks Pattern)
- `src/hooks/usePatternState.js` - Core pattern state (currentPattern, stitchColors, selection)
- `src/hooks/useHistory.js` - Undo/redo with debounced property editing
- `src/hooks/usePatternLibrary.js` - Saved patterns CRUD (localStorage)
- `src/hooks/usePatternImportExport.js` - JSON export/import, PNG export
- `src/hooks/usePropertyEditor.js` - Batch property editing for selected stitches
- `src/hooks/useKeyboardShortcuts.js` - Keyboard event handlers

Each hook encapsulates a specific concern and is composed in `PatternDesigner.jsx`.

### Component Hierarchy
```
PatternDesigner.jsx (root state container)
├── AppSidebar.jsx (pattern library, canvas settings, export/import)
│   ├── CanvasSettings.jsx (grid size, tile size, pattern tiles, fabric and grid colors, save pattern, new pattern, export/import, reset to defaults)
│   └── PatternSelector.jsx (library for loading user saved and built-in patterns)
├── Toolbar.jsx (tool buttons, stitch controls, undo/redo)
├── CanvasViewport.jsx (pan/zoom container with scroll)
│   └── PatternCanvas.jsx (canvas rendering & drawing logic)
└── HelpButton.jsx (help dialog)
```

### Data Flow
1. **User draws line** → `PatternCanvas.jsx` calculates grid coordinates → calls `onAddStitch`
2. **PatternDesigner** updates `currentPattern.stitches` + `stitchColors` Map
3. **Auto-save** triggers via `useEffect` → `patternStorage.js` saves to localStorage
4. **Rendering** loops through stitches, detects pattern vs absolute coordinates, applies tile offsets

### Color System (THREE CATEGORIES)
**Fabric Colors** (Left Sidebar → CanvasSettings.jsx):
- `backgroundColor` - 6-char hex (#RRGGBB) for canvas/fabric background
- User input limited to 6-chars, no alpha channel
- Includes preset color swatches

**Stitch Colors** (Toolbar → Toolbar.jsx):
- `selectedStitchColor` - 6-char hex (#RRGGBB) for drawing new stitches and editing selected
- Applied via `stitchColors` Map (stitch ID → color string)
- User input limited to 6-chars, no alpha channel
- Includes preset color swatches

**Grid Appearance Colors** (Left Sidebar → CanvasSettings.jsx → "Grid Appearance" collapsible):
- `gridColor` - 8-char hex (#RRGGBBAA) with alpha channel for grid dots
- `tileOutlineColor` - 8-char hex (#RRGGBBAA) for tile boundary lines
- `artboardOutlineColor` - 8-char hex (#RRGGBBAA) for artboard border
- User input limited to 8 chars, including alpha transparency

**Rendering precedence**: `stitchColors.get(id)` → `stitch.color` → blue (DEFAULT_SELECTED_COLOR if selected)

## Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Dev server on localhost:4321
npm run build            # Build to ./dist/ (static output)
npm run preview          # Preview production build locally
```

**Deployment**: Built for Cloudflare Pages (see `wrangler.jsonc`). Run `npm run build` then deploy `./dist/`.

## Code Conventions

### State Updates
- **Immutable updates**: Always spread previous state for patterns/stitches
- **Map updates**: Clone Map for stitchColors: `const next = new Map(prev); next.set(...)`
- **History**: Undo/redo handled by `useHistory` hook - don't push history manually in components

### Stitch Data Structure
```javascript
{
  id: string,              // Unique identifier
  start: { x, y },         // Start point = "anchor" (always inside artboard for pattern lines)
  end: { x, y },           // End point (can exceed tileSize for cross-tile)
  color: string | null,    // Optional color override
  stitchSize: string,      // 'small' | 'medium' | 'large'
  stitchWidth: string,     // 'thin' | 'normal' | 'thick'
  gapSize: number,         // Pixels between stitches (default 9)
  repeat: boolean          // Whether to repeat across tiles
}
```

**Important**: When drawing from outside artboard into it, the line is automatically reversed so `start` (anchor) is inside artboard bounds.

### Pattern File Format (`patterns.json`)
- `gridSize`: Number of CELLS per tile (e.g., 10 means 11 grid points: 0-10)
- `tileSize`: Must be `{x, y}` object format (e.g., `{"x":10,"y":10}`)
- `patternTiles`: Must be `{x, y}` object format (e.g., `{"x":4,"y":4}`)
- `stitches`: Array of stitch objects with normalized coordinates

## Common Pitfalls

1. **Don't modulo both start and end independently** for cross-tile lines - only normalize start, then apply dx/dy offset
2. **Shared boundaries**: x=0 and x=tileSize are the SAME point - filtering logic prevents duplication (see corner line handling)
3. **gridSize is CELLS not POINTS** - valid coordinates are 0 to gridSize (inclusive), not gridSize-1
4. **Selection uses visibleStitchInstancesRef** - populated during rendering to ensure click/drag selection matches visible stitches
5. **Color overrides in stitchColors Map** - NOT stored in stitch.color field directly
6. **Auto-save triggers on ANY state change** - be careful with useEffect dependencies
7. **Boundary crossing detection is simple** - only check if endpoint exceeds [0, tileSize] bounds, NOT line length or distance
8. **Tile resizing removes invalid stitches** - only when SHRINKING; growing keeps all stitches
9. **Anchor reversal** - lines drawn from margin into artboard are auto-reversed so start is inside

## Boundary Line Logic (CRITICAL - UPDATED)

**Four types of boundary-related lines:**

1. **Corner Lines Going Backward**: Start at corner (0,0 or tileSize,tileSize) with negative end coords
   - Example: (0,0)→(0,-5) vertical line going UP from top-left corner
   - Skip in first row/col and corresponding outer tiles to prevent duplication

2. **Lines Running Along Boundaries**: Both endpoints on SAME boundary, moving perpendicular
   - Vertical: both x=0 or x=tileSize, different y values
   - Horizontal: both y=0 or y=tileSize, different x values
   - Repeat in outer tiles perpendicular to boundary (5x on 4x4 artboard)

3. **Lines Crossing Tile Boundaries**: Endpoint extends beyond [0, tileSize]
   - Detection: `end.x < 0 || end.x > tileSize` (horizontal crossing)
   - Detection: `end.y < 0 || end.y > tileSize` (vertical crossing)
   - Repeat in ALL outer tiles in crossing direction(s)

4. **Lines Entirely Within Tile**: Both endpoints within [0, tileSize], not running along boundary
   - Example: (5,5)→(7,8) or (9,10)→(10,9) diagonal touching boundaries but contained
   - Repeat only in artboard tiles (4x4), skip all outer tiles
   - **IMPORTANT**: Lines like (9,10)→(10,9) look like they touch boundaries but are fully contained, so they don't trigger outer tile repetition

## When Modifying Rendering Logic

1. **Read `TECHNICAL_SPEC.md` sections**: "Canvas System", "Coordinate System", "Stitch/Line System", "Tile Boundary Handling"
2. **Test cross-tile lines**: Ensure (9,5)→(11,5) repeats correctly across ALL tiles
3. **Test boundary lines**: Ensure vertical/horizontal boundary lines render 5x (not 4x) on 4×4 artboard
4. **Test corner lines with negative coords**: Ensure (0,0)→(0,-5) skips first row and top margin
5. **Test contained boundary-touching lines**: Ensure (9,10)→(10,9) repeats 4x4 (not in outer tiles)
6. **Check selection**: Click/drag should match rendered stitch positions exactly

## Debugging Workflow

- **Console logs in rendering loop**: Add logs inside `PatternCanvas.jsx` stitch forEach to see coordinates per tile
- **visibleStitchInstancesRef**: Check this Map to see what selection system sees
- **localStorage**: Use browser DevTools Application tab to inspect saved patterns
- **Pattern export**: Export as JSON to examine normalized coordinates

## References
- **Detailed spec**: `TECHNICAL_SPEC.md` (DO NOT UPDATE without permission - it's a living doc)
- **Built-in patterns**: `src/data/patterns.json` - see Asanoha for complex cross-tile examples
- **Icons**: Using `lucide-react` package (v0.552.0) - import icons like `import { Edit3, Hand } from 'lucide-react'`
