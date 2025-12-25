import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CSVImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ContestantCSVRow[]) => Promise<void>;
  isImporting?: boolean;
}

export interface ContestantCSVRow {
  name: string;
  bio?: string;
  performance?: string;
}

const parseCSV = (text: string): ContestantCSVRow[] => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Get header line
  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Find column indices
  const nameIndex = headers.findIndex(h => h === 'name');
  const bioIndex = headers.findIndex(h => h === 'bio' || h === 'biography');
  const performanceIndex = headers.findIndex(h => h === 'performance' || h === 'entry');

  if (nameIndex === -1) {
    throw new Error('CSV must have a "name" column');
  }

  const data: ContestantCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parsing (handles basic quoted values)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const name = values[nameIndex]?.replace(/"/g, '').trim();
    if (name) {
      data.push({
        name,
        bio: bioIndex !== -1 ? values[bioIndex]?.replace(/"/g, '').trim() : undefined,
        performance: performanceIndex !== -1 ? values[performanceIndex]?.replace(/"/g, '').trim() : undefined,
      });
    }
  }

  return data;
};

export const CSVImport = ({ open, onOpenChange, onImport, isImporting }: CSVImportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ContestantCSVRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = parseCSV(text);
        
        if (data.length === 0) {
          setError('No valid data found in CSV');
          setPreview([]);
          return;
        }

        setPreview(data);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file');
        setPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    
    try {
      await onImport(preview);
      setPreview([]);
      setFileName(null);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to import contestants');
    }
  };

  const handleClose = () => {
    setPreview([]);
    setFileName(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Contestants from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: name (required), bio (optional), performance (optional)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 py-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {fileName ? (
                <span className="text-foreground font-medium">{fileName}</span>
              ) : (
                'Click to upload CSV file'
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              CSV format: name, bio, performance
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {preview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Found {preview.length} contestant(s) to import
              </div>

              <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Bio</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                          {row.bio || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.performance || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {preview.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  ...and {preview.length - 10} more
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={preview.length === 0 || isImporting}>
            {isImporting ? 'Importing...' : `Import ${preview.length} Contestant(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
