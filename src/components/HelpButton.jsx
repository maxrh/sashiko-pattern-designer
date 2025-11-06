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
          {/* Drawing Tools */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Drawing Tools</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-24">Pen Tool (P):</span>
                <span className="text-muted-foreground">Click on grid points to add stitches. Click on existing stitches to remove them.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-24">Select Tool (V):</span>
                <span className="text-muted-foreground">Click on stitches to select/deselect them. Use toolbar buttons to select all or deselect all.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-24">Stitch Color:</span>
                <span className="text-muted-foreground">Choose a color for new stitches or change the color of selected stitches.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-24">Stitch Size:</span>
                <span className="text-muted-foreground">Adjust the width of the stitch lines (1-10).</span>
              </div>
            </div>
          </section>

          {/* Canvas Controls */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Canvas Controls</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-24">Repeat Pattern:</span>
                <span className="text-muted-foreground">Toggle to see your pattern repeated across multiple tiles.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-24">Show Grid:</span>
                <span className="text-muted-foreground">Toggle grid visibility to help align your stitches.</span>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <kbd className="min-w-24 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">V</kbd>
                <span className="text-muted-foreground">Switch to Select Tool</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-24 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">P</kbd>
                <span className="text-muted-foreground">Switch to Pen Tool</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-24 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">R</kbd>
                <span className="text-muted-foreground">Toggle Repeat Pattern</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-24 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">H</kbd>
                <span className="text-muted-foreground">Toggle Show/Hide Grid</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-24 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">Ctrl + Z</kbd>
                <span className="text-muted-foreground">Undo last action</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-24 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">Ctrl + Y</kbd>
                <span className="text-muted-foreground">Redo last undone action</span>
              </div>
              <div className="flex items-start gap-3">
                <kbd className="min-w-24 rounded border border-border bg-muted px-2 py-1 font-mono text-xs">Ctrl + S</kbd>
                <span className="text-muted-foreground">Save current pattern</span>
              </div>
            </div>
          </section>

          {/* Pattern Management */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Pattern Management</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-24">New Pattern:</span>
                <span className="text-muted-foreground">Create a new blank pattern. Unsaved changes will be lost.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-24">Save Pattern:</span>
                <span className="text-muted-foreground">Save your current pattern to the library.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-24">Export SVG:</span>
                <span className="text-muted-foreground">Download your pattern as a scalable vector graphic.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-24">Export Image:</span>
                <span className="text-muted-foreground">Download your pattern as a PNG image.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium min-w-24">Import JSON:</span>
                <span className="text-muted-foreground">Load a pattern from a JSON file.</span>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Tips</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Patterns automatically repeat when drawn across tile boundaries</li>
              <li>Use "Copy for patterns.json" to export pattern data for development</li>
              <li>Adjust artboard size to see how your pattern repeats</li>
              <li>Change background color to preview your design on different fabrics</li>
              <li>Grid and tile outlines can be customized in the Settings tab</li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
