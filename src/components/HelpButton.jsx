import { HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export function HelpButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sashiko Pattern Designer Guide</DialogTitle>
          <DialogDescription>
            Learn how to use the tools and keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Toolbar */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Toolbar</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Select Tool (V):</span>
                <span className="text-muted-foreground">Click stitches to select them. Hold Shift/Ctrl to select multiple. Drag to select multiple stitches at once.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Pen Tool (P):</span>
                <span className="text-muted-foreground">Click on grid points to draw stitches between them.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Pan Tool (Space):</span>
                <span className="text-muted-foreground">Hold spacebar to pan around the canvas.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Stitch Color:</span>
                <span className="text-muted-foreground">Choose a color for new stitches or change the color of selected stitches.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Stitch Settings:</span>
                <span className="text-muted-foreground">Opens a popover to adjust stitch length (Small/Medium/Large), gap spacing, and width (Thin/Medium/Bold).</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Repeat Pattern (R):</span>
                <span className="text-muted-foreground">Toggle to see your pattern repeated across multiple tiles. Lines drawn with repeat on will automatically tile.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Undo/Redo:</span>
                <span className="text-muted-foreground">Undo (Ctrl+Z) or redo (Ctrl+Y) your last actions.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Show Grid (H):</span>
                <span className="text-muted-foreground">Toggle visibility of grid dots, artboard boundary, and Repeat Pattern tile boundaries.</span>
              </div>
            </div>
          </section>

          {/* Pattern Settings */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Pattern Settings</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Artboard Size:</span>
                <span className="text-muted-foreground">Displays the total size of the artboard. Units can be changed between pixels, millimeters, and centimeters.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Columns (X):</span>
                <span className="text-muted-foreground">Controls how many times the pattern repeats horizontally on the artboard.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Rows (Y):</span>
                <span className="text-muted-foreground">Controls how many times the pattern repeats vertically on the artboard.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Column Width (X):</span>
                <span className="text-muted-foreground">Number of grid cells horizontally per pattern tile.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Row Height (Y):</span>
                <span className="text-muted-foreground">Number of grid cells vertically per pattern tile.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Grid Size:</span>
                <span className="text-muted-foreground">Size of each grid cell in pixels.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Fabric Color:</span>
                <span className="text-muted-foreground">Set the background color to preview your design on different fabrics.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Grid Appearance:</span>
                <span className="text-muted-foreground">Customize grid dot color, tile outline color, and artboard border color with transparency support.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">New Pattern:</span>
                <span className="text-muted-foreground">Create a new blank pattern. Unsaved changes will be lost.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Save Pattern:</span>
                <span className="text-muted-foreground">Save your current pattern to the library.</span>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <kbd className="min-w-30 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">V</kbd>
                <span className="text-muted-foreground">Switch to Select Tool</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-30 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">P</kbd>
                <span className="text-muted-foreground">Switch to Pen Tool</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-30 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">R</kbd>
                <span className="text-muted-foreground">Toggle Repeat Pattern</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-30 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">H</kbd>
                <span className="text-muted-foreground">Toggle Show/Hide Grid</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-30 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">Ctrl + Z</kbd>
                <span className="text-muted-foreground">Undo last action</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-30 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">Ctrl + Y</kbd>
                <span className="text-muted-foreground">Redo last undone action</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-30 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">Ctrl + S</kbd>
                <span className="text-muted-foreground">Save current pattern</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-30 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">Backspace</kbd>
                <span className="text-muted-foreground">Delete selected stitch(es)</span>
              </div>
            </div>
          </section>

          {/* Export/Import */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Export/Import</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Export SVG:</span>
                <span className="text-muted-foreground">Download your pattern as a scalable vector graphic.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Export Image:</span>
                <span className="text-muted-foreground">Download your pattern as a PNG image.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-30">Import JSON:</span>
                <span className="text-muted-foreground">Load a pattern from a JSON file.</span>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
