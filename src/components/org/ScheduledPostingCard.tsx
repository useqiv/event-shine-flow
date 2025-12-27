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
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

// Platform icons as SVG components
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

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
  { id: 'twitter', name: 'X/Twitter', icon: TwitterIcon, available: true },
  { id: 'facebook', name: 'Facebook', icon: FacebookIcon, available: false },
  { id: 'instagram', name: 'Instagram', icon: InstagramIcon, available: false },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, available: false },
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

        {/* TikTok Platform Info */}
        {selectedPlatform === 'tiktok' && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              TikTok Integration
            </h4>
            <p className="text-xs text-muted-foreground">
              TikTok requires TikTok for Developers integration with app review.
              This feature is coming soon. For now, you can manually share your content on TikTok.
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
