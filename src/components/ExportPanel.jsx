import { useRef } from 'react';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';

export function ExportPanel({
  onNewPattern,
  onSavePattern,
  onExportPattern,
  onImportPattern,
  onExportImage,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const [file] = event.target.files ?? [];
    if (file) {
      onImportPattern(file);
      event.target.value = '';
    }
  };

  return (
    <Card className="bg-slate-900/70">
      <CardHeader>
        <CardTitle>Export & Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" onClick={onNewPattern} className="w-full">
            New Pattern
          </Button>
          <Button type="button" onClick={onSavePattern} className="w-full" variant="default">
            Save Pattern
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={onExportPattern}>
            Export JSON
          </Button>
          <Button type="button" variant="outline" onClick={onExportImage}>
            Export PNG
          </Button>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          Import JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFileChange}
        />
      </CardContent>
    </Card>
  );
}
