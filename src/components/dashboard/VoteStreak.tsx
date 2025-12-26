import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVoteStreak } from '@/hooks/useVoteStreak';
import { Flame, Trophy, Gift, Calendar, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInDays, parseISO } from 'date-fns';

export const VoteStreak = () => {
  const { data: streak, isLoading } = useVoteStreak();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Vote Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;
  const totalBonuses = streak?.total_streak_bonuses_earned || 0;
  const lastVoteDate = streak?.last_vote_date;

  // Calculate days until streak breaks
  const daysUntilBreak = lastVoteDate 
    ? Math.max(0, 1 - differenceInDays(new Date(), parseISO(lastVoteDate)))
    : null;

  // Calculate progress to next bonus (every 7 days)
  const progressToBonus = currentStreak % 7;
  const daysToNextBonus = 7 - progressToBonus;

  // Get streak tier based on current streak
  const getStreakTier = () => {
    if (currentStreak >= 30) return { name: 'Legendary', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    if (currentStreak >= 14) return { name: 'Champion', color: 'text-purple-500', bg: 'bg-purple-500/10' };
    if (currentStreak >= 7) return { name: 'Rising Star', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (currentStreak >= 3) return { name: 'Enthusiast', color: 'text-green-500', bg: 'bg-green-500/10' };
    return { name: 'Beginner', color: 'text-muted-foreground', bg: 'bg-secondary' };
  };

  const tier = getStreakTier();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Vote Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Streak Circle */}
          <div className="relative">
            <div className={`h-24 w-24 rounded-full ${tier.bg} flex items-center justify-center`}>
              <div className="text-center">
                <p className={`text-3xl font-bold ${tier.color}`}>{currentStreak}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>
            {currentStreak > 0 && (
              <div className="absolute -top-1 -right-1">
                <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 text-muted-foreground mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-xs">Longest Streak</span>
              </div>
              <p className="text-xl font-bold">{longestStreak} days</p>
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 text-muted-foreground mb-1">
                <Gift className="h-4 w-4" />
                <span className="text-xs">Bonuses Earned</span>
              </div>
              <p className="text-xl font-bold">₦{totalBonuses.toLocaleString()}</p>
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 text-muted-foreground mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xs">Current Tier</span>
              </div>
              <Badge className={tier.bg} variant="secondary">
                <span className={tier.color}>{tier.name}</span>
              </Badge>
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Next Bonus</span>
              </div>
              <p className="text-xl font-bold">{daysToNextBonus} days</p>
            </div>
          </div>
        </div>

        {/* Progress Bar to Next Bonus */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress to next bonus</span>
            <span>{progressToBonus}/7 days</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
              style={{ width: `${(progressToBonus / 7) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Vote daily to earn ₦{50 * Math.ceil((currentStreak + daysToNextBonus) / 7)} at your next milestone!
          </p>
        </div>

        {/* Warning if streak about to break */}
        {daysUntilBreak === 0 && currentStreak > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Vote today to keep your streak alive!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
