import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizationDetails } from '@/hooks/useOrganizationDetails';
import CurrencyDisplay from '@/components/ui/currency-display';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Mail, 
  Building, 
  Trophy, 
  Calendar, 
  Heart, 
  FileText
} from 'lucide-react';

interface PayoutDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payout: any;
}

const PayoutDetailsDialog: React.FC<PayoutDetailsDialogProps> = ({
  open,
  onOpenChange,
  payout,
}) => {
  const { contests, events, campaigns, forms, isLoading } = useOrganizationDetails(
    payout?.organization_id || null
  );

  // Fetch revenue from contests (votes) and events (tickets)
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['org-revenue', payout?.organization_id],
    queryFn: async () => {
      if (!payout?.organization_id) return null;
      
      // Get contest revenue - fetch votes for contests owned by this org
      const { data: contestsData } = await supabase
        .from('contests')
        .select('id, title, vote_price, vote_currency, total_votes')
        .eq('organization_id', payout.organization_id);

      const contestRevenue = (contestsData || []).map(contest => ({
        id: contest.id,
        title: contest.title,
        totalVotes: contest.total_votes || 0,
        votePrice: contest.vote_price || 0,
        currency: contest.vote_currency || 'USD',
        totalRevenue: (contest.total_votes || 0) * (contest.vote_price || 0)
      }));

      // Get event revenue - fetch tickets for events owned by this org
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, currency')
        .eq('organization_id', payout.organization_id);

      const eventRevenue = await Promise.all((eventsData || []).map(async (event) => {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('amount_paid')
          .eq('event_id', event.id)
          .in('status', ['active', 'confirmed', 'used']);
        
        const totalRevenue = (tickets || []).reduce((sum, t) => sum + (t.amount_paid || 0), 0);
        const ticketCount = tickets?.length || 0;

        return {
          id: event.id,
          title: event.title,
          ticketCount,
          currency: event.currency || 'NGN',
          totalRevenue
        };
      }));

      // Calculate totals by currency
      const totalsByCurrency: Record<string, number> = {};
      
      contestRevenue.forEach(c => {
        totalsByCurrency[c.currency] = (totalsByCurrency[c.currency] || 0) + c.totalRevenue;
      });
      
      eventRevenue.forEach(e => {
        totalsByCurrency[e.currency] = (totalsByCurrency[e.currency] || 0) + e.totalRevenue;
      });

      return { contestRevenue, eventRevenue, totalsByCurrency };
    },
    enabled: !!payout?.organization_id,
  });

  if (!payout) return null;

  const contestRevenue = revenueData?.contestRevenue || [];
  const eventRevenue = revenueData?.eventRevenue || [];
  const totalsByCurrency = revenueData?.totalsByCurrency || {};

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Payout Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payout Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-xl font-bold">
                    <CurrencyDisplay amount={payout.amount} currency={payout.currency || 'USD'} />
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(payout.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Request Date</p>
                  <p className="font-medium">{format(new Date(payout.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <Badge variant="outline" className="capitalize mt-1">{payout.payment_method}</Badge>
                </div>
                {payout.payment_method === 'bank' ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Bank</p>
                      <p className="font-medium">{payout.bank_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account</p>
                      <p className="font-medium">{payout.account_number || '-'}</p>
                      <p className="text-xs text-muted-foreground">{payout.account_name}</p>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">USDT Address</p>
                    <p className="font-mono text-sm break-all">{payout.usdt_address || '-'}</p>
                  </div>
                )}
              </div>
              {payout.reference_id && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Payment Reference</p>
                  <p className="font-mono">{payout.reference_id}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <Card className="border-2 border-primary/30">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Revenue Breakdown
              </h3>
              
              {revenueLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="space-y-4">
                  {/* Total Revenue by Currency */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(totalsByCurrency).map(([currency, total]) => (
                      <div 
                        key={currency} 
                        className={`p-3 rounded-lg border ${currency === payout.currency ? 'border-primary bg-primary/10' : 'bg-muted'}`}
                      >
                        <p className="text-xs text-muted-foreground">Total {currency}</p>
                        <p className="text-lg font-bold">
                          <CurrencyDisplay amount={total as number} currency={currency} />
                        </p>
                      </div>
                    ))}
                    {Object.keys(totalsByCurrency).length === 0 && (
                      <p className="text-muted-foreground col-span-4">No revenue data available</p>
                    )}
                  </div>

                  {/* Contest Revenue */}
                  {contestRevenue.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Trophy className="h-4 w-4" /> Contest Revenue
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {contestRevenue.map((contest: any) => (
                          <div key={contest.id} className="flex items-center justify-between p-2 rounded border bg-muted/50">
                            <div>
                              <p className="font-medium text-sm">{contest.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {contest.totalVotes.toLocaleString()} votes × <CurrencyDisplay amount={contest.votePrice} currency={contest.currency} />
                              </p>
                            </div>
                            <p className="font-bold">
                              <CurrencyDisplay amount={contest.totalRevenue} currency={contest.currency} />
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Event Revenue */}
                  {eventRevenue.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Event Revenue
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {eventRevenue.map((event: any) => (
                          <div key={event.id} className="flex items-center justify-between p-2 rounded border bg-muted/50">
                            <div>
                              <p className="font-medium text-sm">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {event.ticketCount.toLocaleString()} tickets sold
                              </p>
                            </div>
                            <p className="font-bold">
                              <CurrencyDisplay amount={event.totalRevenue} currency={event.currency} />
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Info */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Organization Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{payout.organization?.full_name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{payout.organization?.email || '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Activity */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Organization Activity</h3>
              
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <Tabs defaultValue="contests">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="contests" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      <span className="hidden sm:inline">Contests</span>
                      <Badge variant="secondary" className="ml-1">{contests.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="events" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span className="hidden sm:inline">Events</span>
                      <Badge variant="secondary" className="ml-1">{events.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="campaigns" className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span className="hidden sm:inline">Campaigns</span>
                      <Badge variant="secondary" className="ml-1">{campaigns.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="forms" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span className="hidden sm:inline">Forms</span>
                      <Badge variant="secondary" className="ml-1">{forms.length}</Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="contests" className="mt-4">
                    {contests.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No contests created</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {contests.map((contest: any) => (
                          <div key={contest.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{contest.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(contest.start_date), 'MMM d')} - {format(new Date(contest.end_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={contest.is_active ? 'default' : 'secondary'}>
                                {contest.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                <CurrencyDisplay amount={contest.vote_price} currency={contest.vote_currency} /> /vote
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="events" className="mt-4">
                    {events.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No events created</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {events.map((event: any) => (
                          <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(event.event_date), 'MMM d, yyyy')} • {event.venue}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={event.is_active ? 'default' : 'secondary'}>
                                {event.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">{event.currency}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="campaigns" className="mt-4">
                    {campaigns.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No campaigns created</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {campaigns.map((campaign: any) => (
                          <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{campaign.title}</p>
                              <p className="text-xs text-muted-foreground">{campaign.category}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                                {campaign.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                <CurrencyDisplay amount={campaign.current_amount} currency={campaign.currency} /> raised
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="forms" className="mt-4">
                    {forms.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No forms created</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {forms.map((form: any) => (
                          <div key={form.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{form.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Created {format(new Date(form.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Badge variant={form.is_active ? 'default' : 'secondary'}>
                              {form.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutDetailsDialog;
