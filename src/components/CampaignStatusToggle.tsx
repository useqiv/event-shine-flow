import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUpdateCampaign } from '@/hooks/useCampaigns';
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

  if (currentStatus !== 'active' && currentStatus !== 'paused') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
        <Pause className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm capitalize">{currentStatus}</span>
      </div>
    );
  }

  const isActive = currentStatus === 'active';

  const handleToggle = async (checked: boolean) => {
    const newStatus = checked ? 'active' : 'paused';

    try {
      await updateCampaign.mutateAsync({
        id: campaignId,
        status: newStatus,
      });
    } catch (error) {
      // Error handled by mutation
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
