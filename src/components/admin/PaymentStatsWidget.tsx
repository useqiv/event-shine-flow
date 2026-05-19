import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Bitcoin, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import CurrencyDisplay from '@/components/ui/currency-display';
import { aggregateAmountsByCurrency } from '@/lib/revenueByCurrency';

interface PaymentStats {
  flutterwave_pending: number;
  flutterwave_completed: number;
  flutterwave_by_currency: Record<string, number>;
  crypto_pending: number;
  crypto_pending_verification: number;
  crypto_completed: number;
  crypto_by_currency: Record<string, number>;
  today_transactions: number;
  today_revenue_by_currency: Record<string, number>;
}

const PaymentStatsWidget: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async (): Promise<PaymentStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayVotes } = await supabase
        .from('votes')
        .select('amount_paid, payment_method, currency, contests(vote_currency)')
        .gte('created_at', today.toISOString());

      const { data: todayTickets } = await supabase
        .from('tickets')
        .select('amount_paid, payment_method, ticket_types(currency)')
        .gte('created_at', today.toISOString());

      const voteCurrency = (v: any) =>
        (v.currency || v.contests?.vote_currency || 'NGN').toUpperCase();
      const ticketCurrency = (t: any) =>
        (t.ticket_types?.currency || 'NGN').toUpperCase();

      const flutterwaveVotes = todayVotes?.filter((v) => v.payment_method === 'flutterwave') || [];
      const flutterwaveTickets = todayTickets?.filter((t) => t.payment_method === 'flutterwave') || [];
      const flutterwaveCount = flutterwaveVotes.length + flutterwaveTickets.length;
      const flutterwaveByCurrency = aggregateAmountsByCurrency([
        ...flutterwaveVotes.map((v: any) => ({
          amount: v.amount_paid,
          currency: voteCurrency(v),
        })),
        ...flutterwaveTickets.map((t: any) => ({
          amount: t.amount_paid,
          currency: ticketCurrency(t),
        })),
      ]);

      const cryptoVotes = todayVotes?.filter((v) => v.payment_method === 'crypto') || [];
      const cryptoTickets = todayTickets?.filter((t) => t.payment_method === 'crypto') || [];
      const cryptoCount = cryptoVotes.length + cryptoTickets.length;
      const cryptoByCurrency = aggregateAmountsByCurrency([
        ...cryptoVotes.map((v: any) => ({
          amount: v.amount_paid,
          currency: voteCurrency(v),
        })),
        ...cryptoTickets.map((t: any) => ({
          amount: t.amount_paid,
          currency: ticketCurrency(t),
        })),
      ]);

      const { data: pendingVerifications } = await supabase
        .from('fraud_alerts')
        .select('id')
        .eq('alert_type', 'crypto_payment_verification')
        .eq('status', 'pending');

      const todayVoteCount = todayVotes?.length || 0;
      const todayTicketCount = todayTickets?.length || 0;
      const todayRevenueByCurrency = aggregateAmountsByCurrency([
        ...(todayVotes || []).map((v: any) => ({
          amount: v.amount_paid,
          currency: voteCurrency(v),
        })),
        ...(todayTickets || []).map((t: any) => ({
          amount: t.amount_paid,
          currency: ticketCurrency(t),
        })),
      ]);

      return {
        flutterwave_pending: 0,
        flutterwave_completed: flutterwaveCount,
        flutterwave_by_currency: flutterwaveByCurrency,
        crypto_pending: 0,
        crypto_pending_verification: pendingVerifications?.length || 0,
        crypto_completed: cryptoCount,
        crypto_by_currency: cryptoByCurrency,
        today_transactions: todayVoteCount + todayTicketCount,
        today_revenue_by_currency: todayRevenueByCurrency,
      };
    },
    refetchInterval: 30000,
  });

  const todayCurrencies = useMemo(
    () =>
      Object.keys(stats?.today_revenue_by_currency || {}).sort(
        (a, b) =>
          (stats?.today_revenue_by_currency[b] || 0) -
          (stats?.today_revenue_by_currency[a] || 0),
      ),
    [stats?.today_revenue_by_currency],
  );

  const renderByCurrency = (byCurrency: Record<string, number> | undefined) => {
    const entries = Object.entries(byCurrency || {}).sort(
      ([, a], [, b]) => b - a,
    );
    if (entries.length === 0) {
      return <p className="text-lg font-semibold text-muted-foreground">—</p>;
    }
    if (entries.length === 1) {
      const [code, amount] = entries[0];
      return (
        <CurrencyDisplay amount={amount} currency={code} size="lg" showConversion={false} />
      );
    }
    return (
      <div className="space-y-1">
        {entries.map(([code, amount]) => (
          <div key={code} className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-[10px]">{code}</Badge>
            <CurrencyDisplay amount={amount} currency={code} size="sm" showConversion={false} />
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Statistics
        </CardTitle>
        <CardDescription>Real-time payment processing overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Today&apos;s Transactions</p>
            <p className="text-2xl font-bold">{stats?.today_transactions || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Today&apos;s Revenue</p>
            {todayCurrencies.length <= 1 ? (
              <p className="text-2xl font-bold text-primary">
                {todayCurrencies.length === 1 ? (
                  <CurrencyDisplay
                    amount={stats?.today_revenue_by_currency[todayCurrencies[0]] || 0}
                    currency={todayCurrencies[0]}
                    size="lg"
                    showConversion={false}
                  />
                ) : (
                  '—'
                )}
              </p>
            ) : (
              <div className="mt-1 space-y-1">
                {todayCurrencies.map((code) => (
                  <div key={code} className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px]">{code}</Badge>
                    <CurrencyDisplay
                      amount={stats?.today_revenue_by_currency[code] || 0}
                      currency={code}
                      size="sm"
                      showConversion={false}
                    />
                  </div>
                ))}
              </div>
            )}
            {todayCurrencies.length > 1 && (
              <p className="text-[10px] text-muted-foreground mt-1">Shown per paid currency</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Flutterwave
              </h4>
              <Badge variant="outline">Card/Bank</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-yellow-500" />
                <span>{stats?.flutterwave_pending || 0} pending</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{stats?.flutterwave_completed || 0} completed</span>
              </div>
            </div>
            {renderByCurrency(stats?.flutterwave_by_currency)}
          </div>

          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Bitcoin className="h-4 w-4" />
                Crypto (USDT/USDC)
              </h4>
              <Badge variant="outline">Blockchain</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-yellow-500" />
                <span>{stats?.crypto_pending || 0} pending</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{stats?.crypto_completed || 0} completed</span>
              </div>
            </div>
            {renderByCurrency(stats?.crypto_by_currency)}
          </div>
        </div>

        {(stats?.crypto_pending_verification || 0) > 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium">Crypto Payments Pending Verification</p>
                  <p className="text-sm text-muted-foreground">
                    {stats?.crypto_pending_verification} payment(s) require manual review
                  </p>
                </div>
              </div>
              <Link to="/admin/fraud">
                <Button size="sm" variant="destructive">
                  Review Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentStatsWidget;

