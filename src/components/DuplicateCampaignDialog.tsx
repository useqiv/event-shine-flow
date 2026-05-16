import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useCreateCampaign, Campaign } from '@/hooks/useCampaigns';
import { Copy, Loader2 } from 'lucide-react';
import { addDays, format } from 'date-fns';

interface DuplicateCampaignDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DuplicateCampaignDialog: React.FC<DuplicateCampaignDialogProps> = ({
  campaign,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const createCampaign = useCreateCampaign();
  const [title, setTitle] = useState('');

  React.useEffect(() => {
    if (campaign && open) {
      setTitle(`${campaign.title} (Copy)`);
    }
  }, [campaign, open]);

  const handleDuplicate = async () => {
    if (!campaign) return;

    // Calculate new end date (same duration from now as original had from its start)
    const originalDuration = campaign.end_date 
      ? Math.ceil((new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    const newEndDate = addDays(new Date(), originalDuration);

    try {
      const newCampaign = await createCampaign.mutateAsync({
        title: title.trim() || `${campaign.title} (Copy)`,
        short_description: campaign.short_description,
        description: campaign.description,
        goal_amount: campaign.goal_amount,
        currency: campaign.currency,
        category: campaign.category,
        image_url: campaign.image_url,
        end_date: newEndDate.toISOString(),
        status: 'draft',
      });
      
      onOpenChange(false);
      navigate(`/campaigns/${newCampaign.id}/dashboard`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Campaign
          </DialogTitle>
          <DialogDescription>
            Create a new campaign based on "{campaign.title}". The new campaign will start as a draft with reset progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-title">New Campaign Title</Label>
            <Input
              id="new-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter campaign title"
            />
          </div>

          <div className="rounded-lg border p-4 space-y-2 text-sm">
            <p className="font-medium">What will be copied:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Description & short description</li>
              <li>Goal amount ({campaign.currency} {campaign.goal_amount.toLocaleString()})</li>
              <li>Category ({campaign.category})</li>
              <li>Campaign image</li>
            </ul>
            <p className="font-medium mt-3">What will be reset:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Status (set to draft)</li>
              <li>Current amount (set to 0)</li>
              <li>Donor count (set to 0)</li>
              <li>Start & end dates (new dates)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate} disabled={createCampaign.isPending}>
            {createCampaign.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Duplicate Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
