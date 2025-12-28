import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface DashboardStats {
  total_users?: number;
  total_organizations?: number;
  active_contests?: number;
  active_events?: number;
  total_revenue?: number;
  pending_payouts?: number;
  total_votes?: number;
  total_tickets_sold?: number;
  pending_fraud_alerts?: number;
  pending_content_reviews?: number;
  pending_org_approvals?: number;
}

interface DashboardExportButtonProps {
  stats: DashboardStats | undefined;
}

const DashboardExportButton: React.FC<DashboardExportButtonProps> = ({ stats }) => {
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getExportData = () => {
    if (!stats) return [];

    return [
      { category: 'Users & Organizations', metric: 'Total Users', value: stats.total_users?.toLocaleString() || '0' },
      { category: 'Users & Organizations', metric: 'Total Organizations', value: stats.total_organizations?.toLocaleString() || '0' },
      { category: 'Active Content', metric: 'Active Contests', value: stats.active_contests?.toLocaleString() || '0' },
      { category: 'Active Content', metric: 'Active Events', value: stats.active_events?.toLocaleString() || '0' },
      { category: 'Revenue', metric: 'Total Revenue', value: formatCurrency(stats.total_revenue || 0) },
      { category: 'Revenue', metric: 'Pending Payouts', value: formatCurrency(stats.pending_payouts || 0) },
      { category: 'Activity', metric: 'Total Votes', value: stats.total_votes?.toLocaleString() || '0' },
      { category: 'Activity', metric: 'Tickets Sold', value: stats.total_tickets_sold?.toLocaleString() || '0' },
      { category: 'Pending Actions', metric: 'Fraud Alerts', value: stats.pending_fraud_alerts?.toLocaleString() || '0' },
      { category: 'Pending Actions', metric: 'Content Reviews', value: stats.pending_content_reviews?.toLocaleString() || '0' },
      { category: 'Pending Actions', metric: 'Org Approvals', value: stats.pending_org_approvals?.toLocaleString() || '0' },
    ];
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const exportDate = format(new Date(), 'PPpp');
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('VotePass Admin Dashboard Report', 14, 22);
      
      // Subtitle with date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${exportDate}`, 14, 30);
      
      // Summary stats in a highlighted box
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(14, 38, 182, 35, 3, 3, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('Key Highlights', 20, 48);
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Revenue: ${formatCurrency(stats?.total_revenue || 0)}`, 20, 58);
      doc.text(`Total Users: ${stats?.total_users?.toLocaleString() || 0}`, 20, 66);
      doc.text(`Active Contests: ${stats?.active_contests || 0}`, 110, 58);
      doc.text(`Active Events: ${stats?.active_events || 0}`, 110, 66);

      // Detailed metrics table
      const tableData = getExportData();
      
      autoTable(doc, {
        startY: 80,
        head: [['Category', 'Metric', 'Value']],
        body: tableData.map(row => [row.category, row.metric, row.value]),
        headStyles: {
          fillColor: [239, 68, 68],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 60 },
          2: { cellWidth: 60, halign: 'right' },
        },
      });

      // Pending Actions Summary
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      
      if (stats?.pending_fraud_alerts || stats?.pending_content_reviews || stats?.pending_org_approvals) {
        doc.setFontSize(12);
        doc.setTextColor(220, 38, 38);
        doc.text('⚠ Items Requiring Attention', 14, finalY + 15);
        
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        let yPos = finalY + 25;
        
        if (stats?.pending_fraud_alerts && stats.pending_fraud_alerts > 0) {
          doc.text(`• ${stats.pending_fraud_alerts} fraud alert(s) pending review`, 20, yPos);
          yPos += 8;
        }
        if (stats?.pending_content_reviews && stats.pending_content_reviews > 0) {
          doc.text(`• ${stats.pending_content_reviews} content item(s) awaiting moderation`, 20, yPos);
          yPos += 8;
        }
        if (stats?.pending_org_approvals && stats.pending_org_approvals > 0) {
          doc.text(`• ${stats.pending_org_approvals} organization(s) pending approval`, 20, yPos);
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `VotePass Admin Report - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      doc.save(`votepass-dashboard-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const exportDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
      const data = getExportData();
      
      // Create CSV content
      const headers = ['Category', 'Metric', 'Value'];
      const csvContent = [
        `VotePass Admin Dashboard Report`,
        `Generated: ${exportDate}`,
        '',
        headers.join(','),
        ...data.map(row => `"${row.category}","${row.metric}","${row.value}"`)
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `votepass-dashboard-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV report downloaded successfully');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting || !stats}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2 text-red-500" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DashboardExportButton;
