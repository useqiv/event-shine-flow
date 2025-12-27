import React, { useState } from 'react';
import { useUpdateCampaign } from '@/hooks/useCampaigns';
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
import { TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdjustGoalDialogProps {
  campaignId: string;
  currentGoal: number;
  currentAmount: number;
  currency: string;
  trigger?: React.ReactNode;
}

const QUICK_INCREASES = [
  { label: '+25%', multiplier: 1.25 },
  { label: '+50%', multiplier: 1.5 },
  { label: '2x', multiplier: 2 },
];

export const AdjustGoalDialog: React.FC<AdjustGoalDialogProps> = ({
  campaignId,
  currentGoal,
  currentAmount,
  currency,
  trigger,
}) => {
  const updateCampaign = useUpdateCampaign();
  const [open, setOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<string>(currentGoal.toString());

  const parsedGoal = parseFloat(newGoal) || 0;
  const isValidGoal = parsedGoal > currentGoal && parsedGoal >= currentAmount;
  const increaseAmount = parsedGoal - currentGoal;
  const increasePercentage = currentGoal > 0 ? ((parsedGoal - currentGoal) / currentGoal) * 100 : 0;

  const handleQuickIncrease = (multiplier: number) => {
    const newValue = Math.ceil(currentGoal * multiplier);
    setNewGoal(newValue.toString());
  };

  const handleSubmit = async () => {
    if (!isValidGoal) return;

    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        goal_amount: parsedGoal,
      });
      setOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setNewGoal(currentGoal.toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Adjust Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Fundraising Goal</DialogTitle>
          <DialogDescription>
            Increase your campaign goal to reach for more. You can only increase the goal, not decrease it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Current goal</p>
              <p className="font-medium">{currency} {currentGoal.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Amount raised</p>
              <p className="font-medium">{currency} {currentAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Quick Increases */}
          <div className="space-y-2">
            <Label>Quick increase</Label>
            <div className="flex gap-2">
              {QUICK_INCREASES.map(({ label, multiplier }) => {
                const targetValue = Math.ceil(currentGoal * multiplier);
                return (
                  <Button
                    key={label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickIncrease(multiplier)}
                    className={cn(
                      parsedGoal === targetValue && 'border-primary bg-primary/10'
                    )}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="new-goal">New goal amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currency}
              </span>
              <Input
                id="new-goal"
                type="number"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="pl-12"
                min={currentGoal}
              />
            </div>
            {parsedGoal > 0 && parsedGoal <= currentGoal && (
              <p className="text-sm text-destructive">
                New goal must be higher than the current goal
              </p>
            )}
            {parsedGoal > 0 && parsedGoal < currentAmount && (
              <p className="text-sm text-destructive">
                New goal cannot be less than the amount already raised
              </p>
            )}
          </div>

          {/* New Goal Preview */}
          {isValidGoal && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground">New goal</p>
              <p className="font-medium text-primary text-lg">
                {currency} {parsedGoal.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                +{currency} {increaseAmount.toLocaleString()} ({increasePercentage.toFixed(0)}% increase)
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValidGoal || updateCampaign.isPending}
          >
            {updateCampaign.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
