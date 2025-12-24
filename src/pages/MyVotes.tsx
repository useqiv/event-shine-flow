import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyVotes } from '@/hooks/useContests';
import { Vote, Trophy } from 'lucide-react';
import { format } from 'date-fns';

const MyVotes = () => {
  const { data: votes, isLoading } = useMyVotes();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Votes</h1>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : votes && votes.length > 0 ? (
          <div className="space-y-4">
            {votes.map((vote: any) => (
              <Card key={vote.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Vote className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Voted for {vote.contestant?.name}</p>
                    <p className="text-sm text-muted-foreground">{vote.contest?.title} • {vote.quantity} vote(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₦{vote.amount_paid.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(vote.created_at), 'MMM d, HH:mm')}</p>
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
