import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Target, TrendingUp, Trophy, Ticket, Flame, Heart, Pencil, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/components/ui/currency-selector';
import { useUpdateOrganizationSettings } from '@/hooks/useOrganization';
import type { MonthlyGoalMetrics, MonthlyGoalTargets } from '@/hooks/useOrgMonthlyGoalMetrics';
import { toast } from 'sonner';

interface GoalTrackingWidgetProps {
  currency: string;
  currentMonth: MonthlyGoalMetrics;
  targets: MonthlyGoalTargets;
  isLoading?: boolean;
}

const TARGET_SOURCE_LABEL: Record<MonthlyGoalTargets['source'], string> = {
  custom: 'Custom targets you set',
  growth: '10% above last month',
  starter: 'Suggested starter targets',
};

const GoalTrackingWidget = ({
  currency,
  currentMonth,
  targets,
  isLoading = false,
}: GoalTrackingWidgetProps) => {
  const updateSettings = useUpdateOrganizationSettings();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    revenue: '',
    votes: '',
    tickets: '',
    donations: '',
  });

  const calculateProgress = (current: number, target: number) => {
    if (target <= 0) return current > 0 ? 100 : 0;
    return Math.min((current / target) * 100, 100);
  };

  const getStatusBadge = (progress: number) => {
    if (progress >= 100) {
      return <Badge className="bg-green-500">Achieved!</Badge>;
    }
    if (progress >= 75) {
      return <Badge className="bg-amber-500">Almost There</Badge>;
    }
    if (progress >= 50) {
      return <Badge variant="secondary">On Track</Badge>;
    }
    return null;
  };

  const openEditDialog = () => {
    setForm({
      revenue: String(targets.revenue),
      votes: String(targets.votes),
      tickets: String(targets.tickets),
      donations: String(targets.donations),
    });
    setEditOpen(true);
  };

  const handleSaveGoals = async () => {
    const revenue = Number(form.revenue);
    const votes = parseInt(form.votes, 10);
    const tickets = parseInt(form.tickets, 10);
    const donations = parseInt(form.donations, 10);

    if (!Number.isFinite(revenue) || revenue <= 0) {
      toast.error('Enter a valid revenue goal');
      return;
    }
    if (!Number.isFinite(votes) || votes <= 0) {
      toast.error('Enter a valid votes goal');
      return;
    }
    if (!Number.isFinite(tickets) || tickets <= 0) {
      toast.error('Enter a valid tickets goal');
      return;
    }
    if (!Number.isFinite(donations) || donations <= 0) {
      toast.error('Enter a valid donations goal');
      return;
    }

    try {
      await updateSettings.mutateAsync({
        monthly_revenue_goal: revenue,
        monthly_votes_goal: votes,
        monthly_tickets_goal: tickets,
        monthly_donations_goal: donations,
      });
      setEditOpen(false);
    } catch {
      // toast handled by mutation
    }
  };

  const goals = [
    {
      label: 'Revenue',
      icon: TrendingUp,
      current: currentMonth.revenue,
      target: targets.revenue,
      format: (val: number) => formatCurrency(val, currency),
    },
    {
      label: 'Votes',
      icon: Trophy,
      current: currentMonth.votes,
      target: targets.votes,
      format: (val: number) => val.toLocaleString(),
    },
    {
      label: 'Tickets',
      icon: Ticket,
      current: currentMonth.tickets,
      target: targets.tickets,
      format: (val: number) => val.toLocaleString(),
    },
    {
      label: 'Donations',
      icon: Heart,
      current: currentMonth.donations,
      target: targets.donations,
      format: (val: number) => val.toLocaleString(),
    },
  ];

  const achievedGoals = goals.filter((g) => calculateProgress(g.current, g.target) >= 100);
  const hasStreak = achievedGoals.length >= 2;

  return (
    <Card>
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              This Month&apos;s Goals
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {TARGET_SOURCE_LABEL[targets.source]} · {currency}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasStreak && (
              <Badge variant="outline" className="gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                On Fire!
              </Badge>
            )}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={openEditDialog}
                >
                  <Pencil className="h-3 w-3" />
                  Edit Goals
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit monthly goals</DialogTitle>
                  <DialogDescription>
                    Set targets for {currency}. Progress resets each calendar month.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="goal-revenue">Revenue ({currency})</Label>
                    <Input
                      id="goal-revenue"
                      type="number"
                      min={1}
                      value={form.revenue}
                      onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-votes">Votes</Label>
                    <Input
                      id="goal-votes"
                      type="number"
                      min={1}
                      value={form.votes}
                      onChange={(e) => setForm((f) => ({ ...f, votes: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-tickets">Tickets sold</Label>
                    <Input
                      id="goal-tickets"
                      type="number"
                      min={1}
                      value={form.tickets}
                      onChange={(e) => setForm((f) => ({ ...f, tickets: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-donations">Donations received</Label>
                    <Input
                      id="goal-donations"
                      type="number"
                      min={1}
                      value={form.donations}
                      onChange={(e) => setForm((f) => ({ ...f, donations: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSaveGoals}
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Save Goals
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {goals.map((goal) => {
                const progress = calculateProgress(goal.current, goal.target);
                const Icon = goal.icon;

                return (
                  <div key={goal.label} className="space-y-2">
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
                  You&apos;ve hit {achievedGoals.length} goal{achievedGoals.length > 1 ? 's' : ''} this
                  month — keep going!
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalTrackingWidget;
