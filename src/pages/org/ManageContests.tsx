import React from 'react';
import { Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOrganizationContests } from '@/hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/components/ui/currency-selector';
import CurrencyDisplay from '@/components/ui/currency-display';
import { Trophy, PlusCircle, Calendar, Vote, Eye, Settings, DollarSign, TrendingUp, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const ManageContests = () => {
  const { data: contests, isLoading } = useOrganizationContests();
  const { user } = useAuth();

  // Fetch vote revenue per contest
  const { data: contestRevenues } = useQuery({
    queryKey: ['contest-revenues', user?.id],
    queryFn: async () => {
      const { data: contestsData } = await supabase
        .from('contests')
        .select('id')
        .eq('organization_id', user!.id);

      const contestIds = contestsData?.map(c => c.id) || [];
      if (contestIds.length === 0) return {};

      const { data: votes } = await supabase
        .from('votes')
        .select('contest_id, amount_paid, quantity')
        .in('contest_id', contestIds);

      const revenues: Record<string, { revenue: number; totalVotes: number }> = {};
      votes?.forEach(vote => {
        if (!revenues[vote.contest_id]) {
          revenues[vote.contest_id] = { revenue: 0, totalVotes: 0 };
        }
        revenues[vote.contest_id].revenue += Number(vote.amount_paid);
        revenues[vote.contest_id].totalVotes += vote.quantity;
      });

      return revenues;
    },
    enabled: !!user,
  });

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
      if (!user) return null;

      const { data, error } = await supabase
        .from('organization_approvals')
        .select('vote_commission_rate, ticket_commission_rate, special_commission_rate')
        .eq('organization_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const platformVoteCommission = commissionSettings?.vote_commission_percentage || commissionSettings?.platform_commission_percentage || 10;
  const voteCommission = orgApproval?.vote_commission_rate ?? orgApproval?.special_commission_rate ?? platformVoteCommission;

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Contests</h1>
            <p className="text-muted-foreground">View and manage all your voting contests.</p>
          </div>
          <Link to="/org/contests/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Contest
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : contests && contests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contests.map((contest: any) => {
              const contestData = contestRevenues?.[contest.id] || { revenue: 0, totalVotes: 0 };
              const totalRevenue = contestData.revenue;
              const netRevenue = totalRevenue * (1 - voteCommission / 100);
              const commissionDeducted = totalRevenue - netRevenue;

              return (
                <Card key={contest.id} className="overflow-hidden">
                  <div className="h-32 bg-secondary">
                    {contest.image_url ? (
                      <img
                        src={contest.image_url}
                        alt={contest.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold truncate">{contest.title}</h3>
                      <Badge variant={contest.is_active ? "default" : "secondary"}>
                        {contest.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(contest.start_date), 'MMM d')} - {format(new Date(contest.end_date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Vote className="h-4 w-4" />
                        <span>{contest.total_votes.toLocaleString()} votes</span>
                      </div>
                    </div>

                    {/* Revenue Section */}
                    <div className="bg-secondary/50 rounded-lg p-3 mb-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>Total Revenue</span>
                        </div>
                        <span className="font-medium">
                          <CurrencyDisplay amount={totalRevenue} currency={contest.vote_currency || 'USD'} size="sm" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <TrendingUp className="h-3 w-3" />
                          <span>Net Revenue</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {voteCommission}% commission<br/>
                                  Deducted: {formatCurrency(commissionDeducted, contest.vote_currency || 'USD')}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          <CurrencyDisplay amount={netRevenue} currency={contest.vote_currency || 'USD'} size="sm" className="text-green-600 dark:text-green-400" />
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/org/contests/${contest.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Settings className="mr-2 h-4 w-4" />
                          Manage
                        </Button>
                      </Link>
                      <Link to={`/contests/${contest.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Contests Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first contest to start collecting votes.
              </p>
              <Link to="/org/contests/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Contest
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </OrganizationLayout>
  );
};

export default ManageContests;