/**
 * Converts an array of objects to CSV format and triggers download
 */
export const exportToCsv = (data: Record<string, any>[], filename: string, headers?: { key: string; label: string }[]) => {
  if (!data || data.length === 0) {
    return;
  }

  // Determine headers from provided headers or first object keys
  const csvHeaders = headers 
    ? headers.map(h => h.label) 
    : Object.keys(data[0]);
  
  const headerKeys = headers 
    ? headers.map(h => h.key) 
    : Object.keys(data[0]);

  // Build CSV content with formula injection protection
  const csvRows = [
    csvHeaders.join(','), // Header row
    ...data.map(row => 
      headerKeys.map(key => {
        let value = getNestedValue(row, key);
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          value = '';
        }
        
        // Convert to string
        value = String(value);
        
        // CSV Formula Injection Protection: Prefix formula characters with single quote
        // This prevents Excel/Sheets from interpreting values as formulas
        // Characters that trigger formula execution: = + - @ TAB CR
        if (/^[=+\-@\t\r]/.test(value)) {
          value = `'${value}`;
        }
        
        // Escape quotes
        value = value.replace(/"/g, '""');
        
        // Wrap in quotes if contains comma, newline, or quotes
        if (value.includes(',') || value.includes('\n') || value.includes('"') || value.includes("'")) {
          value = `"${value}"`;
        }
        
        return value;
      }).join(',')
    )
  ];

  const csvContent = csvRows.join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Get nested value from object using dot notation
 */
const getNestedValue = (obj: Record<string, any>, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

/**
 * Format date for CSV export
 */
export const formatDateForExport = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format currency for CSV export
 */
export const formatCurrencyForExport = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(num) ? '0' : num.toLocaleString('en-NG');
};
