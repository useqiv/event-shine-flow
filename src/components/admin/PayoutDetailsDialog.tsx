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
  FileText,
  Wallet,
  AlertCircle,
  CheckCircle
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

  // Fetch organization's wallet balance
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['org-wallet', payout?.organization_id],
    queryFn: async () => {
      if (!payout?.organization_id) return null;
      
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', payout.organization_id)
        .maybeSingle();
      
      if (error) throw error;

      // Also fetch multi-currency balances
      let currencyBalances: any[] = [];
      if (wallet?.id) {
        const { data: balances } = await supabase
          .from('wallet_currency_balances')
          .select('*')
          .eq('wallet_id', wallet.id)
          .order('balance', { ascending: false });
        currencyBalances = balances || [];
      }

      return { wallet, currencyBalances };
    },
    enabled: !!payout?.organization_id,
  });

  if (!payout) return null;

  const wallet = walletData?.wallet;
  const currencyBalances = walletData?.currencyBalances || [];
  const requestedCurrencyBalance = currencyBalances.find(
    (b: any) => b.currency === payout.currency
  );
  const hasSufficientBalance = requestedCurrencyBalance 
    ? requestedCurrencyBalance.balance >= payout.amount
    : (wallet?.balance_currency === payout.currency && wallet?.balance >= payout.amount);

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
            <Wallet className="h-5 w-5" />
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

          {/* Wallet Balance - Critical for Approval */}
          <Card className={`border-2 ${hasSufficientBalance ? 'border-green-500/50' : 'border-destructive/50'}`}>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Organization Wallet Balance
                {!walletLoading && (
                  hasSufficientBalance ? (
                    <Badge className="bg-green-500 ml-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Sufficient Funds
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="ml-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Insufficient Funds
                    </Badge>
                  )
                )}
              </h3>
              
              {walletLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : wallet ? (
                <div className="space-y-4">
                  {/* Main balance in default currency */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Main Balance</p>
                      <p className="text-xl font-bold">
                        <CurrencyDisplay amount={wallet.balance || 0} currency={wallet.balance_currency || 'USD'} />
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Referral Earnings</p>
                      <p className="text-xl font-bold">
                        <CurrencyDisplay amount={wallet.referral_earnings || 0} currency={wallet.balance_currency || 'USD'} />
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Requested Amount</p>
                      <p className="text-xl font-bold text-primary">
                        <CurrencyDisplay amount={payout.amount} currency={payout.currency || 'USD'} />
                      </p>
                    </div>
                  </div>

                  {/* Multi-currency balances */}
                  {currencyBalances.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Currency Balances</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {currencyBalances.map((balance: any) => (
                          <div 
                            key={balance.id} 
                            className={`p-2 rounded border ${balance.currency === payout.currency ? 'border-primary bg-primary/10' : ''}`}
                          >
                            <p className="text-xs text-muted-foreground">{balance.currency}</p>
                            <p className="font-semibold">
                              <CurrencyDisplay amount={balance.balance} currency={balance.currency} />
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Balance comparison */}
                  <div className={`p-3 rounded-lg ${hasSufficientBalance ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                    <div className="flex items-center gap-2">
                      {hasSufficientBalance ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      <p className={`font-medium ${hasSufficientBalance ? 'text-green-600' : 'text-destructive'}`}>
                        {hasSufficientBalance 
                          ? `Organization has sufficient balance to cover this payout`
                          : `Warning: Organization may not have sufficient ${payout.currency} balance for this payout`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No wallet found for this organization</p>
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
