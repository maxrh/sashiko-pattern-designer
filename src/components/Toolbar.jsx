import { Select } from './ui/select.jsx';
import { Label } from './ui/label.jsx';

export function Toolbar({
  drawingMode,
  onModeChange,
  stitchSize,
  onStitchSizeChange,
  onSelectAll,
  onDeselectAll,
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3">
      {/* Tools */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onModeChange('select')}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${
            drawingMode === 'select'
              ? 'border-blue-500 bg-blue-500/20 text-blue-400'
              : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
          }`}
          title="Select Mode"
        >
          <svg
            className="h-5 w-5"
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
        </button>

        <button
          type="button"
          onClick={() => onModeChange('draw')}
          className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${
            drawingMode === 'draw'
              ? 'border-blue-500 bg-blue-500/20 text-blue-400'
              : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
          }`}
          title="Draw Mode"
        >
          <svg
            className="h-5 w-5"
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
        </button>
      </div>

      <div className="h-6 w-px bg-slate-700" />

      {/* Stitch Length */}
      {drawingMode === 'draw' && (
        <>
          <div className="flex items-center gap-2">
            <Label htmlFor="toolbar-stitch-size" className="text-xs text-slate-400 whitespace-nowrap">
              Stitch Length
            </Label>
            <Select
              id="toolbar-stitch-size"
              value={stitchSize}
              onChange={(event) => onStitchSizeChange(event.target.value)}
              className="w-32"
            >
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">XLarge</option>
            </Select>
          </div>
          <div className="h-6 w-px bg-slate-700" />
        </>
      )}

      {/* Selection Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSelectAll}
          className="rounded border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-300"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={onDeselectAll}
          className="rounded border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-300"
        >
          Deselect
        </button>
      </div>
    </div>
  );
}
