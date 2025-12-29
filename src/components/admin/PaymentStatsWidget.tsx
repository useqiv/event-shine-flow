import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Bitcoin, Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentStats {
  flutterwave_pending: number;
  flutterwave_completed: number;
  flutterwave_total_amount: number;
  crypto_pending: number;
  crypto_pending_verification: number;
  crypto_completed: number;
  crypto_total_amount: number;
  today_transactions: number;
  today_revenue: number;
}

const PaymentStatsWidget: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async (): Promise<PaymentStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's votes
      const { data: todayVotes } = await supabase
        .from('votes')
        .select('amount_paid, payment_method')
        .gte('created_at', today.toISOString());

      // Get today's tickets  
      const { data: todayTickets } = await supabase
        .from('tickets')
        .select('amount_paid, payment_method')
        .gte('created_at', today.toISOString());

      // Calculate Flutterwave stats from votes and tickets
      const flutterwaveVotes = todayVotes?.filter(v => v.payment_method === 'flutterwave') || [];
      const flutterwaveTickets = todayTickets?.filter(t => t.payment_method === 'flutterwave') || [];
      const flutterwaveCount = flutterwaveVotes.length + flutterwaveTickets.length;
      const flutterwaveAmount = 
        flutterwaveVotes.reduce((sum, v) => sum + v.amount_paid, 0) +
        flutterwaveTickets.reduce((sum, t) => sum + t.amount_paid, 0);

      // Calculate Crypto stats from votes and tickets
      const cryptoVotes = todayVotes?.filter(v => v.payment_method === 'crypto') || [];
      const cryptoTickets = todayTickets?.filter(t => t.payment_method === 'crypto') || [];
      const cryptoCount = cryptoVotes.length + cryptoTickets.length;
      const cryptoAmount = 
        cryptoVotes.reduce((sum, v) => sum + v.amount_paid, 0) +
        cryptoTickets.reduce((sum, t) => sum + t.amount_paid, 0);

      // Get pending crypto verifications from fraud_alerts
      const { data: pendingVerifications } = await supabase
        .from('fraud_alerts')
        .select('id')
        .eq('alert_type', 'crypto_payment_verification')
        .eq('status', 'pending');

      // Calculate today's totals
      const todayVoteCount = todayVotes?.length || 0;
      const todayTicketCount = todayTickets?.length || 0;
      const todayVoteRevenue = todayVotes?.reduce((sum, v) => sum + v.amount_paid, 0) || 0;
      const todayTicketRevenue = todayTickets?.reduce((sum, t) => sum + t.amount_paid, 0) || 0;

      return {
        flutterwave_pending: 0, // We don't track pending at vote/ticket level
        flutterwave_completed: flutterwaveCount,
        flutterwave_total_amount: flutterwaveAmount,
        crypto_pending: 0,
        crypto_pending_verification: pendingVerifications?.length || 0,
        crypto_completed: cryptoCount,
        crypto_total_amount: cryptoAmount,
        today_transactions: todayVoteCount + todayTicketCount,
        today_revenue: todayVoteRevenue + todayTicketRevenue,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
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
        {/* Today's Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Today's Transactions</p>
            <p className="text-2xl font-bold">{stats?.today_transactions || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Today's Revenue</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats?.today_revenue || 0)}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Flutterwave Stats */}
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
            <p className="text-lg font-semibold">{formatCurrency(stats?.flutterwave_total_amount || 0)}</p>
          </div>

          {/* Crypto Stats */}
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
            <p className="text-lg font-semibold">{formatCurrency(stats?.crypto_total_amount || 0)}</p>
          </div>
        </div>

        {/* Pending Verifications Alert */}
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
