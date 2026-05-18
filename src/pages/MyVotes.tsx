import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useMyVotes } from '@/hooks/useContests';
import RefundRequestDialog from '@/components/RefundRequestDialog';
import { VoteReceipt } from '@/components/dashboard/VoteReceipt';
import { QuickRevote } from '@/components/dashboard/QuickRevote';
import { VotingAnalytics } from '@/components/dashboard/VotingAnalytics';
import { Vote, Trophy, RotateCcw, Receipt } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { formatCurrency, getPaidTransactionCurrency } from '@/components/ui/currency-selector';
const MyVotes = () => {
  const { data: votes, isLoading } = useMyVotes();

  // Only show refund button for votes on active contests (contest hasn't ended)
  const canRequestRefund = (vote: any) => {
    if (!vote.contest?.end_date) return false;
    return isAfter(new Date(vote.contest.end_date), new Date());
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Votes</h1>

        {/* Voting Analytics */}
        <VotingAnalytics />

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : votes && votes.length > 0 ? (
          <div className="space-y-4">
            {votes.map((vote: any) => (
              <Card key={vote.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Vote className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Voted for {vote.contestant?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vote.contest?.title}
                        {vote.contestant?.category?.name && ` • ${vote.contestant.category.name}`}
                        {' • '}{vote.quantity} vote(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(
                          Number(vote.amount_paid),
                          getPaidTransactionCurrency(vote.currency, vote.contest?.vote_currency),
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(vote.created_at), 'MMM d, HH:mm')}</p>
                      {vote.payment_reference_id && (
                        <p className="text-xs font-mono text-muted-foreground mt-1 truncate max-w-[180px]" title={vote.payment_reference_id}>
                          Ref: {vote.payment_reference_id}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions Row */}
                  <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center justify-end gap-2">
                    {/* Vote Receipt */}
                    <VoteReceipt vote={vote}>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        <Receipt className="h-4 w-4 mr-1" />
                        Receipt
                      </Button>
                    </VoteReceipt>
                    
                    {/* Quick Re-vote */}
                    <QuickRevote vote={vote} />
                    
                    {/* Refund Request */}
                    {canRequestRefund(vote) && (
                      <RefundRequestDialog
                        transactionType="vote"
                        transactionId={vote.id}
                        amount={Number(vote.amount_paid)}
                        itemName={`Vote for ${vote.contestant?.name} in ${vote.contest?.title}`}
                      >
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Request Refund
                        </Button>
                      </RefundRequestDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No votes yet</h3>
            <p className="text-muted-foreground">Vote for contestants to see your history here.</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyVotes;
