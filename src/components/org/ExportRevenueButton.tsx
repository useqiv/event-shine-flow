import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useOrganizationStats, usePayouts, useOrganizationSettings } from '@/hooks/useOrganization';
import { useRevenueTrends } from '@/hooks/useRevenueTrends';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateRevenueReportPdf, exportRevenuePdf } from '@/lib/exportPdf';
import { exportToExcel } from '@/lib/exportExcel';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ExportRevenueButtonProps {
  currency?: string;
}

const ExportRevenueButton = ({ currency = 'USD' }: ExportRevenueButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { data: stats } = useOrganizationStats();
  const { data: payouts } = usePayouts();
  const { data: orgSettings } = useOrganizationSettings();
  const { data: revenueTrends } = useRevenueTrends(30, currency);

  // Fetch commission settings
  const { data: commissionSettings } = useQuery({
    queryKey: ['platform-commission-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .eq('category', 'commission');
      
      if (error) throw error;
      
      const settings: Record<string, number> = {};
      data?.forEach((s: any) => {
        settings[s.setting_key] = Number(s.setting_value) || 0;
      });
      return settings;
    },
  });

  // Fetch organization-specific commission rates
  const { data: orgApproval } = useQuery({
    queryKey: ['org-approval-commission'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('organization_approvals')
        .select('vote_commission_rate, ticket_commission_rate, special_commission_rate')
        .eq('organization_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const platformVoteCommission = commissionSettings?.vote_commission_percentage || 10;
      const platformTicketCommission = commissionSettings?.ticket_commission_percentage || 10;
      
      const voteCommission = orgApproval?.vote_commission_rate ?? orgApproval?.special_commission_rate ?? platformVoteCommission;
      const ticketCommission = orgApproval?.ticket_commission_rate ?? orgApproval?.special_commission_rate ?? platformTicketCommission;

      const getRevenueForCurrency = (revenueByCurrency: Record<string, number> | undefined) => {
        if (!revenueByCurrency) return 0;
        return revenueByCurrency[currency] || 0;
      };

      const voteRevenue = getRevenueForCurrency(stats?.voteRevenueByCurrency);
      const ticketRevenue = getRevenueForCurrency(stats?.ticketRevenueByCurrency);
      const totalRevenue = voteRevenue + ticketRevenue;
      
      const netVoteRevenue = voteRevenue * (1 - voteCommission / 100);
      const netTicketRevenue = ticketRevenue * (1 - ticketCommission / 100);
      const netRevenue = netVoteRevenue + netTicketRevenue;
      const commission = totalRevenue - netRevenue;

      const payoutHistory = (payouts || []).map(p => ({
        amount: p.amount,
        status: p.status,
        date: format(new Date(p.created_at), 'MMM d, yyyy'),
      }));

      generateRevenueReportPdf(
        orgSettings?.company_name || 'Your Organization',
        {
          totalRevenue,
          voteRevenue,
          ticketRevenue,
          netRevenue,
          commission,
          voteCount: stats?.totalVotes || 0,
          ticketCount: stats?.ticketsSold || 0,
          payouts: payoutHistory,
        },
        currency
      );

      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDetailedPdf = async () => {
    setIsExporting(true);
    try {
      if (!revenueTrends || revenueTrends.length === 0) {
        toast.error('No revenue data available to export');
        return;
      }

      const platformVoteCommission = commissionSettings?.vote_commission_percentage || 10;
      const platformTicketCommission = commissionSettings?.ticket_commission_percentage || 10;
      
      const voteCommission = orgApproval?.vote_commission_rate ?? orgApproval?.special_commission_rate ?? platformVoteCommission;
      const ticketCommission = orgApproval?.ticket_commission_rate ?? orgApproval?.special_commission_rate ?? platformTicketCommission;
      const avgCommission = (voteCommission + ticketCommission) / 2;

      const getRevenueForCurrency = (revenueByCurrency: Record<string, number> | undefined) => {
        if (!revenueByCurrency) return 0;
        return revenueByCurrency[currency] || 0;
      };

      const voteRevenue = getRevenueForCurrency(stats?.voteRevenueByCurrency);
      const ticketRevenue = getRevenueForCurrency(stats?.ticketRevenueByCurrency);
      const totalRevenue = voteRevenue + ticketRevenue;
      const netRevenue = totalRevenue * (1 - avgCommission / 100);

      exportRevenuePdf({
        data: revenueTrends,
        currency,
        dateRange: 30,
        companyName: orgSettings?.company_name || 'Your Organization',
        totalRevenue,
        ticketRevenue,
        voteRevenue,
        netRevenue,
        commissionRate: avgCommission,
      });

      toast.success('Detailed revenue report generated');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to generate detailed report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      if (!revenueTrends || revenueTrends.length === 0) {
        toast.error('No revenue data available to export');
        return;
      }

      const excelData = revenueTrends.map(d => ({
        Date: d.date,
        TicketRevenue: d.tickets,
        VoteRevenue: d.votes,
        TotalRevenue: d.total,
      }));

      exportToExcel(excelData, [
        { key: 'Date', header: 'Date' },
        { key: 'TicketRevenue', header: `Ticket Revenue (${currency})` },
        { key: 'VoteRevenue', header: `Vote Revenue (${currency})` },
        { key: 'TotalRevenue', header: `Total Revenue (${currency})` },
      ], `Revenue_Report_${format(new Date(), 'yyyy-MM-dd')}`);

      toast.success('Excel report generated');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to generate Excel report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={handleExportPdf}>
          <FileText className="h-4 w-4 mr-2" />
          Summary Report (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportDetailedPdf}>
          <FileText className="h-4 w-4 mr-2" />
          Detailed Report (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Revenue Data (Excel)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportRevenueButton;
