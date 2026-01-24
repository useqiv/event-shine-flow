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

/**
 * Escape HTML special characters to prevent XSS attacks
 * This is critical for PDF exports where user-provided data is embedded in HTML
 */
const escapeHtml = (str: string): string => {
  if (typeof str !== 'string') {
    str = String(str ?? '');
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const exportToPdf = (
  data: Record<string, any>[],
  columns: PdfColumn[],
  options: PdfOptions
) => {
  const { title, subtitle, filename, orientation = 'portrait' } = options;
  
  // Generate table rows with HTML escaping for XSS protection
  const tableRows = data.map(row => 
    `<tr>${columns.map(col => {
      let value = getNestedValue(row, col.key);
      if (value === null || value === undefined) value = '';
      return `<td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(String(value))}</td>`;
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
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
      </div>
      <div class="meta">
        <span>Generated: ${new Date().toLocaleString()}</span>
        <span>Total Records: ${data.length}</span>
      </div>
      <table>
        <thead>
          <tr>${columns.map(col => `<th style="${col.width ? `width: ${col.width}` : ''}">${escapeHtml(col.label)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div class="footer">
        Useqiv Admin - Confidential Document
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
        <p>Useqiv Revenue Report - Confidential</p>
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

/**
 * Generate a donation receipt PDF
 */
export const generateDonationReceiptPdf = (donation: {
  id: string;
  amount: number;
  currency: string;
  created_at: string;
  donor_message?: string | null;
  payment_method: string;
  status: string;
  campaign: {
    title: string;
    image_url?: string | null;
  };
  donor?: {
    name?: string | null;
    email?: string | null;
  };
}) => {
  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formattedDate = new Date(donation.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const receiptNumber = `DON-${donation.id.slice(0, 8).toUpperCase()}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Donation Receipt - ${receiptNumber}</title>
      <style>
        @page { size: portrait; margin: 20mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1f2937;
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
        }
        .receipt {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 40px;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px dashed #e5e7eb;
        }
        .logo {
          font-size: 28px;
          font-weight: 800;
          color: #2563eb;
          margin-bottom: 8px;
        }
        .receipt-title {
          font-size: 14px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .receipt-number {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 8px;
        }
        .amount-section {
          text-align: center;
          padding: 30px 0;
          background: linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%);
          border-radius: 12px;
          margin-bottom: 30px;
        }
        .amount-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .amount {
          font-size: 42px;
          font-weight: 700;
          color: #1f2937;
        }
        .status {
          display: inline-block;
          margin-top: 12px;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: ${donation.status === 'completed' ? '#dcfce7' : '#fef9c3'};
          color: ${donation.status === 'completed' ? '#166534' : '#854d0e'};
        }
        .details {
          margin-bottom: 30px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #6b7280;
          font-size: 14px;
        }
        .detail-value {
          font-weight: 600;
          font-size: 14px;
          text-align: right;
          max-width: 60%;
        }
        .campaign-section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .campaign-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .campaign-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        .message-section {
          background: #fefce8;
          border-left: 4px solid #facc15;
          padding: 16px;
          border-radius: 0 8px 8px 0;
          margin-bottom: 30px;
        }
        .message-label {
          font-size: 12px;
          color: #854d0e;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .message-text {
          font-size: 14px;
          color: #713f12;
          font-style: italic;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 2px dashed #e5e7eb;
        }
        .thank-you {
          font-size: 20px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 8px;
        }
        .footer-text {
          font-size: 12px;
          color: #9ca3af;
        }
        @media print {
          body { padding: 0; }
          .receipt { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">Useqiv</div>
          <div class="receipt-title">Donation Receipt</div>
          <div class="receipt-number">${receiptNumber}</div>
        </div>

        <div class="amount-section">
          <div class="amount-label">Donation Amount</div>
          <div class="amount">${formatCurrency(donation.amount, donation.currency)}</div>
          <span class="status">${donation.status === 'completed' ? '✓ Completed' : donation.status}</span>
        </div>

        <div class="campaign-section">
          <div class="campaign-label">Donated to</div>
          <div class="campaign-title">${donation.campaign.title}</div>
        </div>

        <div class="details">
          <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">${formattedDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method</span>
            <span class="detail-value">${donation.payment_method.charAt(0).toUpperCase() + donation.payment_method.slice(1)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Transaction ID</span>
            <span class="detail-value">${donation.id.slice(0, 12).toUpperCase()}</span>
          </div>
          ${donation.donor?.name ? `
          <div class="detail-row">
            <span class="detail-label">Donor</span>
            <span class="detail-value">${donation.donor.name}</span>
          </div>
          ` : ''}
          ${donation.donor?.email ? `
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">${donation.donor.email}</span>
          </div>
          ` : ''}
        </div>

        ${donation.donor_message ? `
        <div class="message-section">
          <div class="message-label">Your Message</div>
          <div class="message-text">"${donation.donor_message}"</div>
        </div>
        ` : ''}

        <div class="footer">
          <div class="thank-you">Thank You! 💙</div>
          <div class="footer-text">Your generosity makes a difference.</div>
          <div class="footer-text" style="margin-top: 8px;">This receipt was generated on ${new Date().toLocaleDateString()}</div>
        </div>
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

/**
 * Export revenue analytics data as a PDF report
 */
interface RevenueDataPoint {
  date: string;
  tickets: number;
  votes: number;
  total: number;
}

interface RevenueReportOptions {
  data: RevenueDataPoint[];
  currency: string;
  dateRange: number;
  companyName?: string;
  totalRevenue: number;
  ticketRevenue: number;
  voteRevenue: number;
  netRevenue: number;
  commissionRate: number;
}

export const exportRevenuePdf = ({
  data,
  currency,
  dateRange,
  companyName = 'Your Organization',
  totalRevenue,
  ticketRevenue,
  voteRevenue,
  netRevenue,
  commissionRate,
}: RevenueReportOptions) => {
  const formatCurrencyLocal = (amount: number) => {
    const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const tableRows = data.map(row => `
    <tr>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${row.date}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrencyLocal(row.tickets)}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrencyLocal(row.votes)}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrencyLocal(row.total)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Revenue Analytics Report - ${companyName}</title>
      <style>
        @page { size: portrait; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 30px;
          color: #1f2937;
          max-width: 800px;
          margin: 0 auto;
          background: #fff;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #7c3aed;
        }
        .header h1 { 
          font-size: 26px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .header .org-name {
          font-size: 18px;
          color: #7c3aed;
          font-weight: 600;
        }
        .header .date-info {
          font-size: 13px;
          color: #6b7280;
          margin-top: 8px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        .summary-card.net {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          border-color: #22c55e;
        }
        .summary-card h3 { 
          margin-bottom: 6px; 
          font-size: 11px; 
          color: #64748b; 
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-card .value { 
          font-size: 18px; 
          font-weight: 700; 
          color: #1f2937; 
        }
        .summary-card.net .value { color: #16a34a; }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 13px;
          margin-bottom: 30px;
        }
        th { 
          background: #7c3aed; 
          color: white;
          padding: 12px 8px; 
          text-align: left;
          font-weight: 600;
        }
        th:not(:first-child) { text-align: right; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { 
          margin-top: 30px; 
          text-align: center; 
          font-size: 11px; 
          color: #9ca3af;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Revenue Analytics Report</h1>
        <p class="org-name">${companyName}</p>
        <p class="date-info">Last ${dateRange} Days • Generated on ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        })}</p>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Revenue</h3>
          <div class="value">${formatCurrencyLocal(totalRevenue)}</div>
        </div>
        <div class="summary-card">
          <h3>Ticket Sales</h3>
          <div class="value">${formatCurrencyLocal(ticketRevenue)}</div>
        </div>
        <div class="summary-card">
          <h3>Vote Revenue</h3>
          <div class="value">${formatCurrencyLocal(voteRevenue)}</div>
        </div>
        <div class="summary-card net">
          <h3>Net (${100 - commissionRate}%)</h3>
          <div class="value">${formatCurrencyLocal(netRevenue)}</div>
        </div>
      </div>

      <h2 class="section-title">Daily Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Ticket Sales</th>
            <th>Vote Revenue</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="footer">
        <p>Commission Rate: ${commissionRate}% • Currency: ${currency}</p>
        <p style="margin-top: 4px;">Report generated by Useqiv • Confidential</p>
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
  
  return `revenue-report-${new Date().toISOString().slice(0, 10)}.pdf`;
};
