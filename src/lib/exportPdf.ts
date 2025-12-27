/**
 * Simple PDF generation utility using browser's print functionality
 * Creates a styled HTML page that can be printed/saved as PDF
 */

interface PdfColumn {
  key: string;
  label: string;
  width?: string;
}

interface PdfOptions {
  title: string;
  subtitle?: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
}

const getNestedValue = (obj: Record<string, any>, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

export const exportToPdf = (
  data: Record<string, any>[],
  columns: PdfColumn[],
  options: PdfOptions
) => {
  const { title, subtitle, filename, orientation = 'portrait' } = options;
  
  // Generate table rows
  const tableRows = data.map(row => 
    `<tr>${columns.map(col => {
      let value = getNestedValue(row, col.key);
      if (value === null || value === undefined) value = '';
      return `<td style="padding: 8px; border: 1px solid #ddd;">${value}</td>`;
    }).join('')}</tr>`
  ).join('');

  // Create styled HTML document
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} - ${filename}</title>
      <style>
        @page { size: ${orientation}; margin: 20mm; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .header h1 { 
          margin: 0 0 10px 0; 
          font-size: 24px;
          color: #111;
        }
        .header p { 
          margin: 0; 
          color: #666;
          font-size: 14px;
        }
        .meta { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 20px;
          font-size: 12px;
          color: #666;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
          font-size: 12px;
        }
        th { 
          background-color: #f8f9fa; 
          padding: 10px 8px; 
          text-align: left;
          border: 1px solid #ddd;
          font-weight: 600;
        }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 11px;
          color: #999;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
      </div>
      <div class="meta">
        <span>Generated: ${new Date().toLocaleString()}</span>
        <span>Total Records: ${data.length}</span>
      </div>
      <table>
        <thead>
          <tr>${columns.map(col => `<th style="${col.width ? `width: ${col.width}` : ''}">${col.label}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div class="footer">
        VotePass Admin - Confidential Document
      </div>
    </body>
    </html>
  `;

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
};

/**
 * Generate a revenue report PDF for an organization
 */
export const generateRevenueReportPdf = (
  orgName: string,
  data: {
    totalRevenue: number;
    voteRevenue: number;
    ticketRevenue: number;
    netRevenue: number;
    commission: number;
    voteCount: number;
    ticketCount: number;
    payouts: { amount: number; status: string; date: string }[];
  },
  currency: string = 'NGN'
) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const payoutRows = data.payouts.map(p => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.date}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(p.amount)}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">
        <span style="padding: 2px 8px; border-radius: 4px; background: ${
          p.status === 'completed' ? '#dcfce7' : p.status === 'pending' ? '#fef9c3' : '#fee2e2'
        }; color: ${
          p.status === 'completed' ? '#166534' : p.status === 'pending' ? '#854d0e' : '#991b1b'
        };">${p.status}</span>
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Revenue Report - ${orgName}</title>
      <style>
        @page { size: portrait; margin: 20mm; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #2563eb;
        }
        .header h1 { 
          margin: 0 0 10px 0; 
          font-size: 28px;
          color: #1f2937;
        }
        .header .org-name {
          font-size: 20px;
          color: #2563eb;
          font-weight: 600;
        }
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }
        .card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .card.highlight {
          background: #dcfce7;
          border-color: #22c55e;
        }
        .card h3 { margin: 0 0 8px 0; font-size: 14px; color: #64748b; }
        .card p { margin: 0; font-size: 24px; font-weight: 700; color: #1f2937; }
        .card.highlight p { color: #16a34a; }
        .section { margin-bottom: 30px; }
        .section h2 { 
          font-size: 18px; 
          margin-bottom: 15px; 
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { background: #f1f5f9; padding: 12px 8px; text-align: left; border: 1px solid #e2e8f0; }
        .breakdown { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .breakdown span:first-child { color: #64748b; }
        .breakdown span:last-child { font-weight: 600; }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          font-size: 12px; 
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Revenue Report</h1>
        <p class="org-name">${orgName}</p>
        <p style="color: #6b7280; font-size: 14px;">Generated on ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        })}</p>
      </div>

      <div class="summary-cards">
        <div class="card">
          <h3>Total Revenue</h3>
          <p>${formatCurrency(data.totalRevenue)}</p>
        </div>
        <div class="card">
          <h3>Platform Commission</h3>
          <p style="color: #dc2626;">${formatCurrency(data.commission)}</p>
        </div>
        <div class="card highlight">
          <h3>Net Revenue</h3>
          <p>${formatCurrency(data.netRevenue)}</p>
        </div>
      </div>

      <div class="section">
        <h2>Revenue Breakdown</h2>
        <div class="breakdown">
          <span>Vote Revenue (${data.voteCount.toLocaleString()} votes)</span>
          <span>${formatCurrency(data.voteRevenue)}</span>
        </div>
        <div class="breakdown">
          <span>Ticket Revenue (${data.ticketCount.toLocaleString()} tickets)</span>
          <span>${formatCurrency(data.ticketRevenue)}</span>
        </div>
      </div>

      ${data.payouts.length > 0 ? `
      <div class="section">
        <h2>Payout History</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${payoutRows}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="footer">
        <p>VotePass Revenue Report - Confidential</p>
        <p>This document is auto-generated and serves as an official record of organization earnings.</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
};
