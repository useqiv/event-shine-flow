import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganizationStats, usePayouts, useOrganizationContests, useOrganizationEvents, useOrganizationSettings } from '@/hooks/useOrganization';
import { formatCurrency, getCurrencySymbol, currencies, useConversionDisplay } from '@/components/ui/currency-selector';
import CurrencySelector from '@/components/ui/currency-selector';
import { 
  Wallet, 
  ArrowRight, 
  TrendingUp, 
  Ticket, 
  Vote, 
  CreditCard,
  Download,
  DollarSign,
  Coins
} from 'lucide-react';
import { format } from 'date-fns';
import { exportToCsv, formatDateForExport } from '@/lib/exportCsv';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const OrgWallet = () => {
  const { data: stats, isLoading: statsLoading } = useOrganizationStats();
  const { data: payouts, isLoading: payoutsLoading } = usePayouts();
  const { data: contests } = useOrganizationContests();
  const { data: events } = useOrganizationEvents();
  const { data: orgSettings } = useOrganizationSettings();
  const { user } = useAuth();
  
  const defaultCurrency = orgSettings?.default_currency || 'USD';
  
  // Display currency state with selector
  const [displayCurrency, setDisplayCurrency] = useState<string>(defaultCurrency);
  const { convert } = useConversionDisplay();
  
  // Update display currency when org settings load
  useEffect(() => {
    if (defaultCurrency) {
      setDisplayCurrency(defaultCurrency);
    }
  }, [defaultCurrency]);
  
  // Helper to convert amounts to display currency
  const convertAmount = (amount: number, fromCurrency: string = defaultCurrency) => {
    if (fromCurrency === displayCurrency) return amount;
    return convert(amount, fromCurrency, displayCurrency);
  };

  // Get all currencies that have revenue
  const allCurrenciesWithRevenue = React.useMemo(() => {
    const currencySet = new Set<string>();
    if (stats?.ticketRevenueByCurrency) {
      Object.keys(stats.ticketRevenueByCurrency).forEach(c => currencySet.add(c));
    }
    if (stats?.voteRevenueByCurrency) {
      Object.keys(stats.voteRevenueByCurrency).forEach(c => currencySet.add(c));
    }
    return Array.from(currencySet).sort();
  }, [stats]);

  const handleExportReport = async () => {
    if (!user) return;
    
    try {
      // Fetch all financial data
      const eventIds = events?.map(e => e.id) || [];
      const contestIds = contests?.map(c => c.id) || [];
      
      let tickets: any[] = [];
      let votes: any[] = [];
      
      if (eventIds.length > 0) {
        const { data } = await supabase
          .from('tickets')
          .select('*, events(title), ticket_types(name, currency)')
          .in('event_id', eventIds);
        tickets = data || [];
      }
      
      if (contestIds.length > 0) {
        const { data } = await supabase
          .from('votes')
          .select('*, contests(title, vote_currency), contestants(name)')
          .in('contest_id', contestIds);
        votes = data || [];
      }

      // Prepare comprehensive report data with currency info
      const reportData = [
        // Summary section per currency
        ...allCurrenciesWithRevenue.map(currency => ({
          category: 'Summary',
          item: `Total Revenue (${currency})`,
          amount: (stats?.ticketRevenueByCurrency?.[currency] || 0) + (stats?.voteRevenueByCurrency?.[currency] || 0),
          currency,
          date: '',
          details: ''
        })),
        { category: 'Summary', item: 'Available Balance', amount: stats?.availableBalance || 0, currency: defaultCurrency, date: '', details: '' },
        { category: 'Summary', item: 'Pending Payouts', amount: stats?.pendingPayouts || 0, currency: defaultCurrency, date: '', details: '' },
        { category: 'Summary', item: 'Completed Payouts', amount: stats?.completedPayouts || 0, currency: defaultCurrency, date: '', details: '' },
        // Add tickets
        ...tickets.map(t => ({
          category: 'Ticket Sale',
          item: t.events?.title || 'Unknown Event',
          amount: t.amount_paid,
          currency: t.ticket_types?.currency || 'USD',
          date: formatDateForExport(t.created_at),
          details: `${t.quantity}x ${t.ticket_types?.name || 'Standard'}`
        })),
        // Add votes
        ...votes.map(v => ({
          category: 'Vote',
          item: v.contests?.title || 'Unknown Contest',
          amount: v.amount_paid,
          currency: v.contests?.vote_currency || 'NGN',
          date: formatDateForExport(v.created_at),
          details: `${v.quantity} votes for ${v.contestants?.name || 'Unknown'}`
        })),
        // Add payouts
        ...(payouts || []).map(p => ({
          category: 'Payout',
          item: p.payment_method === 'bank' ? 'Bank Transfer' : 'USDT',
          amount: -p.amount,
          currency: defaultCurrency,
          date: formatDateForExport(p.created_at),
          details: `Status: ${p.status}`
        }))
      ];

      exportToCsv(reportData, `financial-report-${format(new Date(), 'yyyy-MM-dd')}`, [
        { key: 'category', label: 'Category' },
        { key: 'item', label: 'Item' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'date', label: 'Date' },
        { key: 'details', label: 'Details' }
      ]);
      
      toast.success('Financial report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Wallet & Finance</h1>
            <p className="text-muted-foreground">Track your revenue and manage finances.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">View in:</span>
              <CurrencySelector 
                value={displayCurrency} 
                onValueChange={setDisplayCurrency}
                className="w-[160px]"
              />
            </div>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Link to="/org/payouts">
              <Button>
                <CreditCard className="mr-2 h-4 w-4" />
                Request Payout
              </Button>
            </Link>
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Revenue</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1 bg-primary-foreground/20" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {formatCurrency(convertAmount(stats?.totalRevenue || 0), displayCurrency)}
                    </p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(convertAmount(stats?.availableBalance || 0), displayCurrency)}
                    </p>
                  )}
                </div>
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(convertAmount(stats?.pendingPayouts || 0), displayCurrency)}
                    </p>
                  )}
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid Out</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(convertAmount(stats?.completedPayouts || 0), displayCurrency)}
                    </p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Multi-Currency Balance Breakdown */}
        {allCurrenciesWithRevenue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Balance by Currency
              </CardTitle>
              <CardDescription>Revenue breakdown across different currencies</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {allCurrenciesWithRevenue.map((currency) => {
                    const ticketRev = stats?.ticketRevenueByCurrency?.[currency] || 0;
                    const voteRev = stats?.voteRevenueByCurrency?.[currency] || 0;
                    const total = ticketRev + voteRev;
                    const currencyInfo = currencies.find(c => c.code === currency);
                    
                    return (
                      <div key={currency} className="bg-secondary/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-semibold">{currencyInfo?.symbol || currency}</span>
                          <span className="text-sm text-muted-foreground">{currency}</span>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(total, currency)}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>Tickets: {formatCurrency(ticketRev, currency)}</span>
                          <span>Votes: {formatCurrency(voteRev, currency)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Ticket Revenue
              </CardTitle>
              <CardDescription>Revenue from event ticket sales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(convertAmount(stats?.ticketRevenue || 0), displayCurrency)}</p>
                  <p className="text-sm text-muted-foreground">{stats?.ticketsSold || 0} tickets sold</p>
                </div>
                <Link to="/org/events">
                  <Button variant="outline" className="w-full">
                    View Events <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                Vote Revenue
              </CardTitle>
              <CardDescription>Revenue from contest voting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(convertAmount(stats?.voteRevenue || 0), displayCurrency)}</p>
                  <p className="text-sm text-muted-foreground">{stats?.totalVotes || 0} votes received</p>
                </div>
                <Link to="/org/contests">
                  <Button variant="outline" className="w-full">
                    View Contests <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>Your recent payout requests</CardDescription>
              </div>
              <Link to="/org/payouts">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {payoutsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : payouts && payouts.length > 0 ? (
              <div className="space-y-3">
                {payouts.slice(0, 5).map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <p className="font-semibold">{formatCurrency(convertAmount(payout.amount), displayCurrency)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payout.payment_method === 'bank' ? 'Bank Transfer' : 'USDT'} • {format(new Date(payout.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant={
                      payout.status === 'completed' ? 'default' :
                      payout.status === 'pending' ? 'secondary' :
                      'destructive'
                    }>
                      {payout.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No payouts yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizationLayout>
  );
};

export default OrgWallet;
