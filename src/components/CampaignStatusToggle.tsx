import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUpdateCampaign } from '@/hooks/useCampaigns';
import { toast } from 'sonner';
import { Pause, Play } from 'lucide-react';

interface CampaignStatusToggleProps {
  campaignId: string;
  currentStatus: string;
}

export const CampaignStatusToggle: React.FC<CampaignStatusToggleProps> = ({
  campaignId,
  currentStatus,
}) => {
  const updateCampaign = useUpdateCampaign();
  const isActive = currentStatus === 'active';

  const handleToggle = async (checked: boolean) => {
    const newStatus = checked ? 'active' : 'paused';
    
    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        status: newStatus,
      });
      toast.success(`Campaign ${checked ? 'resumed' : 'paused'} successfully`);
    } catch (error) {
      toast.error('Failed to update campaign status');
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
      {isActive ? (
        <Play className="h-4 w-4 text-green-500" />
      ) : (
        <Pause className="h-4 w-4 text-muted-foreground" />
      )}
      <Label htmlFor="campaign-status" className="text-sm cursor-pointer">
        {isActive ? 'Active' : 'Paused'}
      </Label>
      <Switch
        id="campaign-status"
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={updateCampaign.isPending}
      />
    </div>
  );
};
