import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Users, TrendingUp, TrendingDown, Minus, Trophy, Crown, Medal } from 'lucide-react';
import { VotePulse, LiveVoteCounter } from '@/components/LiveVoteIndicator';

interface Contestant {
  id: string;
  name: string;
  photo_url: string | null;
  vote_count: number;
  bio?: string;
}

interface RankChange {
  previousRank: number;
  currentRank: number;
  change: number;
}

interface AnimatedLeaderboardProps {
  contestants: Contestant[];
  updatedContestantIds: Set<string>;
  onExport?: () => void;
  showExport?: boolean;
  title?: string;
  className?: string;
}

const AnimatedLeaderboard = ({
  contestants,
  updatedContestantIds,
  onExport,
  showExport = true,
  title = 'Live Leaderboard',
  className,
}: AnimatedLeaderboardProps) => {
  const [rankChanges, setRankChanges] = useState<Map<string, RankChange>>(new Map());
  const previousRanksRef = useRef<Map<string, number>>(new Map());
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  // Track rank changes when contestants order changes
  useEffect(() => {
    if (!contestants || contestants.length === 0) return;

    const currentRanks = new Map<string, number>();
    const newRankChanges = new Map<string, RankChange>();
    const newAnimatingIds = new Set<string>();

    contestants.forEach((c, index) => {
      const currentRank = index + 1;
      currentRanks.set(c.id, currentRank);

      const previousRank = previousRanksRef.current.get(c.id);
      if (previousRank !== undefined && previousRank !== currentRank) {
        const change = previousRank - currentRank;
        newRankChanges.set(c.id, {
          previousRank,
          currentRank,
          change,
        });
        newAnimatingIds.add(c.id);
      }
    });

    if (newRankChanges.size > 0) {
      setRankChanges(newRankChanges);
      setAnimatingIds(newAnimatingIds);

      // Clear rank change indicators after animation
      setTimeout(() => {
        setRankChanges(new Map());
        setAnimatingIds(new Set());
      }, 3000);
    }

    previousRanksRef.current = currentRanks;
  }, [contestants]);

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
          <Crown className="h-5 w-5 text-yellow-950" />
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg shadow-gray-400/30">
          <Medal className="h-5 w-5 text-gray-900" />
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
          <Trophy className="h-5 w-5 text-orange-950" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
        <span className="font-bold text-muted-foreground">{index + 1}</span>
      </div>
    );
  };

  const getRankChangeIndicator = (contestantId: string) => {
    const rankChange = rankChanges.get(contestantId);
    if (!rankChange) return null;

    const { change } = rankChange;

    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-500 animate-bounce">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-bold">+{change}</span>
        </div>
      );
    }
    if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-destructive animate-pulse">
          <TrendingDown className="h-4 w-4" />
          <span className="text-xs font-bold">{change}</span>
        </div>
      );
    }
    return null;
  };

  const totalVotes = contestants.reduce((sum, c) => sum + c.vote_count, 0);

  if (!contestants || contestants.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No contestants to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
            <Badge variant="outline" className="animate-pulse">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-ping" />
              Live
            </Badge>
          </div>
          {showExport && onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contestants.map((contestant, index) => {
            const isUpdated = updatedContestantIds.has(contestant.id);
            const isAnimating = animatingIds.has(contestant.id);
            const votePercentage = totalVotes > 0 ? (contestant.vote_count / totalVotes) * 100 : 0;

            return (
              <VotePulse key={contestant.id} isActive={isUpdated}>
                <div
                  className={cn(
                    'relative flex items-center gap-4 p-4 rounded-xl transition-all duration-500',
                    'bg-secondary/30 hover:bg-secondary/50',
                    isAnimating && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                    index === 0 && 'bg-gradient-to-r from-yellow-500/10 to-transparent',
                    index === 1 && 'bg-gradient-to-r from-gray-400/10 to-transparent',
                    index === 2 && 'bg-gradient-to-r from-orange-500/10 to-transparent'
                  )}
                  style={{
                    transform: isAnimating ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {/* Rank Badge */}
                  {getRankBadge(index)}

                  {/* Photo */}
                  <div className="h-12 w-12 rounded-full bg-secondary overflow-hidden flex-shrink-0 ring-2 ring-border">
                    {contestant.photo_url ? (
                      <img
                        src={contestant.photo_url}
                        alt={contestant.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Name and Vote Bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{contestant.name}</p>
                      {getRankChangeIndicator(contestant.id)}
                    </div>
                    
                    {/* Vote Progress Bar */}
                    <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          index === 0 && 'bg-gradient-to-r from-yellow-500 to-yellow-400',
                          index === 1 && 'bg-gradient-to-r from-gray-500 to-gray-400',
                          index === 2 && 'bg-gradient-to-r from-orange-500 to-orange-400',
                          index > 2 && 'bg-primary'
                        )}
                        style={{ 
                          width: `${votePercentage}%`,
                          transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Vote Count */}
                  <div className="text-right flex-shrink-0">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-sm font-bold transition-all duration-300',
                        isUpdated && 'bg-primary text-primary-foreground scale-110'
                      )}
                    >
                      <LiveVoteCounter count={contestant.vote_count} isUpdating={isUpdated} /> votes
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {votePercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </VotePulse>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimatedLeaderboard;
