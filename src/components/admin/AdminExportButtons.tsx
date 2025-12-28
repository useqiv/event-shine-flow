import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCsv, formatDateForExport } from '@/lib/exportCsv';
import { exportToExcel } from '@/lib/exportExcel';
import { format } from 'date-fns';

interface ExportColumn {
  key: string;
  label: string;
}

interface AdminExportButtonsProps {
  data: Record<string, unknown>[] | undefined;
  columns: ExportColumn[];
  filename: string;
  title?: string;
}

const AdminExportButtons: React.FC<AdminExportButtonsProps> = ({
  data,
  columns,
  filename,
  title = 'Export Data',
}) => {
  const handleExportCsv = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = data.map(item => {
      const row: Record<string, unknown> = {};
      columns.forEach(col => {
        let value = item[col.key];
        if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
          value = formatDateForExport(value as string);
        }
        row[col.key] = value;
      });
      return row;
    });

    exportToCsv(exportData, `${filename}-${format(new Date(), 'yyyy-MM-dd')}`, columns);
    toast.success(`${title} exported as CSV`);
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = data.map(item => {
      const row: Record<string, unknown> = {};
      columns.forEach(col => {
        let value = item[col.key];
        if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
          value = formatDateForExport(value as string);
        }
        row[col.key] = value ?? '';
      });
      return row;
    });

    const excelColumns = columns.map(col => ({
      header: col.label,
      key: col.key,
      width: 20,
    }));

    exportToExcel(exportData, excelColumns, `${filename}-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success(`${title} exported as Excel`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCsv}>
          <FileDown className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminExportButtons;
