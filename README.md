# Sashiko Pattern Designer

A web-based interactive tool for creating and designing Sashiko embroidery patterns with repeating tile-based patterns.

## 🛠️ Technology Stack

- **Astro** - Static site framework
- **React** - UI library
- **Tailwind CSS** - Styling
- **Heroicons** - SVG icons ([Reference](https://www.shadcn.io/icons/heroicons))
- **Local Storage API** - Data persistence

## ✨ Features

### Pattern Creation
- **Interactive Canvas**: Draw stitches by clicking grid points
- **Pattern Repeat**: Toggle between repeating patterns and single-instance stitches
- **Cross-Tile Lines**: Support for lines that span across multiple tiles
- **Multiple Stitch Sizes**: Medium, Large, and XLarge stitch lengths
- **Color Customization**: Custom colors per stitch with preset color palette

### Pattern Management
- **Auto-Save**: Your work is automatically saved to browser local storage
- **Save to Library**: Save patterns to your personal pattern library
- **Load Patterns**: Switch between built-in and custom saved patterns
- **Export/Import**: Export patterns as JSON files and import them later
- **Export Images**: Export your design as a PNG image

### Built-in Patterns
- Blank Canvas
- Asanoha (Hemp Leaf)
- Simple Cross
- Diagonal Flow

### Tools & Controls
- **Select Mode**: Click or drag-select stitches to edit them
- **Draw Mode**: Click two points to create a stitch
- **Pan Mode**: Navigate large canvases (spacebar or middle-mouse)
- **Batch Operations**: Edit multiple selected stitches at once

## 🚀 Project Structure

```text
/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── CanvasSettings.jsx
│   │   ├── CanvasViewport.jsx
│   │   ├── ContextualSidebar.jsx
│   │   ├── ExportPanel.jsx
│   │   ├── PatternCanvas.jsx
│   │   ├── PatternDesigner.jsx
│   │   ├── PatternSelector.jsx
│   │   └── Toolbar.jsx
│   ├── data/
│   │   └── patterns.json
│   ├── layouts/
│   │   └── Layout.astro
│   ├── lib/
│   │   ├── patternStorage.js
│   │   └── utils.js
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 💾 Data Persistence

### Auto-Save
Your current work is automatically saved to browser local storage whenever you make changes. This includes:
- Adding, removing, or modifying stitches
- Changing stitch colors
- Adjusting canvas settings (tiles, colors, etc.)
- Updating tool settings

Your work will persist across page refreshes and browser sessions.

### Pattern Library
- Click **"Save Pattern"** to add your current design to your personal library
- Saved patterns appear in the "My Patterns" section
- Edit and re-save patterns to update them
- Delete unwanted patterns with the Delete button

### Export & Import
- **Export JSON**: Download your pattern as a `.json` file
- **Export PNG**: Download a high-quality image of your design
- **Import JSON**: Load previously exported pattern files

## 🎨 Usage Tips

1. **Starting Fresh**: Click "New Pattern" to start with a blank canvas
2. **Editing Patterns**: Load a built-in pattern and modify it to create variations
3. **Saving Your Work**: Name your pattern in Canvas Settings, then click "Save Pattern"
4. **Color Workflow**: Set default thread color for the canvas, then use stitch color to customize individual stitches
5. **Tile Boundaries**: Lines at coordinate 0 or gridSize are boundary lines - they won't duplicate in margins

## 📐 Technical Details

For detailed technical specifications, see [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md).

## �👀 Want to learn more about Astro?

Feel free to check [Astro documentation](https://docs.astro.build) or jump into their [Discord server](https://astro.build/chat).
