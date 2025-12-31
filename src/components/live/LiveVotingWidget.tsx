import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, TrendingUp, Users, Zap, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface VoteSurge {
  contestantId: string;
  contestantName: string;
  votes: number;
  timestamp: number;
}

interface LiveVotingWidgetProps {
  contestId: string;
  totalVotes: number;
  contestants: Array<{
    id: string;
    name: string;
    vote_count: number;
    photo_url?: string;
  }>;
  isLive?: boolean;
  onVoteSurge?: (surge: VoteSurge) => void;
}

export const LiveVotingWidget: React.FC<LiveVotingWidgetProps> = ({
  contestId,
  totalVotes,
  contestants,
  isLive = true,
  onVoteSurge,
}) => {
  const [recentSurges, setRecentSurges] = useState<VoteSurge[]>([]);
  const [animatingVotes, setAnimatingVotes] = useState<Record<string, boolean>>({});
  const [displayedTotalVotes, setDisplayedTotalVotes] = useState(totalVotes);
  const previousVotesRef = useRef<Record<string, number>>({});
  const previousTotalRef = useRef(totalVotes);

  // Animate total votes counter
  useEffect(() => {
    if (totalVotes !== previousTotalRef.current) {
      const diff = totalVotes - previousTotalRef.current;
      const steps = Math.min(Math.abs(diff), 20);
      const stepValue = diff / steps;
      let current = previousTotalRef.current;
      
      const interval = setInterval(() => {
        current += stepValue;
        if ((diff > 0 && current >= totalVotes) || (diff < 0 && current <= totalVotes)) {
          setDisplayedTotalVotes(totalVotes);
          clearInterval(interval);
        } else {
          setDisplayedTotalVotes(Math.round(current));
        }
      }, 50);

      previousTotalRef.current = totalVotes;
      return () => clearInterval(interval);
    }
  }, [totalVotes]);

  // Detect vote surges
  useEffect(() => {
    contestants.forEach((contestant) => {
      const prevCount = previousVotesRef.current[contestant.id] || 0;
      const newCount = contestant.vote_count;
      
      if (newCount > prevCount) {
        const voteDiff = newCount - prevCount;
        
        // Trigger animation
        setAnimatingVotes(prev => ({ ...prev, [contestant.id]: true }));
        setTimeout(() => {
          setAnimatingVotes(prev => ({ ...prev, [contestant.id]: false }));
        }, 1000);

        // Record surge
        const surge: VoteSurge = {
          contestantId: contestant.id,
          contestantName: contestant.name,
          votes: voteDiff,
          timestamp: Date.now(),
        };
        
        setRecentSurges(prev => [surge, ...prev].slice(0, 5));
        onVoteSurge?.(surge);

        // Trigger confetti for large surges (10+ votes)
        if (voteDiff >= 10) {
          confetti({
            particleCount: voteDiff * 5,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#7c3aed', '#f97316', '#22c55e'],
          });
        }
      }
      
      previousVotesRef.current[contestant.id] = newCount;
    });
  }, [contestants, onVoteSurge]);

  // Calculate leader percentage
  const maxVotes = Math.max(...contestants.map(c => c.vote_count), 1);
  const topContestants = [...contestants].sort((a, b) => b.vote_count - a.vote_count).slice(0, 5);

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-secondary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            Live Voting
          </CardTitle>
          {isLive && (
            <Badge variant="default" className="bg-red-500 animate-pulse">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-white inline-block" />
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Votes Counter */}
        <div className="text-center p-4 rounded-lg bg-primary/10">
          <p className="text-sm text-muted-foreground mb-1">Total Votes</p>
          <p className="text-4xl font-bold text-primary tabular-nums">
            {displayedTotalVotes.toLocaleString()}
          </p>
        </div>

        {/* Top 5 Leaderboard */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Trophy className="h-4 w-4" />
            Top Contestants
          </div>
          {topContestants.map((contestant, index) => {
            const percentage = (contestant.vote_count / maxVotes) * 100;
            const isAnimating = animatingVotes[contestant.id];
            
            return (
              <div
                key={contestant.id}
                className={cn(
                  "relative rounded-lg p-2 transition-all duration-300",
                  isAnimating && "ring-2 ring-green-500 ring-offset-2 ring-offset-background scale-[1.02]",
                  index === 0 && "bg-yellow-500/10"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs w-6 h-6 flex items-center justify-center p-0",
                        index === 0 && "bg-yellow-500 text-white border-yellow-500",
                        index === 1 && "bg-gray-400 text-white border-gray-400",
                        index === 2 && "bg-amber-600 text-white border-amber-600"
                      )}
                    >
                      {index + 1}
                    </Badge>
                    <span className="font-medium text-sm truncate max-w-[120px]">
                      {contestant.name}
                    </span>
                  </div>
                  <span className={cn(
                    "text-sm font-bold tabular-nums transition-all",
                    isAnimating && "text-green-500 scale-110"
                  )}>
                    {contestant.vote_count.toLocaleString()}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className={cn(
                    "h-2 transition-all",
                    isAnimating && "bg-green-200"
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Recent Vote Activity */}
        {recentSurges.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Zap className="h-4 w-4 text-yellow-500" />
              Recent Activity
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {recentSurges.map((surge, index) => (
                <div
                  key={`${surge.contestantId}-${surge.timestamp}`}
                  className={cn(
                    "flex items-center justify-between text-xs p-2 rounded bg-secondary/50 animate-in slide-in-from-left duration-300",
                    index === 0 && "bg-green-500/10"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="truncate">{surge.contestantName}</span>
                  <Badge variant="secondary" className="text-green-600 bg-green-100">
                    +{surge.votes} vote{surge.votes > 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Viewers indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Users className="h-3 w-3" />
          <span>Real-time updates enabled</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveVotingWidget;
