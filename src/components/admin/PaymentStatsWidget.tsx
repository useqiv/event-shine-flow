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

      // Get Flutterwave transactions
      const { data: flutterwaveData } = await supabase
        .from('wallet_transactions')
        .select('amount, status')
        .ilike('description', '%flutterwave%');

      // Get Crypto transactions
      const { data: cryptoData } = await supabase
        .from('wallet_transactions')
        .select('amount, status')
        .or('description.ilike.%USDT%,description.ilike.%USDC%,description.ilike.%crypto%');

      // Get today's transactions
      const { data: todayData } = await supabase
        .from('wallet_transactions')
        .select('amount, status')
        .gte('created_at', today.toISOString())
        .eq('status', 'completed');

      // Get pending crypto verifications from fraud_alerts
      const { data: pendingVerifications } = await supabase
        .from('fraud_alerts')
        .select('id')
        .eq('alert_type', 'crypto_payment_verification')
        .eq('status', 'pending');

      const flutterwaveStats = flutterwaveData?.reduce(
        (acc, tx) => {
          if (tx.status === 'pending') acc.pending++;
          if (tx.status === 'completed') {
            acc.completed++;
            acc.totalAmount += Number(tx.amount) || 0;
          }
          return acc;
        },
        { pending: 0, completed: 0, totalAmount: 0 }
      ) || { pending: 0, completed: 0, totalAmount: 0 };

      const cryptoStats = cryptoData?.reduce(
        (acc, tx) => {
          if (tx.status === 'pending') acc.pending++;
          if (tx.status === 'pending_verification') acc.pendingVerification++;
          if (tx.status === 'completed') {
            acc.completed++;
            acc.totalAmount += Number(tx.amount) || 0;
          }
          return acc;
        },
        { pending: 0, pendingVerification: 0, completed: 0, totalAmount: 0 }
      ) || { pending: 0, pendingVerification: 0, completed: 0, totalAmount: 0 };

      const todayStats = todayData?.reduce(
        (acc, tx) => {
          acc.count++;
          acc.revenue += Number(tx.amount) || 0;
          return acc;
        },
        { count: 0, revenue: 0 }
      ) || { count: 0, revenue: 0 };

      return {
        flutterwave_pending: flutterwaveStats.pending,
        flutterwave_completed: flutterwaveStats.completed,
        flutterwave_total_amount: flutterwaveStats.totalAmount,
        crypto_pending: cryptoStats.pending,
        crypto_pending_verification: pendingVerifications?.length || 0,
        crypto_completed: cryptoStats.completed,
        crypto_total_amount: cryptoStats.totalAmount,
        today_transactions: todayStats.count,
        today_revenue: todayStats.revenue,
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
