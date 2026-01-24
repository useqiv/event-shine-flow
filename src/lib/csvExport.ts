/**
 * CSV export utility functions
 * Provides secure CSV generation with proper escaping
 */

import { format } from 'date-fns';

/**
 * Escape a value for CSV to prevent formula injection and handle special characters
 */
export const escapeCSVValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // Check for formula injection patterns
  const formulaPatterns = /^[=+\-@\t\r]/;
  if (formulaPatterns.test(stringValue)) {
    return `'${stringValue}`;
  }
  
  // Escape double quotes and wrap in quotes if contains special chars
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

/**
 * Generate CSV content from headers and rows
 */
export const generateCSV = (
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string => {
  const escapedHeaders = headers.map(escapeCSVValue);
  const escapedRows = rows.map(row => row.map(escapeCSVValue));
  
  return [escapedHeaders.join(','), ...escapedRows.map(r => r.join(','))].join('\n');
};

/**
 * Download CSV content as a file
 */
export const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Generate a timestamped filename for exports
 */
export const generateExportFilename = (prefix: string, extension: string = 'csv'): string => {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  return `${prefix}-${timestamp}.${extension}`;
};

/**
 * Export data to CSV with automatic filename generation
 */
export const exportToCSV = (
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filenamePrefix: string
): void => {
  const content = generateCSV(headers, rows);
  const filename = generateExportFilename(filenamePrefix);
  downloadCSV(content, filename);
};
