# Sashiko Pattern Designer

A web-based interactive tool for designing Sashiko embroidery patterns using **Astro 5** + **React 19** + **Tailwind CSS 4**. Create beautiful, repeating geometric patterns using traditional Japanese stitching motifs.

## Technology Stack

- **Astro** v5.15.3 - Static site framework
- **React** v19.2.0 - UI library
- **Tailwind CSS** v4.1.16 - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI primitives
- **Lucide React** v0.552.0 - Modern icon library ([Reference](https://lucide.dev/))
- **Dexie.js** v4.0.10 - IndexedDB wrapper for robust data persistence

## Features

### Pattern Creation
- **Tile-Based Repeating System**: Design a single tile that automatically repeats across the canvas
- **Interactive Drawing**: Click and drag to create stitch lines on a grid with intelligent anchor point orientation
- **Multiple Drawing Tools**:
  - Line Draw Tool: Create straight stitch lines
  - Pan Tool: Navigate the canvas (spacebar shortcut)
  - Select Tool: Select and manipulate existing stitches
- **Grid Snapping**: Automatic snapping to grid points for precise alignment
- **Real-time Preview**: See your pattern repeat instantly as you draw
- **Cross-Tile Lines**: Draw lines that span across tile boundaries for complex patterns
- **Extended Drawing Area**: One-tile margin around artboard for visualizing pattern continuations
- **Smart Anchor Orientation**: Lines automatically orient with start point closest to tile origin

### Stitch Customization
- **Multiple Stitch Sizes**: Small, Medium, Large stitch lengths
- **Multiple Stitch Widths**: Thin, Normal, Thick line weights
- **Adjustable Gap Size**: Control spacing between individual stitch marks
- **Color Customization**: Custom colors per stitch with preset color palette
- **Batch Editing**: Edit properties of multiple selected stitches at once
- **Pattern Repeat Toggle**: Choose between repeating patterns and single-instance stitches

### Pattern Management
- **Auto-Save**: Your work is automatically saved to IndexedDB (via Dexie.js)
- **Pattern Library**: Save and organize multiple patterns with custom names
- **Load Patterns**: Switch between built-in patterns and your custom saved patterns
- **Export/Import**: Export patterns as JSON files for sharing or backup
- **Export Images**: Export your design as PNG image
- **Undo/Redo**: Full history support with keyboard shortcuts (Ctrl+Z / Ctrl+Y)

### Canvas Configuration
- **Dynamic Canvas Sizing**: Canvas auto-resizes based on pattern configuration
- **Adjustable Grid Size**: Control pixel size per grid cell (zoom level)
- **Adjustable Tile Size**: Configure grid cells per tile dimension
- **Adjustable Pattern Tiles**: Control how many times the pattern repeats (columns × rows)
- **Show/Hide Grid**: Toggle grid visibility for cleaner preview
- **Color Themes**:
  - Fabric Background Color: 6-character hex (#RRGGBB)
  - Grid Dot Color: 8-character hex with alpha (#RRGGBBAA)
  - Tile Outline Color: 8-character hex with alpha (#RRGGBBAA)
  - Artboard Outline Color: 8-character hex with alpha (#RRGGBBAA)
- **Reset to Defaults**: Restore default canvas settings

### Built-in Patterns (more coming)
- **Blank Canvas**: Start fresh with a clean slate
- **Asanoha**: Traditional hemp leaf pattern
- **Ajiro Wickerwork**: Classic wickerwork weave pattern
- **Simple Cross**: Basic cross stitch pattern
- **Diagonal Flow**: Dynamic diagonal lines
- **Hitomezashi Cross**: Cross variation using Hitomezashi technique
- **Hitomezashi Kuchi**: Mouth pattern with Hitomezashi style

## Project Structure

```text
/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/                      # shadcn/ui component library
│   │   ├── AppSidebar.jsx           # Main sidebar with pattern library & settings
│   │   ├── CanvasSettings.jsx       # Canvas configuration controls
│   │   ├── CanvasViewport.jsx       # Pan/zoom container with scroll
│   │   ├── ErrorBoundary.jsx        # Error handling with user-friendly UI
│   │   ├── HelpButton.jsx           # Help dialog
│   │   ├── PatternCanvas.jsx        # Canvas rendering & drawing logic
│   │   ├── PatternCard.jsx          # Pattern card component
│   │   ├── PatternDesigner.jsx      # Root state container
│   │   ├── PatternSelector.jsx      # Pattern library selector
│   │   ├── Stitches.jsx             # Stitch rendering component
│   │   └── Toolbar.jsx              # Tool buttons & stitch controls
│   ├── data/
│   │   └── patterns.json            # Built-in pattern definitions
│   ├── hooks/
│   │   ├── useHistory.js            # Undo/redo with debouncing
│   │   ├── useKeyboardShortcuts.js  # Keyboard event handlers
│   │   ├── usePatternImportExport.js # JSON/PNG export, JSON import
│   │   ├── usePatternLibrary.js     # Saved patterns CRUD (localStorage)
│   │   ├── usePatternState.js       # Core pattern state management
│   │   └── usePropertyEditor.js     # Batch property editing
│   ├── layouts/
│   │   └── Layout.astro
│   ├── lib/
│   │   ├── patternStorage.js        # localStorage helpers
│   │   ├── patternUtils.js          # Pattern manipulation utilities
│   │   ├── unitConverter.js         # Coordinate conversion utilities
│   │   └── utils.ts                 # General utilities
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── components.json                   # shadcn/ui configuration
├── package.json
├── README.md
├── TECHNICAL_SPEC.md                 # Detailed technical documentation
├── tsconfig.json
└── wrangler.jsonc                    # Cloudflare Pages configuration
```

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Data Persistence

### Auto-Save
Your current work is automatically saved to IndexedDB (via Dexie.js) whenever you make changes. This includes:
- Adding, removing, or modifying stitches
- Changing stitch colors
- Adjusting canvas settings (tiles, colors, etc.)
- Updating tool settings

Benefits over localStorage:
- **Larger storage capacity**: ~50MB+ vs localStorage's ~5-10MB limit
- **Better performance**: Async operations don't block the UI
- **Structured data**: No JSON stringify/parse overhead
- **Future-ready**: Easily extensible to cloud sync with Dexie Cloud

Your work persists across page refreshes and browser sessions.

### Pattern Library
- Click **"Save Pattern"** to add your current design to your personal library
- Saved patterns are stored in IndexedDB with metadata (name, timestamps, etc.)
- Patterns are indexed for fast searching and filtering
- Edit and re-save patterns to update them
- Delete unwanted patterns with the Delete button

### Export & Import
- **Export JSON**: Download your pattern as a `.json` file for sharing or backup
- **Export PNG**: Download a high-quality image of your design
- **Import JSON**: Load previously exported pattern files

## Usage Tips

### Getting Started
1. **Starting Fresh**: Click "New Pattern" to start with a blank canvas
2. **Using Built-in Patterns**: Load patterns from the Pattern Library to explore or modify
3. **Saving Your Work**: Name your pattern in Canvas Settings, then click "Save Pattern" to add it to your library

### Canvas Configuration
- **Pattern Tiles (Columns × Rows)**: Control how many times the pattern repeats (1-10 per dimension)
- **Tile Size**: Number of grid cells per tile dimension (5-20), controls pattern detail level
- **Grid Size**: Pixel size per grid cell (10-50px), controls visual scale
  - Larger grid size = bigger pattern with more visible detail
  - Canvas auto-resizes with 40 grid cells of margin around the artboard
- **Show Grid**: Toggle grid visibility on/off for cleaner pattern preview

### Drawing & Editing
- **Draw Mode**: Click two grid points to create a stitch line
- **Select Mode**: Click to select individual stitches, or drag to select multiple
  - Shift+Click or Ctrl+Click to add/remove from selection
  - Selected stitches show coordinates in toolbar (Start/End)
- **Pan Mode**: Spacebar to temporarily activate, or toggle with Pan tool button
- **Pattern Repeat Toggle**: Enable for traditional repeating patterns, disable for single-instance designs
- **Anchor Point**: Lines automatically orient with start point closest to tile origin (0,0)
- **Cross-Tile Lines**: Draw lines that extend beyond a single tile for complex patterns
- **Delete**: Select stitches and press Delete key or use Delete button

### Color Workflow
- **Fabric Background** (Canvas Settings): Set the canvas/fabric background color (6-char hex)
- **Stitch Color** (Toolbar): Set color for new stitches and editing selected stitches (6-char hex)
- **Grid Appearance** (Canvas Settings): Configure grid colors with alpha transparency (8-char hex)
- Use preset color swatches for quick selection, or enter custom hex values

### Stitch Properties
- **Size**: Small, Medium, or Large stitch lengths
- **Width**: Thin, Normal, or Thick line weights
- **Gap Size**: Adjust spacing between individual stitch marks
- **Batch Editing**: Select multiple stitches and edit properties all at once

### Pattern Management
- **Auto-Save**: Current pattern automatically saves to IndexedDB (Dexie.js)
- **Pattern Library**: Access saved patterns and built-in patterns via left sidebar
- **Keyboard Shortcuts**:
  - `Ctrl+Z` / `Cmd+Z`: Undo
  - `Ctrl+Y` / `Cmd+Y`: Redo
  - `Delete`: Delete selected stitches
  - `Spacebar`: Pan mode (hold)


## Technical Details

### Architecture
- **Custom Hooks Pattern**: State management split into focused hooks (`usePatternState`, `useHistory`, `usePatternLibrary`, etc.)
- **Canvas System**: Dynamic sizing with artboard + extended drawing area + margin
- **Coordinate Systems**: Three distinct systems (Canvas, Artboard-Relative, Pattern-Relative)
- **Tile Boundaries**: Shared coordinates between adjacent tiles with duplication prevention
- **Error Handling**: ErrorBoundary component with user-friendly error messages and recovery options
- **Data Persistence**: Dexie.js for IndexedDB with structured storage and async operations

### Canvas System
- **Canvas**: Artboard + 40-cell margin on all sides
- **Extended Area**: Artboard + 1-tile margin for visualizing pattern continuations
- **Artboard**: Pattern tiles × tileSize × gridSize (in pixels)
- **Dynamic Sizing**: Recalculates when gridSize, tileSize, or patternTiles change

### Storage Format
- **Database**: Dexie.js wrapper around IndexedDB with 3 tables:
  - `patterns`: User-saved patterns with indexing (name, createdAt, updatedAt)
  - `currentPattern`: Active working pattern (auto-save)
  - `settings`: User preferences and UI state
- **Pattern Data**: Stored as structured objects with tile-relative coordinates
- **Stitch Format**: Start/end points, color, size, width, gapSize, repeat flag
- **Auto-Save**: Triggers on any pattern change via async Dexie operations
- **Export**: JSON format for patterns, PNG for images
- **Benefits**: ~50MB+ capacity, async operations, structured querying, cloud sync ready

For complete technical specifications, architecture details, and coordinate system documentation, see [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md).

## Deployment

This project is configured for **Cloudflare Pages** deployment:
1. Build the static site: `npm run build`
2. Deploy the `./dist/` directory to Cloudflare Pages
3. Configuration: See `wrangler.jsonc` for deployment settings

## Learn More

- **Astro**: [Documentation](https://docs.astro.build) | [Discord](https://astro.build/chat)
- **React**: [Documentation](https://react.dev)
- **Tailwind CSS**: [Documentation](https://tailwindcss.com/docs)
- **shadcn/ui**: [Component Library](https://ui.shadcn.com/)
- **Lucide Icons**: [Icon Library](https://lucide.dev/)
- **Dexie.js**: [Documentation](https://dexie.org/) | [API Reference](https://dexie.org/docs/API-Reference)

---

Made by **Monsun** • [monsun.dk](https://monsun.dk) • [max@monsun.dk](mailto:max@monsun.dk)
