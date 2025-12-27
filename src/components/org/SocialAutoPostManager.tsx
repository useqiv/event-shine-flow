import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Link2,
  Send,
  Settings,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

// Platform icons
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

interface Platform {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  connected: boolean;
  color: string;
  comingSoon?: boolean;
}

interface AutoPost {
  id: string;
  platform: string;
  post_type: string;
  schedule_interval: string;
  is_active: boolean;
  last_posted_at: string | null;
  next_post_at: string | null;
  custom_message: string | null;
  created_at: string;
}

interface SocialAutoPostManagerProps {
  entityId: string;
  entityType: 'contest' | 'event';
  entityTitle: string;
}

const platforms: Platform[] = [
  { id: 'twitter', name: 'X (Twitter)', icon: TwitterIcon, connected: false, color: 'bg-black text-white' },
  { id: 'facebook', name: 'Facebook', icon: FacebookIcon, connected: false, color: 'bg-[#1877F2] text-white', comingSoon: true },
  { id: 'instagram', name: 'Instagram', icon: InstagramIcon, connected: false, color: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white', comingSoon: true },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, connected: false, color: 'bg-black text-white', comingSoon: true },
];

const postTypes = {
  contest: [
    { id: 'leaderboard', name: 'Leaderboard Update', description: 'Share current standings' },
    { id: 'contestant_spotlight', name: 'Contestant Spotlight', description: 'Feature a contestant' },
    { id: 'voting_reminder', name: 'Voting Reminder', description: 'Remind followers to vote' },
    { id: 'milestone', name: 'Vote Milestone', description: 'Celebrate vote milestones' },
  ],
  event: [
    { id: 'event_countdown', name: 'Event Countdown', description: 'Days until event' },
    { id: 'tickets_selling', name: 'Tickets Update', description: 'Ticket sales info' },
    { id: 'event_reminder', name: 'Event Reminder', description: 'Remind about the event' },
    { id: 'event_announcement', name: 'Announcement', description: 'General updates' },
  ],
};

const scheduleIntervals = [
  { id: 'hourly', name: 'Every Hour', description: 'Post once every hour' },
  { id: 'twice_daily', name: 'Twice Daily', description: 'Post at 9am and 6pm' },
  { id: 'daily', name: 'Daily', description: 'Post once per day' },
  { id: 'weekly', name: 'Weekly', description: 'Post once per week' },
];

export const SocialAutoPostManager: React.FC<SocialAutoPostManagerProps> = ({
  entityId,
  entityType,
  entityTitle,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'queue' | 'channels' | 'create'>('queue');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    platform: 'twitter',
    post_type: postTypes[entityType][0].id,
    schedule_interval: 'daily',
    custom_message: '',
  });

  // Fetch auto posts
  const { data: autoPosts, isLoading } = useQuery({
    queryKey: ['auto-posts', entityType, entityId],
    queryFn: async () => {
      if (entityType === 'contest') {
        const { data, error } = await supabase
          .from('contest_auto_posts')
          .select('*')
          .eq('contest_id', entityId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as AutoPost[];
      } else {
        const { data, error } = await supabase
          .from('event_auto_posts')
          .select('*')
          .eq('event_id', entityId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as AutoPost[];
      }
    },
    enabled: !!user,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (postData: typeof newPost) => {
      const nextPostAt = new Date();
      switch (postData.schedule_interval) {
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

      if (entityType === 'contest') {
        const { error } = await supabase
          .from('contest_auto_posts')
          .insert({
            contest_id: entityId,
            organization_id: user!.id,
            platform: postData.platform,
            post_type: postData.post_type,
            schedule_interval: postData.schedule_interval,
            custom_message: postData.custom_message || null,
            next_post_at: nextPostAt.toISOString(),
            is_active: true,
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_auto_posts')
          .insert({
            event_id: entityId,
            organization_id: user!.id,
            platform: postData.platform,
            post_type: postData.post_type,
            schedule_interval: postData.schedule_interval,
            custom_message: postData.custom_message || null,
            next_post_at: nextPostAt.toISOString(),
            is_active: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-posts', entityType, entityId] });
      setShowCreateForm(false);
      setNewPost({
        platform: 'twitter',
        post_type: postTypes[entityType][0].id,
        schedule_interval: 'daily',
        custom_message: '',
      });
    },
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (entityType === 'contest') {
        const { error } = await supabase
          .from('contest_auto_posts')
          .update({ is_active: !isActive })
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_auto_posts')
          .update({ is_active: !isActive })
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-posts', entityType, entityId] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (entityType === 'contest') {
        const { error } = await supabase
          .from('contest_auto_posts')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_auto_posts')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-posts', entityType, entityId] });
    },
  });

  const getPlatformIcon = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.icon || TwitterIcon;
  };

  const activeSchedules = autoPosts?.filter(p => p.is_active) || [];
  const pausedSchedules = autoPosts?.filter(p => !p.is_active) || [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Auto-Posting</CardTitle>
              <CardDescription>
                Schedule automatic social media posts for {entityTitle}
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setShowCreateForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="px-6 pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Queue
              {activeSchedules.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {activeSchedules.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="pt-6">
          {/* Create Form Modal */}
          {showCreateForm && (
            <div className="mb-6 p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Schedule
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((platform) => {
                      const Icon = platform.icon;
                      const isSelected = newPost.platform === platform.id;
                      return (
                        <Button
                          key={platform.id}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => !platform.comingSoon && setNewPost({ ...newPost, platform: platform.id })}
                          disabled={platform.comingSoon}
                          className={`flex items-center gap-2 ${isSelected ? platform.color : ''}`}
                        >
                          <Icon className="h-4 w-4" />
                          {platform.name}
                          {platform.comingSoon && (
                            <Badge variant="outline" className="text-[10px] px-1">Soon</Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select 
                    value={newPost.schedule_interval} 
                    onValueChange={(v) => setNewPost({ ...newPost, schedule_interval: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleIntervals.map((interval) => (
                        <SelectItem key={interval.id} value={interval.id}>
                          <div className="flex flex-col">
                            <span>{interval.name}</span>
                            <span className="text-xs text-muted-foreground">{interval.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Post Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {postTypes[entityType].map((type) => (
                    <Button
                      key={type.id}
                      type="button"
                      variant={newPost.post_type === type.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewPost({ ...newPost, post_type: type.id })}
                      className="h-auto py-2 flex-col items-start text-left"
                    >
                      <span className="font-medium">{type.name}</span>
                      <span className="text-xs opacity-70">{type.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Custom Message (optional)</Label>
                <Textarea
                  value={newPost.custom_message}
                  onChange={(e) => setNewPost({ ...newPost, custom_message: e.target.value })}
                  placeholder="Leave empty for auto-generated messages based on post type..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {newPost.custom_message.length}/280 characters
                </p>
              </div>

              <Button 
                onClick={() => createMutation.mutate(newPost)}
                disabled={createMutation.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
              </Button>
            </div>
          )}

          <TabsContent value="queue" className="m-0 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : autoPosts && autoPosts.length > 0 ? (
              <div className="space-y-4">
                {activeSchedules.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Active Schedules
                    </h4>
                    {activeSchedules.map((post) => {
                      const Icon = getPlatformIcon(post.platform);
                      const platform = platforms.find(p => p.id === post.platform);
                      const postType = postTypes[entityType].find(t => t.id === post.post_type);
                      return (
                        <div 
                          key={post.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${platform?.color || 'bg-primary text-primary-foreground'}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{postType?.name || post.post_type}</span>
                                <Badge variant="outline" className="text-xs">
                                  {scheduleIntervals.find(i => i.id === post.schedule_interval)?.name}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {post.next_post_at && (
                                  <>Next: {format(new Date(post.next_post_at), 'MMM d, h:mm a')}</>
                                )}
                                {post.last_posted_at && (
                                  <> • Last: {format(new Date(post.last_posted_at), 'MMM d')}</>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={post.is_active}
                              onCheckedChange={() => toggleMutation.mutate({ id: post.id, isActive: post.is_active })}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm('Delete this schedule?')) {
                                  deleteMutation.mutate(post.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {pausedSchedules.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Paused Schedules
                    </h4>
                    {pausedSchedules.map((post) => {
                      const Icon = getPlatformIcon(post.platform);
                      const postType = postTypes[entityType].find(t => t.id === post.post_type);
                      return (
                        <div 
                          key={post.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 opacity-70"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <span className="font-medium">{postType?.name || post.post_type}</span>
                              <p className="text-sm text-muted-foreground">Paused</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={post.is_active}
                              onCheckedChange={() => toggleMutation.mutate({ id: post.id, isActive: post.is_active })}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm('Delete this schedule?')) {
                                  deleteMutation.mutate(post.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-1">No scheduled posts</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a schedule to automatically share updates
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Schedule
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="channels" className="m-0 space-y-4">
            <div className="space-y-3">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div 
                    key={platform.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      platform.comingSoon ? 'border-dashed border-muted' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        platform.comingSoon ? 'bg-muted' : platform.color
                      }`}>
                        <Icon className={`h-6 w-6 ${platform.comingSoon ? 'text-muted-foreground' : ''}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{platform.name}</span>
                          {platform.comingSoon && (
                            <Badge variant="secondary">Coming Soon</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {platform.comingSoon 
                            ? 'Integration in development'
                            : platform.connected 
                              ? 'Connected' 
                              : 'Not connected'
                          }
                        </p>
                      </div>
                    </div>
                    {!platform.comingSoon && (
                      <Button variant={platform.connected ? 'outline' : 'default'} size="sm">
                        {platform.connected ? 'Disconnect' : 'Connect'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-lg bg-muted/50 mt-4">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Twitter/X Setup
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                Add these secrets to your Supabase Edge Functions:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-background p-2 rounded">
                <div>TWITTER_CONSUMER_KEY</div>
                <div>TWITTER_CONSUMER_SECRET</div>
                <div>TWITTER_ACCESS_TOKEN</div>
                <div>TWITTER_ACCESS_TOKEN_SECRET</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create" className="m-0 space-y-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border">
                <h4 className="font-medium mb-2">Default Post Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Configure default settings for all auto-posts
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border">
                <h4 className="font-medium mb-2">Post Templates</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Templates used for auto-generated posts:
                </p>
                <div className="space-y-2">
                  {postTypes[entityType].map((type) => (
                    <div key={type.id} className="p-3 bg-muted/50 rounded text-sm">
                      <span className="font-medium">{type.name}:</span>
                      <span className="text-muted-foreground ml-2">{type.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Pro Tip
                </h4>
                <p className="text-sm text-muted-foreground">
                  For best engagement, schedule posts during peak hours (9am-11am and 6pm-9pm local time).
                  Use the "Twice Daily" option to automatically post at these optimal times.
                </p>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};
