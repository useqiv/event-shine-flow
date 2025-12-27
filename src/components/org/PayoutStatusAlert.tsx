import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CreditCard, Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/components/ui/currency-selector';
import { format, formatDistanceToNow } from 'date-fns';

interface Payout {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  processed_at: string | null;
}

interface PayoutStatusAlertProps {
  payouts: Payout[];
  currency: string;
}

const PayoutStatusAlert = ({ payouts, currency }: PayoutStatusAlertProps) => {
  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const processingPayouts = payouts.filter(p => p.status === 'processing');
  const recentRejected = payouts
    .filter(p => p.status === 'rejected')
    .filter(p => {
      const createdAt = new Date(p.created_at);
      const daysSince = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });
  const recentCompleted = payouts
    .filter(p => p.status === 'completed' && p.processed_at)
    .filter(p => {
      const processedAt = new Date(p.processed_at!);
      const daysSince = (new Date().getTime() - processedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 2;
    });

  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalProcessing = processingPayouts.reduce((sum, p) => sum + p.amount, 0);

  if (pendingPayouts.length === 0 && processingPayouts.length === 0 && recentRejected.length === 0 && recentCompleted.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Processing Payouts - Most urgent */}
      {processingPayouts.length > 0 && (
        <Alert className="border-blue-500 bg-blue-500/10">
          <Clock className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-600 dark:text-blue-400">Processing Payout</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {formatCurrency(totalProcessing, currency)} is being processed. 
              <span className="text-muted-foreground ml-1">
                Estimated: 1-3 business days
              </span>
            </span>
            <Link to="/org/payouts">
              <Button variant="ghost" size="sm">
                View Details <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Payouts */}
      {pendingPayouts.length > 0 && (
        <Alert className="border-amber-500 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-600 dark:text-amber-400">
            {pendingPayouts.length} Pending Payout{pendingPayouts.length > 1 ? 's' : ''}
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {formatCurrency(totalPending, currency)} awaiting approval.
              <span className="text-muted-foreground ml-1">
                Oldest: {formatDistanceToNow(new Date(pendingPayouts[pendingPayouts.length - 1].created_at))} ago
              </span>
            </span>
            <Link to="/org/payouts">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Recently Rejected */}
      {recentRejected.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Payout Rejected</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {formatCurrency(recentRejected[0].amount, currency)} was rejected on {format(new Date(recentRejected[0].created_at), 'MMM d')}.
              Please check your payout details.
            </span>
            <Link to="/org/settings">
              <Button variant="ghost" size="sm">
                Update Details <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Recently Completed - Success feedback */}
      {recentCompleted.length > 0 && (
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-600 dark:text-green-400">Payout Completed!</AlertTitle>
          <AlertDescription>
            {formatCurrency(recentCompleted[0].amount, currency)} was sent to your account on {format(new Date(recentCompleted[0].processed_at!), 'MMM d, yyyy')}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PayoutStatusAlert;
