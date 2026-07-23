import React, { useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminContests } from '@/hooks/useAdminData';
import { Search, MoreHorizontal, Eye, Pause, Play, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getBaseAmountsByTransactionId } from '@/lib/baseAmount';
import { fetchPlatformCommissionSettings } from '@/lib/platformCommission';
import { generateContestReportPdf } from '@/lib/exportPdf';

const AdminContests: React.FC = () => {
  const { data: contests, isLoading } = useAdminContests();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingContestReport, setGeneratingContestReport] = useState<string | null>(null);

  const filteredContests = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return (
      contests?.filter(
        (contest) =>
          contest.title?.toLowerCase().includes(q) || contest.category?.toLowerCase().includes(q)
      ) || []
    );
  }, [contests, searchQuery]);

  const toggleContestStatus = async (contestId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('contests')
      .update({ is_active: !currentStatus })
      .eq('id', contestId);

    if (error) {
      toast.error('Failed to update contest');
    } else {
      toast.success(currentStatus ? 'Contest paused' : 'Contest activated');
      queryClient.invalidateQueries({ queryKey: ['admin-all-contests'] });
    }
  };

  const getContestStatusLabel = (contest: any) => {
    const now = new Date();
    const startDate = new Date(contest.start_date);
    const endDate = new Date(contest.end_date);

    if (!contest.is_active) return 'Paused';
    if (now < startDate) return 'Upcoming';
    if (now > endDate) return 'Ended';
    return 'Active';
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleDownloadContestReportPdf = async (contestId: string) => {
    setGeneratingContestReport(contestId);
    try {
      const { data: contest, error: contestError } = await supabase
        .from('contests')
        .select('id, title, category, start_date, end_date, is_active, vote_price, vote_currency, organization_id, commission_rate')
        .eq('id', contestId)
        .single();

      if (contestError) throw contestError;
      if (!contest) throw new Error('Contest not found');

      const { data: org } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', contest.organization_id)
        .maybeSingle();

      // Fetch votes (fee-free base amount when available)
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('quantity, amount_paid, transaction_id')
        .eq('contest_id', contest.id);
      if (votesError) throw votesError;

      const baseAmountMap = await getBaseAmountsByTransactionId(
        votes?.map((v: any) => v.transaction_id) || []
      );

      // Fallback pricing that is fee-free (do not fall back to amount_paid, which may include convenience fee)
      const { data: voteOptions } = await supabase
        .from('contest_vote_options')
        .select('vote_quantity, price')
        .eq('contest_id', contest.id);
      const voteOptionPriceMap = new Map<string, number>();
      voteOptions?.forEach((o: any) => {
        voteOptionPriceMap.set(String(o.vote_quantity), Number(o.price) || 0);
      });

      const totalVotes = (votes || []).reduce((sum: number, v: any) => sum + (Number(v.quantity) || 0), 0);
      const totalRevenue = (votes || []).reduce((sum: number, v: any) => {
        const qty = Number(v.quantity) || 0;
        const optionPrice = voteOptionPriceMap.get(String(qty));
        const votePrice = Number(contest.vote_price) || 0;
        const base =
          baseAmountMap.get(v.transaction_id) ??
          optionPrice ??
          (votePrice > 0 ? votePrice * qty : 0);
        return sum + (Number(base) || 0);
      }, 0);

      // Commission rate: contest override -> org approval -> platform default
      let commissionRate =
        contest.commission_rate != null ? Number(contest.commission_rate) || 0 : NaN;

      if (!Number.isFinite(commissionRate)) {
        const { data: approval } = await supabase
          .from('organization_approvals')
          .select('vote_commission_rate, special_commission_rate')
          .eq('organization_id', contest.organization_id)
          .maybeSingle();
        commissionRate = Number(approval?.vote_commission_rate ?? approval?.special_commission_rate);
      }

      if (!Number.isFinite(commissionRate)) {
        const platformSettings = await fetchPlatformCommissionSettings();
        commissionRate =
          platformSettings.vote_commission_percentage ||
          platformSettings.platform_commission_percentage ||
          10;
      }

      const commissionAmount = totalRevenue * (commissionRate / 100);
      const netRevenue = totalRevenue - commissionAmount;

      // Top contestants
      const { data: contestants, error: contestantsError } = await supabase
        .from('contestants')
        .select('name, vote_count')
        .eq('contest_id', contest.id)
        .order('vote_count', { ascending: false })
        .limit(10);
      if (contestantsError) throw contestantsError;

      const votePrice = Number(contest.vote_price) || 0;
      const topContestants =
        contestants?.map((c: any) => ({
          name: c.name || 'Unknown',
          votes: Number(c.vote_count) || 0,
          revenue: (Number(c.vote_count) || 0) * votePrice,
        })) || [];

      generateContestReportPdf({
        contestTitle: contest.title || 'Untitled Contest',
        contestCategory: contest.category,
        organizationName: org?.full_name || null,
        organizationEmail: org?.email || null,
        statusLabel: getContestStatusLabel(contest),
        startDate: format(new Date(contest.start_date), 'MMM d, yyyy'),
        endDate: format(new Date(contest.end_date), 'MMM d, yyyy'),
        currency: contest.vote_currency || 'NGN',
        votePrice,
        totalVotes,
        totalRevenue,
        commissionRate,
        commissionAmount,
        netRevenue,
        topContestants,
      });
      toast.success('Contest report ready for download');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to generate contest report');
    } finally {
      setGeneratingContestReport(null);
    }
  };

  const getStatusBadge = (contest: any) => {
    const now = new Date();
    const startDate = new Date(contest.start_date);
    const endDate = new Date(contest.end_date);

    if (!contest.is_active) {
      return <Badge variant="secondary">Paused</Badge>;
    }
    if (now < startDate) {
      return <Badge variant="outline">Upcoming</Badge>;
    }
    if (now > endDate) {
      return <Badge variant="secondary">Ended</Badge>;
    }
    return <Badge className="bg-green-500">Active</Badge>;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Contest Management</h1>
            <p className="text-muted-foreground">View and manage all contests</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Contest Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">View and manage all contests</p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">{contests?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Total Contests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-green-500">
                {contests?.filter(c => c.is_active && new Date(c.end_date) > new Date()).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">
                {contests?.reduce((sum, c) => sum + (c.total_votes || 0), 0)?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total Votes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">
                {formatCurrency(contests?.reduce((sum, c) => sum + (c.total_votes || 0) * (c.vote_price || 0), 0) || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Contests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">All Contests</CardTitle>
            <CardDescription>View contest details and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Contest</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Contestants</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead className="hidden sm:table-cell">Revenue</TableHead>
                    <TableHead className="hidden md:table-cell">End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContests.map((contest) => (
                    <TableRow key={contest.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3">
                          {contest.image_url && (
                            <img 
                              src={contest.image_url} 
                              alt={contest.title}
                              className="h-8 w-8 sm:h-10 sm:w-10 rounded object-cover"
                            />
                          )}
                          <span className="font-medium text-sm truncate max-w-[100px] sm:max-w-none">{contest.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{contest.category}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(contest)}</TableCell>
                      <TableCell className="hidden md:table-cell">{contest.contestants?.[0]?.count || 0}</TableCell>
                      <TableCell>{contest.total_votes?.toLocaleString() || 0}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatCurrency((contest.total_votes || 0) * (contest.vote_price || 0), contest.vote_currency)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{format(new Date(contest.end_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadContestReportPdf(contest.id)}
                            disabled={generatingContestReport === contest.id}
                            title="Download PDF report"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" title="More actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/contests/${contest.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownloadContestReportPdf(contest.id)}
                                disabled={generatingContestReport === contest.id}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                {generatingContestReport === contest.id ? 'Generating PDF...' : 'Download PDF report'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleContestStatus(contest.id, contest.is_active)}>
                                {contest.is_active ? (
                                  <>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pause Contest
                                  </>
                                ) : (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Activate Contest
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminContests;