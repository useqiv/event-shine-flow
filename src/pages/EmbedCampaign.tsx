import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Heart, Users, Target, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCampaignShareUrl } from '@/lib/urlHelpers';

const EmbedCampaign = () => {
  const { campaignId } = useParams<{ campaignId: string }>();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['embed-campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center bg-background">
        <div>
          <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Campaign not found or inactive</p>
        </div>
      </div>
    );
  }

  const progress = campaign.goal_amount > 0 
    ? Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100) 
    : 0;
  
  const daysLeft = campaign.end_date 
    ? Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const campaignUrl = getCampaignShareUrl(campaign.custom_slug || campaign.id, true);

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Campaign Image */}
      {campaign.image_url && (
        <div className="relative h-40 rounded-lg overflow-hidden mb-4">
          <img 
            src={campaign.image_url} 
            alt={campaign.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      {/* Campaign Info */}
      <div className="space-y-4">
        <div>
          <h1 className="font-bold text-lg leading-tight">{campaign.title}</h1>
          {campaign.short_description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {campaign.short_description}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-primary">
              {campaign.currency} {campaign.current_amount.toLocaleString()}
            </span>
            <span className="text-muted-foreground">
              of {campaign.currency} {campaign.goal_amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-primary">{progress.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Funded</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold">{campaign.donor_count}</p>
            <p className="text-xs text-muted-foreground">Donors</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold">{daysLeft ?? '∞'}</p>
            <p className="text-xs text-muted-foreground">Days Left</p>
          </div>
        </div>

        {/* CTA Button */}
        <Button asChild className="w-full" size="lg">
          <a href={campaignUrl} target="_blank" rel="noopener noreferrer">
            <Heart className="h-4 w-4 mr-2" />
            Donate Now
          </a>
        </Button>

        {/* Footer */}
        <div className="pt-2 border-t text-center">
          <a 
            href={campaignUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            View on Useqiv
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmbedCampaign;
