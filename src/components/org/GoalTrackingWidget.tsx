import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Trophy, Ticket, Flame } from 'lucide-react';
import { formatCurrency } from '@/components/ui/currency-selector';

interface GoalTrackingWidgetProps {
  totalRevenue: number;
  totalVotes: number;
  ticketsSold: number;
  currency: string;
  // Monthly targets (can be customized later)
  revenueTarget?: number;
  votesTarget?: number;
  ticketsTarget?: number;
}

const GoalTrackingWidget = ({
  totalRevenue,
  totalVotes,
  ticketsSold,
  currency,
  revenueTarget = 500000,
  votesTarget = 10000,
  ticketsTarget = 500,
}: GoalTrackingWidgetProps) => {
  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStatusBadge = (progress: number) => {
    if (progress >= 100) {
      return <Badge className="bg-green-500">Achieved!</Badge>;
    } else if (progress >= 75) {
      return <Badge className="bg-amber-500">Almost There</Badge>;
    } else if (progress >= 50) {
      return <Badge variant="secondary">On Track</Badge>;
    }
    return null;
  };

  const goals = [
    {
      label: 'Revenue Goal',
      icon: TrendingUp,
      current: totalRevenue,
      target: revenueTarget,
      format: (val: number) => formatCurrency(val, currency),
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'Votes Goal',
      icon: Trophy,
      current: totalVotes,
      target: votesTarget,
      format: (val: number) => val.toLocaleString(),
      color: 'from-primary to-purple-600',
    },
    {
      label: 'Tickets Goal',
      icon: Ticket,
      current: ticketsSold,
      target: ticketsTarget,
      format: (val: number) => val.toLocaleString(),
      color: 'from-blue-500 to-cyan-500',
    },
  ];

  // Check for any achieved goals
  const achievedGoals = goals.filter(g => calculateProgress(g.current, g.target) >= 100);
  const hasStreak = achievedGoals.length >= 2;

  return (
    <Card>
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Monthly Goals
          </CardTitle>
          {hasStreak && (
            <Badge variant="outline" className="gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              On Fire!
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {goals.map((goal, index) => {
            const progress = calculateProgress(goal.current, goal.target);
            const Icon = goal.icon;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{goal.label}</span>
                    {getStatusBadge(progress)}
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    {goal.format(goal.current)} / {goal.format(goal.target)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="h-2.5 sm:h-3 flex-1" />
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {progress.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {achievedGoals.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              🎉 Congratulations! You've achieved {achievedGoals.length} goal{achievedGoals.length > 1 ? 's' : ''} this month!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalTrackingWidget;
