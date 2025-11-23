# Sashiko Pattern Designer - AI Agent Instructions

## Project Overview
A web-based interactive tool for designing Sashiko embroidery patterns using **Astro 5** (static site) + **React 19** + **Tailwind CSS 4**. The app features a tile-based repeating pattern system with a dynamic canvas that auto-resizes based on pattern configuration. Includes **offline-first PWA** capabilities for use without internet connection.

## UI Component Library
**Use shadcn/ui components wherever possible** - the project uses shadcn/ui component library built on Radix UI primitives. Components are located in `src/components/ui/` and include:
- Buttons, inputs, labels, sliders
- Dialogs, popovers, dropdowns, sheets
- Tabs, collapsibles, separators
- Cards, badges, tooltips
- And more in `src/components/ui/`

When adding new UI elements, prefer using existing shadcn components or adding new ones from [shadcn/ui](https://ui.shadcn.com/) rather than building from scratch.

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

**Curved Lines**:
- Stored as standard start/end points plus a `curvature` property (percentage).
- Rendering calculates "bulge" (height of arc) based on line length and curvature %.
- Uses `getArcParams` in `Stitches.jsx` to derive circle center, radius, and angles.
- Hit detection uses `distancePointToArc` in `PatternCanvas.jsx`.

**Absolute Lines** (`repeat: false` or coordinates outside 0-tileSize):
- Stored with absolute artboard-relative coordinates
- Render once at specified position
- Used for margin-only lines or single-instance designs

**Boundary Line Handling**: Lines on tile boundaries use special filtering to prevent duplication. See `TECHNICAL_SPEC.md` "Tile Boundary Handling" section for complete logic.

## Project Structure & Key Files

### State Management (Custom Hooks Pattern)
- `src/hooks/usePatternState.js` - Core pattern state (currentPattern, stitchColors, selection)
- `src/hooks/useUiState.js` - UI preferences with localStorage persistence (colors, grid, artboard config, stitch defaults)
- `src/hooks/useAutoSave.js` - Auto-save pattern data to IndexedDB (500ms debounce, separate from undo/redo)
- `src/hooks/useHistory.js` - Undo/redo with IndexedDB persistence and duplicate state prevention
- `src/hooks/usePatternLibrary.js` - Saved patterns CRUD (Dexie/IndexedDB)
- `src/hooks/usePatternImportExport.js` - JSON export/import, PNG export
- `src/hooks/usePropertyEditor.js` - Batch property editing for selected stitches
- `src/hooks/useKeyboardShortcuts.js` - Keyboard event handlers

Each hook encapsulates a specific concern and is composed in `PatternDesigner.jsx`.

### UI State & Persistence Architecture (CRITICAL)

**Three-Layer Persistence Strategy:**

**1. useUiState (localStorage - Synchronous, No Flash)**
- **Purpose**: UI preferences that load instantly on page load
- **Storage**: localStorage (synchronous, ~5MB limit)
- **What it saves**: 
  - Fabric & grid colors (backgroundColor, gridColor, tileOutlineColor, artboardOutlineColor)
  - Artboard configuration (gridSize, tileSize, patternTiles)
  - Stitch defaults (selectedStitchColor, stitchSize, stitchWidth, gapSize, repeatPattern)
  - Display preferences (showGrid, displayUnit, colorPresets, sidebarTab)
- **Auto-save**: Saves to localStorage on every state change (no debounce needed)
- **Key benefit**: Loads synchronously in useState initializer → **zero flash on page load**
- **Memory optimization**: Uses object properties in deps (tileSize.x/y, patternTiles.x/y, colorPresets.length)

**2. useAutoSave (IndexedDB - Async, Pattern Data)**
- **Purpose**: Save current working pattern to survive page refreshes (crash recovery)
- **Storage**: Single "current" entry in `db.currentPattern` table
- **What it saves**: Stitches + colors + full UI state snapshot
- **When it saves**: After 500ms debounce on stitches or UI changes
- **On app load**: Pattern data loads from IndexedDB (async), syncs artboard config to uiState

**3. Pattern Library (IndexedDB - Saved Patterns)**
- **Purpose**: User's saved pattern collection with pattern-specific UI state
- **Storage**: `db.patterns` table with indexing
- **What it saves**: Complete pattern + stitches + UI state (everything from useUiState)
- **On pattern load**: Restores pattern's saved UI state to uiState (artboard config, colors, preferences)
- **Key feature**: Each saved pattern remembers its own UI configuration

**Data Flow:**
1. **Page Load**: uiState loads from localStorage (instant) → pattern loads from IndexedDB (async) → artboard config syncs
2. **User Edits**: Changes update uiState (localStorage instant) AND currentPattern (IndexedDB debounced)
3. **Save Pattern**: Captures current uiState + pattern data → saves to pattern library
4. **Load Pattern**: Restores pattern's saved uiState → overwrites current working preferences

**useHistory (Undo/Redo System)**
- **Purpose**: Version control for user actions - allows stepping back/forward through editing states
- **What it saves**: Stitches + colors only (NOT canvas settings)
- **When it saves**: Immediately on stitch add/delete/modify, after property edits complete (batched)
- **Storage**: Multiple snapshots (up to 10 states) in `db.history` table
- **Timing**: No debounce - captures immediately for instant undo
- **Key features**: Bidirectional navigation, history index tracking, pattern-scoped (resets on pattern load)
- **Skips**: During undo/redo operations, during active property editing

**Why Three Layers:**
- **localStorage (uiState)**: Instant loading eliminates flash, small data, synchronous
- **IndexedDB (autoSave)**: Larger storage, async but doesn't affect initial render
- **IndexedDB (patterns)**: Pattern-specific UI state preservation
- Different data: Stitches-only (lightweight, multiple versions) vs Full UI state (heavyweight, single version)
- Different timing: Immediate capture vs debounced saves
- Independent testing and configuration

### Temporary State Pattern (CRITICAL FOR PERFORMANCE)

**Purpose**: Prevent auto-save on every slider drag increment or color picker drag

**Implementation in useUiState:**
- **Temp states**: `tempBackgroundColor`, `tempGridColor`, `tempTileOutlineColor`, `tempArtboardOutlineColor`
- **Refs track picker state**: `isFabricColorPickerOpenRef`, `isGridColorPickerOpenRef`, etc.
- **Live preview**: Temp values shown immediately in canvas
- **Commit on close**: When color picker closes or slider drag stops, temp value commits to actual state
- **Auto-save trigger**: Only committed values trigger localStorage save

**Event Handlers:**
- `onValueChange` - Updates temp state during drag (live preview)
- `onValueCommit` - Commits value when drag stops (triggers localStorage save)
- `onOpenChange` - Tracks color picker open/close, commits temp on close

**Similar Pattern in usePropertyEditor:**
- `tempGapSize`, `tempStitchColor`, `tempStitchSize`, `tempStitchWidth`
- `isEditingProperties` flag prevents history saves during editing
- 100ms timeout batches property changes into single history entry

### Data Persistence (Dexie.js / IndexedDB + localStorage)
- `src/lib/db.js` - Dexie database configuration and initialization
- `src/lib/patternStorage.js` - Pattern CRUD operations using Dexie
- **localStorage**: UI state (useUiState) - synchronous, instant loading
- **Database Schema**:
  - `patterns` table: User-saved patterns with indexing on name, createdAt, updatedAt (includes UI state)
  - `currentPattern` table: Active working pattern auto-save (includes UI state snapshot)
  - `history` table: Undo/redo snapshots (up to 10 states, stitches only)
- **Benefits**: IndexedDB ~50MB+ storage for patterns, localStorage instant UI loading, async operations, structured querying, future cloud sync ready

### PWA & Offline-First
- **@vite-pwa/astro** - PWA integration configured in `astro.config.mjs`
- **Service Worker**: Auto-generated with Workbox, manually registered in `index.astro`
- **Offline Capability**: App works without internet after first visit
- **Smart Auto-Update**: When reconnecting online, service worker force-checks for updates and reloads page if new version available
- **Installable**: Users can install app to home screen/desktop
- **Cache Strategy**:
  - HTML pages: NetworkFirst with 3s timeout (checks for updates online, falls back to cache)
  - JS/CSS: StaleWhileRevalidate (serves cache immediately, updates in background)
  - Images/fonts: CacheFirst with 1-year expiration
  - Pattern data: IndexedDB (Dexie.js) - persists offline
- **OfflineIndicator Component**: Shows connection status in header with auto-update trigger on reconnect

### Component Hierarchy
```
PatternDesigner.jsx (root state container)
├── AppSidebar.jsx (pattern library, canvas settings, export/import)
│   ├── CanvasSettings.jsx (grid size, tile size, pattern tiles, fabric and grid colors, save pattern, new pattern, export/import, reset to defaults)
│   └── PatternSelector.jsx (library for loading user saved and built-in patterns)
├── Toolbar.jsx (tool buttons, stitch controls, undo/redo)
├── CanvasViewport.jsx (pan/zoom container with scroll)
│   └── PatternCanvas.jsx (canvas rendering & drawing logic)
├── OfflineIndicator.jsx (connection status with auto-update on reconnect)
├── VersionBadge.jsx (app version display)
└── HelpButton.jsx (help dialog)
```

### Data Flow
1. **User draws line** → `PatternCanvas.jsx` calculates grid coordinates → calls `onAddStitch`
2. **PatternDesigner** updates `currentPattern.stitches` + `stitchColors` Map
3. **Main History Effect** triggers → `historyManager.pushHistory()` saves to `useHistory` hook (stitches only)
4. **Auto-save Effect** triggers → `useAutoSave` saves to Dexie (stitches + colors + canvas settings, 500ms debounce)
5. **UI State Changes** → `useUiState` saves to localStorage (instant, synchronous)
6. **Property Changes** → Temporary states (`tempGapSize`, `tempStitchColor`) → Live preview via Canvas Effects
7. **Property Completion** → `isEditingProperties = false` → Property History Effect → Batched save (100ms timeout)
8. **Canvas Settings Changes** → Temporary states (`tempBackgroundColor`, etc.) → Commit on picker close/slider stop → localStorage save
9. **Pattern Loading** → `clearHistory(initialState)` → Creates baseline history entry with loaded stitches → Restores UI state from pattern
10. **Rendering** loops through stitches, detects pattern vs absolute coordinates, applies tile offsets

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

**Deployment**: 
- **Platform**: Cloudflare Pages
- **Production URL**: https://sashiko-pattern-designer.pages.dev/
- **Build Command**: `npm run build`
- **Output Directory**: `./dist/`
- **Configuration**: See `wrangler.jsonc` and `astro.config.mjs`

**PWA Features**: 
- Service worker caches all static assets on first visit
- App works offline after initial load
- Auto-updates in background when online
- Installable to home screen/desktop
- Pattern data persists in IndexedDB (Dexie.js)

## Code Conventions

### State Updates
- **Immutable updates**: Always spread previous state for patterns/stitches
- **Map updates**: Clone Map for stitchColors: `const next = new Map(prev); next.set(...)`
- **History**: Undo/redo handled by `useHistory` hook with IndexedDB persistence - survives page refreshes, prevents duplicate entries
- **Dual History Effects**: Separate useEffect hooks prevent property editing interference:
  - **Property History Effect**: 100ms timeout batching for gap/color changes
  - **Main History Effect**: Skips during property editing to prevent conflicts
- **Temporary States**: `tempGapSize`, `tempStitchColor`, `isEditingProperties` for live preview without history pollution
- **Pattern-Scoped History**: Each pattern load resets history with loaded pattern as baseline
  - **Loading Existing Pattern**: `clearHistory(initialState)` creates baseline entry
  - **New Pattern**: `clearHistory()` starts with empty history
  - **Cross-Pattern Protection**: Cannot undo back to previously loaded patterns

### Stitch Data Structure
```javascript
{
  id: string,              // Unique identifier
  start: { x, y },         // Start point = "anchor" (closest to tile origin after normalization)
  end: { x, y },           // End point (can exceed tileSize for cross-tile)
  color: string | null,    // Optional color override
  stitchSize: string,      // 'small' | 'medium' | 'large'
  stitchWidth: string,     // 'thin' | 'normal' | 'thick'
  gapSize: number,         // Pixels between stitches (default 9)
  curvature: number,       // Percentage of chord length (-50 to 50)
  repeat: boolean          // Whether to repeat across tiles
}
```

**Important**: Lines are automatically oriented so the point closest to tile origin (0,0) becomes the anchor (start).

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
6. **History timing is critical** - dual useEffect system prevents property editing conflicts:
   - Property changes use timeout-based batching (100ms)
   - Main history effect skips during property editing
   - Never manually call pushHistory during property editing
7. **Pattern loading requires history reset** - use `clearHistory(initialState)` for existing patterns, `clearHistory()` for new
8. **History saves only stitches data** - canvas config (gridSize, tileSize, etc.) not included in history
9. **Boundary crossing detection is simple** - only check if endpoint exceeds [0, tileSize] bounds, NOT line length or distance
10. **Tile resizing removes invalid stitches** - only if start point leaves [0, tileSize] bounds
11. **Anchor auto-orientation** - anchor (start) is always the endpoint closest to tile origin (0,0)
12. **Object dependencies cause infinite loops** - use object properties (tileSize.x/y, patternTiles.x/y) in useEffect dependencies instead of object references
13. **UI state source of truth** - uiState (localStorage) is primary, currentPattern mirrors config for IndexedDB persistence
14. **Memory optimization** - avoid object/Map references in dependencies, use .size or specific properties
10. **Tile resizing removes invalid stitches** - only if start point leaves [0, tileSize] bounds
11. **Anchor auto-orientation** - anchor (start) is always the endpoint closest to tile origin (0,0)

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
