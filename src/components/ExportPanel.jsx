import { useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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
    <Card>
      <CardHeader>
        <CardTitle>Export & Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" onClick={onNewPattern} className="w-full">
            New
          </Button>
          <Button type="button" onClick={onSavePattern} className="w-full" variant="default">
            Save
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
