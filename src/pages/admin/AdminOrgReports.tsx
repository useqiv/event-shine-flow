import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateRevenueReportPdf } from '@/lib/exportPdf';
import { exportToCsv, formatDateForExport, formatCurrencyForExport } from '@/lib/exportCsv';
import { getBaseAmountsByTransactionId } from '@/lib/baseAmount';
import { 
  Search, 
  FileText, 
  Download, 
  Building2, 
  TrendingUp,
  DollarSign,
  FileDown
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OrgRevenueData {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  totalRevenue: number;
  voteRevenue: number;
  ticketRevenue: number;
  netRevenue: number;
  commission: number;
  voteCount: number;
  ticketCount: number;
  payouts: { amount: number; status: string; date: string }[];
}

const AdminOrgReports: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  // Fetch all organizations with their revenue data
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['admin-org-reports'],
    queryFn: async () => {
      // Get all organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'organization');

      if (orgsError) throw orgsError;

      const orgIds = orgs?.map(o => o.user_id) || [];

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .in('id', orgIds);

      // Get all votes for these orgs
      const { data: contests } = await supabase
        .from('contests')
        .select('id, organization_id, vote_price')
        .in('organization_id', orgIds);

      const contestIds = contests?.map(c => c.id) || [];
      
      const { data: votes } = await supabase
        .from('votes')
        .select('contest_id, quantity, amount_paid, transaction_id')
        .in('contest_id', contestIds);

      const voteBaseAmountMap = await getBaseAmountsByTransactionId(
        votes?.map((v: any) => v.transaction_id) || []
      );

      // Get all tickets for these orgs
      const { data: events } = await supabase
        .from('events')
        .select('id, organization_id')
        .in('organization_id', orgIds);

      const eventIds = events?.map(e => e.id) || [];
      
      const { data: tickets } = await supabase
        .from('tickets')
        .select('event_id, quantity, amount_paid, transaction_id')
        .in('event_id', eventIds);

      const ticketBaseAmountMap = await getBaseAmountsByTransactionId(
        tickets?.map((t: any) => t.transaction_id) || []
      );

      // Get payouts
      const { data: payouts } = await supabase
        .from('payouts')
        .select('organization_id, amount, status, created_at')
        .in('organization_id', orgIds);

      // Get commission settings (platform default)
      const { data: commissionSettings } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .eq('category', 'commission');

      const defaultCommissionRate = Number(
        commissionSettings?.find(s => s.setting_key === 'platform_commission_percentage')?.setting_value
      ) || 10;

      // Get org-specific commission rates
      const { data: orgApprovals } = await supabase
        .from('organization_approvals')
        .select('organization_id, vote_commission_rate, ticket_commission_rate, special_commission_rate')
        .in('organization_id', orgIds);

      // Calculate revenue for each org
      const orgData: OrgRevenueData[] = profiles?.map(profile => {
        const orgContests = contests?.filter(c => c.organization_id === profile.id) || [];
        const orgContestIds = orgContests.map(c => c.id);
        const orgVotes = votes?.filter(v => orgContestIds.includes(v.contest_id)) || [];
        
        const orgEvents = events?.filter(e => e.organization_id === profile.id) || [];
        const orgEventIds = orgEvents.map(e => e.id);
        const orgTickets = tickets?.filter(t => orgEventIds.includes(t.event_id)) || [];

        // Use fee-free base amounts when available; fall back to stored amounts.
        // This ensures convenience fees never inflate revenue/commission/net in admin reports.
        const voteRevenue = orgVotes.reduce((sum, v: any) => {
          const base = voteBaseAmountMap.get(v.transaction_id) ?? v.amount_paid;
          return sum + (Number(base) || 0);
        }, 0);

        const ticketRevenue = orgTickets.reduce((sum, t: any) => {
          const base = ticketBaseAmountMap.get(t.transaction_id) ?? t.amount_paid;
          return sum + (Number(base) || 0);
        }, 0);

        const totalRevenue = voteRevenue + ticketRevenue;
        
        // Get org-specific commission rate or use platform default
        const orgApproval = orgApprovals?.find(a => a.organization_id === profile.id);
        const voteCommissionRate = orgApproval?.vote_commission_rate ?? orgApproval?.special_commission_rate ?? defaultCommissionRate;
        const ticketCommissionRate = orgApproval?.ticket_commission_rate ?? orgApproval?.special_commission_rate ?? defaultCommissionRate;
        
        const voteCommission = voteRevenue * (voteCommissionRate / 100);
        const ticketCommission = ticketRevenue * (ticketCommissionRate / 100);
        const commission = voteCommission + ticketCommission;
        const netRevenue = totalRevenue - commission;

        const orgPayouts = payouts?.filter(p => p.organization_id === profile.id) || [];

        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          created_at: profile.created_at,
          totalRevenue,
          voteRevenue,
          ticketRevenue,
          netRevenue,
          commission,
          voteCount: orgVotes.reduce((sum, v) => sum + v.quantity, 0),
          ticketCount: orgTickets.reduce((sum, t) => sum + t.quantity, 0),
          payouts: orgPayouts.map(p => ({
            amount: p.amount,
            status: p.status,
            date: format(new Date(p.created_at), 'MMM d, yyyy'),
          })),
        };
      }) || [];

      return orgData.sort((a, b) => b.totalRevenue - a.totalRevenue);
    },
  });

  const filteredOrgs = organizations?.filter(org => {
    const searchLower = searchQuery.toLowerCase();
    return (
      org.full_name?.toLowerCase().includes(searchLower) ||
      org.email?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleGenerateReport = async (org: OrgRevenueData) => {
    setGeneratingReport(org.id);
    try {
      generateRevenueReportPdf(
        org.full_name || org.email || 'Unknown Organization',
        {
          totalRevenue: org.totalRevenue,
          voteRevenue: org.voteRevenue,
          ticketRevenue: org.ticketRevenue,
          netRevenue: org.netRevenue,
          commission: org.commission,
          voteCount: org.voteCount,
          ticketCount: org.ticketCount,
          payouts: org.payouts,
        },
        'NGN'
      );
      toast.success('Revenue report generated');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleExportAll = () => {
    if (!organizations || organizations.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = organizations.map(org => ({
      organization_name: org.full_name || 'N/A',
      email: org.email || 'N/A',
      joined_date: formatDateForExport(org.created_at),
      total_revenue: formatCurrencyForExport(org.totalRevenue),
      vote_revenue: formatCurrencyForExport(org.voteRevenue),
      ticket_revenue: formatCurrencyForExport(org.ticketRevenue),
      commission: formatCurrencyForExport(org.commission),
      net_revenue: formatCurrencyForExport(org.netRevenue),
      total_votes: org.voteCount,
      total_tickets: org.ticketCount,
    }));

    exportToCsv(exportData, `organization-revenue-report-${format(new Date(), 'yyyy-MM-dd')}`, [
      { key: 'organization_name', label: 'Organization Name' },
      { key: 'email', label: 'Email' },
      { key: 'joined_date', label: 'Joined Date' },
      { key: 'total_revenue', label: 'Total Revenue (NGN)' },
      { key: 'vote_revenue', label: 'Vote Revenue (NGN)' },
      { key: 'ticket_revenue', label: 'Ticket Revenue (NGN)' },
      { key: 'commission', label: 'Platform Commission (NGN)' },
      { key: 'net_revenue', label: 'Net Revenue (NGN)' },
      { key: 'total_votes', label: 'Total Votes' },
      { key: 'total_tickets', label: 'Tickets Sold' },
    ]);

    toast.success('All organization reports exported');
  };

  const totalRevenue = organizations?.reduce((sum, o) => sum + o.totalRevenue, 0) || 0;
  const totalCommission = organizations?.reduce((sum, o) => sum + o.commission, 0) || 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Organization Revenue Reports</h1>
            <p className="text-muted-foreground text-sm sm:text-base">View and download revenue summaries for all organizations</p>
          </div>
          <Button onClick={handleExportAll} variant="outline" size="sm">
            <FileDown className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export All (CSV)</span>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Organizations</p>
                  <p className="text-2xl font-bold">{organizations?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Platform Revenue</p>
                  <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-chart-3" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Commission Earned</p>
                  <p className="text-2xl font-bold">₦{totalCommission.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Organizations</CardTitle>
            <CardDescription>Click "Generate PDF" to download individual revenue reports</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Net Revenue</TableHead>
                    <TableHead className="text-right">Votes</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{org.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{org.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₦{org.totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ₦{org.commission.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        ₦{org.netRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {org.voteCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {org.ticketCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateReport(org)}
                          disabled={generatingReport === org.id}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {generatingReport === org.id ? 'Generating...' : 'PDF'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredOrgs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No organizations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrgReports;
