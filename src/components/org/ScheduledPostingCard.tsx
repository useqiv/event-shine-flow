import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Twitter, Facebook, Instagram, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledPostingCardProps {
  contestId: string;
  contestTitle: string;
}

interface AutoPost {
  id: string;
  contest_id: string;
  platform: string;
  post_type: string;
  schedule_interval: string;
  is_active: boolean;
  last_posted_at: string | null;
  next_post_at: string | null;
  custom_message: string | null;
}

const platforms = [
  { id: 'twitter', name: 'X/Twitter', icon: Twitter, available: true },
  { id: 'facebook', name: 'Facebook', icon: Facebook, available: false },
  { id: 'instagram', name: 'Instagram', icon: Instagram, available: false },
];

const intervals = [
  { value: 'hourly', label: 'Every hour' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'daily', label: 'Once daily' },
  { value: 'weekly', label: 'Weekly' },
];

export const ScheduledPostingCard: React.FC<ScheduledPostingCardProps> = ({
  contestId,
  contestTitle,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');
  const [interval, setInterval] = useState('daily');
  const [customMessage, setCustomMessage] = useState('');
  const [isActive, setIsActive] = useState(false);

  // Fetch existing auto-post settings
  const { data: autoPost, isLoading } = useQuery({
    queryKey: ['auto-post', contestId, selectedPlatform],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contest_auto_posts')
        .select('*')
        .eq('contest_id', contestId)
        .eq('platform', selectedPlatform)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as AutoPost | null;
    },
  });

  // Update local state when data loads
  useEffect(() => {
    if (autoPost) {
      setInterval(autoPost.schedule_interval);
      setCustomMessage(autoPost.custom_message || '');
      setIsActive(autoPost.is_active);
    } else {
      setInterval('daily');
      setCustomMessage('');
      setIsActive(false);
    }
  }, [autoPost]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const nextPostAt = new Date();
      switch (interval) {
        case 'hourly':
          nextPostAt.setHours(nextPostAt.getHours() + 1);
          break;
        case 'twice_daily':
          nextPostAt.setHours(nextPostAt.getHours() + 12);
          break;
        case 'daily':
          nextPostAt.setDate(nextPostAt.getDate() + 1);
          break;
        case 'weekly':
          nextPostAt.setDate(nextPostAt.getDate() + 7);
          break;
      }

      const postData = {
        contest_id: contestId,
        organization_id: user.id,
        platform: selectedPlatform,
        post_type: 'leaderboard',
        schedule_interval: interval,
        is_active: isActive,
        custom_message: customMessage || null,
        next_post_at: isActive ? nextPostAt.toISOString() : null,
      };

      if (autoPost) {
        const { error } = await supabase
          .from('contest_auto_posts')
          .update(postData)
          .eq('id', autoPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contest_auto_posts')
          .insert(postData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-post', contestId] });
      toast({
        title: 'Settings Saved',
        description: isActive 
          ? 'Auto-posting has been enabled for this contest.'
          : 'Auto-posting settings have been saved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    },
  });

  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Scheduled Auto-Posting
        </CardTitle>
        <CardDescription>
          Automatically post leaderboard updates to your social media
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Selection */}
        <div className="space-y-3">
          <Label>Select Platform</Label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <Button
                  key={platform.id}
                  variant={selectedPlatform === platform.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => platform.available && setSelectedPlatform(platform.id)}
                  disabled={!platform.available}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {platform.name}
                  {!platform.available && (
                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {selectedPlatformData?.available && (
          <>
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="space-y-1">
                <Label className="text-base">Enable Auto-Posting</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically post leaderboard updates to {selectedPlatformData.name}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            {/* Interval Selection */}
            <div className="space-y-2">
              <Label>Posting Frequency</Label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {intervals.map((int) => (
                    <SelectItem key={int.value} value={int.value}>
                      {int.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Message (optional) */}
            <div className="space-y-2">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Leave empty to use auto-generated leaderboard message..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                If left empty, we'll generate a leaderboard update with top 3 contestants.
              </p>
            </div>

            {/* Status Display */}
            {autoPost && (
              <div className="p-4 rounded-lg border border-border space-y-2">
                <div className="flex items-center gap-2">
                  {autoPost.is_active ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">
                    {autoPost.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {autoPost.last_posted_at && (
                  <p className="text-sm text-muted-foreground">
                    Last posted: {format(new Date(autoPost.last_posted_at), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
                {autoPost.next_post_at && autoPost.is_active && (
                  <p className="text-sm text-muted-foreground">
                    Next post: {format(new Date(autoPost.next_post_at), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
            )}

            {/* Save Button */}
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </>
        )}

        {/* Meta Platform Info */}
        {(selectedPlatform === 'facebook' || selectedPlatform === 'instagram') && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Meta Platform Integration
            </h4>
            <p className="text-xs text-muted-foreground">
              Facebook and Instagram require Meta Business Suite integration with app review.
              This feature is coming soon. For now, you can manually share using the share buttons.
            </p>
          </div>
        )}

        {/* Twitter Setup Info */}
        {selectedPlatform === 'twitter' && (
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm mb-2">Setup Required</h4>
            <p className="text-xs text-muted-foreground">
              Ensure your Twitter API keys are configured in Supabase secrets:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li>• TWITTER_CONSUMER_KEY</li>
              <li>• TWITTER_CONSUMER_SECRET</li>
              <li>• TWITTER_ACCESS_TOKEN</li>
              <li>• TWITTER_ACCESS_TOKEN_SECRET</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
