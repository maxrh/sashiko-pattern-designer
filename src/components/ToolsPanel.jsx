import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';

export function ToolsPanel({ drawingMode, onModeChange, stitchSize, onStitchSizeChange, onSelectAll, onDeselectAll }) {
  return (
    <Card className="bg-slate-900/70">
      <CardHeader>
        <CardTitle>Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onModeChange('select')}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
              drawingMode === 'select'
                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
            }`}
            title="Select Mode"
          >
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
            <span className="text-xs font-medium">Select</span>
          </button>

          <button
            type="button"
            onClick={() => onModeChange('draw')}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
              drawingMode === 'draw'
                ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
            }`}
            title="Draw Mode"
          >
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <span className="text-xs font-medium">Draw</span>
          </button>
        </div>

        {drawingMode === 'draw' && (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-medium text-slate-400">Stitch Length</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'medium', label: 'M' },
                { value: 'large', label: 'L' },
                { value: 'xlarge', label: 'XL' },
              ].map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => onStitchSizeChange(size.value)}
                  className={`rounded border-2 py-2 text-sm font-medium transition-all ${
                    stitchSize === size.value
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="flex-1 rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-300"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="flex-1 rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-300"
          >
            Deselect
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
