import * as XLSX from 'xlsx';

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
) => {
  // Transform data according to columns
  const worksheetData = data.map(item => {
    const row: Record<string, any> = {};
    columns.forEach(col => {
      row[col.header] = item[col.key] ?? '';
    });
    return row;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // Set column widths
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  // Generate and download file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Contest report export
export const exportContestReport = (
  contest: {
    title: string;
    total_votes: number;
    vote_price: number;
    vote_currency: string;
  },
  contestants: Array<{
    name: string;
    vote_count: number;
    performance?: string;
  }>,
  votes: Array<{
    created_at: string;
    quantity: number;
    amount_paid: number;
    payment_method: string;
  }>
) => {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    { Metric: 'Contest Title', Value: contest.title },
    { Metric: 'Total Votes', Value: contest.total_votes },
    { Metric: 'Vote Price', Value: `${contest.vote_currency} ${contest.vote_price}` },
    { Metric: 'Total Revenue', Value: `${contest.vote_currency} ${contest.total_votes * contest.vote_price}` },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Contestants sheet
  const contestantsData = contestants.map((c, idx) => ({
    Rank: idx + 1,
    Name: c.name,
    Votes: c.vote_count,
    Performance: c.performance || 'N/A',
    Percentage: contest.total_votes > 0 
      ? `${((c.vote_count / contest.total_votes) * 100).toFixed(1)}%` 
      : '0%',
  }));
  const contestantsSheet = XLSX.utils.json_to_sheet(contestantsData);
  XLSX.utils.book_append_sheet(workbook, contestantsSheet, 'Contestants');

  // Votes sheet
  const votesData = votes.map(v => ({
    Date: new Date(v.created_at).toLocaleString(),
    Quantity: v.quantity,
    Amount: v.amount_paid,
    'Payment Method': v.payment_method,
  }));
  const votesSheet = XLSX.utils.json_to_sheet(votesData);
  XLSX.utils.book_append_sheet(workbook, votesSheet, 'Votes');

  XLSX.writeFile(workbook, `${contest.title.replace(/[^a-zA-Z0-9]/g, '_')}_report.xlsx`);
};

// Event report export
export const exportEventReport = (
  event: {
    title: string;
    venue: string;
    event_date: string;
  },
  ticketTypes: Array<{
    name: string;
    price: number;
    currency: string;
    quantity_sold: number;
    quantity_available: number;
  }>,
  tickets: Array<{
    created_at: string;
    quantity: number;
    amount_paid: number;
    status: string;
  }>
) => {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const totalRevenue = tickets.reduce((sum, t) => sum + t.amount_paid, 0);
  const totalSold = tickets.reduce((sum, t) => sum + t.quantity, 0);
  
  const summaryData = [
    { Metric: 'Event Title', Value: event.title },
    { Metric: 'Venue', Value: event.venue },
    { Metric: 'Date', Value: new Date(event.event_date).toLocaleDateString() },
    { Metric: 'Total Tickets Sold', Value: totalSold },
    { Metric: 'Total Revenue', Value: totalRevenue },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Ticket Types sheet
  const typesData = ticketTypes.map(t => ({
    Name: t.name,
    Price: `${t.currency} ${t.price}`,
    Sold: t.quantity_sold,
    Available: t.quantity_available,
    Revenue: `${t.currency} ${t.price * t.quantity_sold}`,
  }));
  const typesSheet = XLSX.utils.json_to_sheet(typesData);
  XLSX.utils.book_append_sheet(workbook, typesSheet, 'Ticket Types');

  // Tickets sheet
  const ticketsData = tickets.map(t => ({
    Date: new Date(t.created_at).toLocaleString(),
    Quantity: t.quantity,
    Amount: t.amount_paid,
    Status: t.status,
  }));
  const ticketsSheet = XLSX.utils.json_to_sheet(ticketsData);
  XLSX.utils.book_append_sheet(workbook, ticketsSheet, 'Tickets');

  XLSX.writeFile(workbook, `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_report.xlsx`);
};

// Campaign report export
export const exportCampaignReport = (
  campaign: {
    title: string;
    goal_amount: number;
    current_amount: number;
    currency: string;
    donor_count: number;
  },
  donations: Array<{
    created_at: string;
    amount: number;
    is_anonymous: boolean;
    status: string;
  }>
) => {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    { Metric: 'Campaign Title', Value: campaign.title },
    { Metric: 'Goal Amount', Value: `${campaign.currency} ${campaign.goal_amount}` },
    { Metric: 'Amount Raised', Value: `${campaign.currency} ${campaign.current_amount}` },
    { Metric: 'Progress', Value: `${((campaign.current_amount / campaign.goal_amount) * 100).toFixed(1)}%` },
    { Metric: 'Total Donors', Value: campaign.donor_count },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Donations sheet
  const donationsData = donations.map(d => ({
    Date: new Date(d.created_at).toLocaleString(),
    Amount: d.amount,
    'Anonymous': d.is_anonymous ? 'Yes' : 'No',
    Status: d.status,
  }));
  const donationsSheet = XLSX.utils.json_to_sheet(donationsData);
  XLSX.utils.book_append_sheet(workbook, donationsSheet, 'Donations');

  XLSX.writeFile(workbook, `${campaign.title.replace(/[^a-zA-Z0-9]/g, '_')}_report.xlsx`);
};
