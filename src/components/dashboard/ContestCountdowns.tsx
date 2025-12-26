import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFeaturedContests } from '@/hooks/useContests';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { Timer, Trophy, Vote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { isAfter } from 'date-fns';

export const ContestCountdowns = () => {
  const { data: contests, isLoading } = useFeaturedContests();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Active Contest Timers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter for active contests only
  const activeContests = contests
    ?.filter((c: any) => isAfter(new Date(c.end_date), new Date()))
    ?.sort((a: any, b: any) => 
      new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
    )
    ?.slice(0, 4);

  if (!activeContests || activeContests.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Active Contest Timers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No active contests at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Active Contest Timers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeContests.map((contest: any) => (
            <Link key={contest.id} to={`/contests/${contest.id}`}>
              <div className="p-4 rounded-lg border border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50 transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {contest.image_url ? (
                        <img src={contest.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <Trophy className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{contest.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{contest.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Vote className="h-3 w-3" />
                          {contest.total_votes?.toLocaleString()} votes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <CountdownTimer 
                  endDate={contest.end_date} 
                  startDate={contest.start_date}
                />
              </div>
            </Link>
          ))}
          
          <Link to="/contests">
            <Button variant="outline" size="sm" className="w-full">
              View All Contests
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
