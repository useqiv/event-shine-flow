import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gift, Loader2 } from 'lucide-react';
import { useAdminRewardReferral } from '@/hooks/useAdminReferralReward';

interface User {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

interface RewardReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const RewardReferralDialog: React.FC<RewardReferralDialogProps> = ({
  open,
  onOpenChange,
  user,
}) => {
  const [amount, setAmount] = useState('500');
  const [reason, setReason] = useState('Admin referral bonus');
  const rewardMutation = useAdminRewardReferral();

  const handleReward = async () => {
    if (!user || !amount || Number(amount) <= 0) return;

    await rewardMutation.mutateAsync({
      userId: user.id,
      amount: Number(amount),
      reason,
    });

    onOpenChange(false);
    setAmount('500');
    setReason('Admin referral bonus');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Reward Referral Bonus
          </DialogTitle>
          <DialogDescription>
            Manually reward a user with referral bonus credits.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <Avatar>
                <AvatarImage src={user.avatar_url || ''} />
                <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.full_name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Reward Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for reward..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReward}
            disabled={!amount || Number(amount) <= 0 || rewardMutation.isPending}
          >
            {rewardMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rewarding...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Reward ₦{Number(amount).toLocaleString()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RewardReferralDialog;
