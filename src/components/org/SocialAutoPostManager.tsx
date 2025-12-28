import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
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
  Zap,
  Sparkles,
  Loader2,
  Pencil,
  RefreshCw,
  CalendarIcon,
  Repeat,
  ImagePlus,
  X
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SocialAccountsConfig } from './SocialAccountsConfig';
import { useOrganizationSocialAccounts } from '@/hooks/useOrganizationSocialAccounts';
import { toast } from 'sonner';

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
  { id: 'facebook', name: 'Facebook', icon: FacebookIcon, connected: false, color: 'bg-[#1877F2] text-white' },
  { id: 'instagram', name: 'Instagram', icon: InstagramIcon, connected: false, color: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white' },
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, connected: false, color: 'bg-black text-white' },
];

const postTypes = {
  contest: [
    { id: 'leaderboard', name: 'Leaderboard Update', description: 'Share current standings' },
    { id: 'contestant_spotlight', name: 'Contestant Spotlight', description: 'Feature a contestant' },
    { id: 'voting_reminder', name: 'Voting Reminder', description: 'Remind followers to vote' },
    { id: 'milestone', name: 'Vote Milestone', description: 'Celebrate vote milestones' },
    { id: 'behind_scenes', name: 'Behind the Scenes', description: 'Exclusive backstage content' },
    { id: 'contestant_intro', name: 'Contestant Introduction', description: 'Introduce a new contestant' },
    { id: 'voting_closes', name: 'Voting Closes Soon', description: 'Urgent last-call to vote' },
    { id: 'winner_teaser', name: 'Winner Teaser', description: 'Build suspense for results' },
    { id: 'thank_you', name: 'Thank You Post', description: 'Thank voters and supporters' },
    { id: 'engagement', name: 'Engagement Post', description: 'Ask questions, polls, interact' },
    { id: 'custom', name: 'Custom Post', description: 'Write your own type' },
  ],
  event: [
    { id: 'event_countdown', name: 'Event Countdown', description: 'Days until event' },
    { id: 'tickets_selling', name: 'Tickets Update', description: 'Ticket sales info' },
    { id: 'event_reminder', name: 'Event Reminder', description: 'Remind about the event' },
    { id: 'event_announcement', name: 'Announcement', description: 'General updates' },
    { id: 'early_bird', name: 'Early Bird Special', description: 'Limited time ticket offers' },
    { id: 'lineup_reveal', name: 'Lineup Reveal', description: 'Announce performers/speakers' },
    { id: 'venue_spotlight', name: 'Venue Spotlight', description: 'Highlight the venue' },
    { id: 'tickets_almost_gone', name: 'Tickets Almost Gone', description: 'Scarcity/urgency post' },
    { id: 'event_live', name: 'Event is Live', description: 'Announce event has started' },
    { id: 'post_event', name: 'Post-Event Recap', description: 'Thank attendees, share highlights' },
    { id: 'engagement', name: 'Engagement Post', description: 'Ask questions, polls, interact' },
    { id: 'custom', name: 'Custom Post', description: 'Write your own type' },
  ],
};

const scheduleIntervals = [
  { id: 'once', name: 'One-Time', description: 'Post once at scheduled time' },
  { id: 'hourly', name: 'Every Hour', description: 'Post once every hour' },
  { id: 'twice_daily', name: 'Twice Daily', description: 'Post at 9am and 6pm' },
  { id: 'daily', name: 'Daily', description: 'Post once per day' },
  { id: 'weekly', name: 'Weekly', description: 'Post once per week' },
];

const toneOptions = [
  { id: 'exciting', name: 'Exciting', description: 'Energetic and enthusiastic' },
  { id: 'professional', name: 'Professional', description: 'Formal and trustworthy' },
  { id: 'casual', name: 'Casual', description: 'Friendly and relaxed' },
  { id: 'urgent', name: 'Urgent', description: 'Time-sensitive, FOMO' },
  { id: 'humorous', name: 'Humorous', description: 'Fun and playful' },
  { id: 'inspirational', name: 'Inspirational', description: 'Motivating and uplifting' },
];

export const SocialAutoPostManager: React.FC<SocialAutoPostManagerProps> = ({
  entityId,
  entityType,
  entityTitle,
}) => {
  const { user } = useAuth();
  const { confirm } = useConfirmDialog();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'accounts' | 'create' | 'queue' | 'channels'>('accounts');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPost, setNewPost] = useState({
    platform: 'twitter',
    post_type: postTypes[entityType][0].id,
    schedule_interval: 'daily',
    custom_message: '',
    scheduled_date: undefined as Date | undefined,
    scheduled_time: '09:00',
  });
  
  // Custom post state
  const [customPost, setCustomPost] = useState({
    platform: 'twitter',
    message: '',
    tone: 'exciting',
    includeHashtags: true,
    postType: postTypes[entityType][0].id,
    customPostType: '',
    imageUrl: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [newPostCustomType, setNewPostCustomType] = useState('');

  // AI Generate post
  const handleGeneratePost = async () => {
    setIsGenerating(true);
    try {
      // Build custom context including custom post type if selected
      let customContext = customPost.message ? `Current draft: ${customPost.message}` : undefined;
      if (customPost.postType === 'custom' && customPost.customPostType) {
        customContext = customPost.customPostType + (customContext ? `. ${customContext}` : '');
      }

      const { data, error } = await supabase.functions.invoke('generate-social-post', {
        body: {
          contentType: entityType,
          contestTitle: entityType === 'contest' ? entityTitle : undefined,
          eventTitle: entityType === 'event' ? entityTitle : undefined,
          postType: customPost.postType === 'custom' ? customPost.customPostType || 'general' : customPost.postType,
          platform: customPost.platform,
          customContext,
        }
      });

      if (error) throw error;

      if (data?.post) {
        setCustomPost(prev => ({ ...prev, message: data.post }));
        toast.success('AI generated a post for you!');
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Generate post error:', error);
      toast.error('Failed to generate post', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Send custom post now
  const handlePostNow = async () => {
    if (!customPost.message.trim()) {
      toast.error('Please write or generate a message first');
      return;
    }

    const account = socialAccounts?.find(a => a.platform === customPost.platform && a.is_connected);
    if (!account) {
      toast.error('Please connect your account first', {
        description: `Go to Accounts tab to connect your ${platforms.find(p => p.id === customPost.platform)?.name} account`
      });
      return;
    }

    setIsPosting(true);
    try {
      const { data, error } = await supabase.functions.invoke('social-post', {
        body: {
          platform: customPost.platform,
          message: customPost.message,
          contestId: entityType === 'contest' ? entityId : undefined,
          eventId: entityType === 'event' ? entityId : undefined,
          imageUrl: customPost.imageUrl || undefined,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Posted to ${platforms.find(p => p.id === customPost.platform)?.name}!`);
        setCustomPost(prev => ({ ...prev, message: '', imageUrl: '' }));
      } else {
        throw new Error(data?.error || 'Failed to post');
      }
    } catch (error: any) {
      console.error('Post error:', error);
      toast.error('Failed to post', {
        description: error.message || 'Please check your API credentials'
      });
    } finally {
      setIsPosting(false);
    }
  };

  // Fetch connected social accounts
  const { data: socialAccounts } = useOrganizationSocialAccounts();
  
  const isAccountConnected = (platformId: string) => {
    return socialAccounts?.some(a => a.platform === platformId && a.is_connected);
  };

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
      let nextPostAt: Date;
      
      // If a specific date/time is set, use that
      if (postData.scheduled_date) {
        const [hours, minutes] = postData.scheduled_time.split(':').map(Number);
        nextPostAt = new Date(postData.scheduled_date);
        nextPostAt.setHours(hours, minutes, 0, 0);
      } else {
        // Otherwise calculate based on interval
        nextPostAt = new Date();
        switch (postData.schedule_interval) {
          case 'once':
            // For one-time without date, schedule 1 hour from now
            nextPostAt.setHours(nextPostAt.getHours() + 1);
            break;
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
        scheduled_date: undefined,
        scheduled_time: '09:00',
      });
      toast.success('Schedule created successfully!');
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
  const connectedAccountsCount = socialAccounts?.filter(a => a.is_connected).length || 0;

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Accounts
              {connectedAccountsCount === 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                  Setup
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Create Post
            </TabsTrigger>
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
          </TabsList>
        </div>

        <CardContent className="pt-6">
          {/* Create Post Tab */}
          <TabsContent value="create" className="m-0 space-y-4">
            <div className="p-4 border rounded-lg bg-card space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Create Custom Post</h3>
              </div>
              
              {/* Platform Selection */}
              <div className="space-y-2">
                <Label>Platform</Label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = customPost.platform === platform.id;
                    const isConnected = socialAccounts?.some(a => a.platform === platform.id && a.is_connected);
                    return (
                      <Button
                        key={platform.id}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCustomPost({ ...customPost, platform: platform.id })}
                        className={`flex items-center gap-2 ${isSelected ? platform.color : ''}`}
                      >
                        <Icon className="h-4 w-4" />
                        {platform.name}
                        {isConnected && (
                          <CheckCircle2 className="h-3 w-3 text-green-400" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Post Type for AI context */}
              <div className="space-y-2">
                <Label>Post Type (for AI context)</Label>
                <Select
                  value={customPost.postType}
                  onValueChange={(v) => setCustomPost({ ...customPost, postType: v, customPostType: v === 'custom' ? customPost.customPostType : '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {postTypes[entityType].map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} - {type.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Custom post type input */}
                {customPost.postType === 'custom' && (
                  <div className="mt-2">
                    <Input
                      placeholder="Describe your post type (e.g., 'Fan appreciation post', 'Sponsor shoutout')"
                      value={customPost.customPostType}
                      onChange={(e) => setCustomPost({ ...customPost, customPostType: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Tone Selection */}
              <div className="space-y-2">
                <Label>Tone</Label>
                <div className="flex flex-wrap gap-2">
                  {toneOptions.map((tone) => (
                    <Button
                      key={tone.id}
                      type="button"
                      variant={customPost.tone === tone.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCustomPost({ ...customPost, tone: tone.id })}
                    >
                      {tone.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Include Hashtags Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="hashtags">Include Hashtags</Label>
                <Switch
                  id="hashtags"
                  checked={customPost.includeHashtags}
                  onCheckedChange={(checked) => setCustomPost({ ...customPost, includeHashtags: checked })}
                />
              </div>

              {/* Message Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Your Message</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePost}
                    disabled={isGenerating}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={customPost.message}
                  onChange={(e) => setCustomPost({ ...customPost, message: e.target.value })}
                  placeholder="Write your post or click 'Generate with AI' to create one automatically..."
                  rows={5}
                  className="resize-none"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{customPost.message.length} characters</span>
                  {customPost.platform === 'twitter' && customPost.message.length > 280 && (
                    <span className="text-destructive">Exceeds Twitter limit (280)</span>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  Attach Image (Optional)
                </Label>
                {customPost.imageUrl ? (
                  <div className="relative inline-block">
                    <img 
                      src={customPost.imageUrl} 
                      alt="Post image" 
                      className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setCustomPost({ ...customPost, imageUrl: '' })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <ImageUpload
                    bucket={entityType === 'contest' ? 'contest-images' : 'event-images'}
                    value={customPost.imageUrl}
                    onChange={(url) => setCustomPost({ ...customPost, imageUrl: url })}
                    className="max-w-[300px]"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleGeneratePost}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
                <Button
                  onClick={handlePostNow}
                  disabled={isPosting || !customPost.message.trim()}
                  className="flex-1"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post Now
                    </>
                  )}
                </Button>
              </div>

              {/* Account connection warning */}
              {!socialAccounts?.some(a => a.platform === customPost.platform && a.is_connected) && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        {platforms.find(p => p.id === customPost.platform)?.name} not connected
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Connect your account in the Accounts tab to post.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Create Schedule Form Modal */}
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
                          onClick={() => setNewPost({ ...newPost, platform: platform.id })}
                          className={`flex items-center gap-2 ${isSelected ? platform.color : ''}`}
                        >
                          <Icon className="h-4 w-4" />
                          {platform.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    Frequency
                  </Label>
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

              {/* Date and Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-border bg-muted/30">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {newPost.schedule_interval === 'once' ? 'Post Date' : 'Start Date (optional)'}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newPost.scheduled_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newPost.scheduled_date ? (
                          format(newPost.scheduled_date, "PPP")
                        ) : (
                          <span>{newPost.schedule_interval === 'once' ? 'Pick a date' : 'Start immediately'}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newPost.scheduled_date}
                        onSelect={(date) => setNewPost({ ...newPost, scheduled_date: date })}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  {newPost.scheduled_date && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setNewPost({ ...newPost, scheduled_date: undefined })}
                      className="text-xs text-muted-foreground"
                    >
                      Clear date
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {newPost.schedule_interval === 'once' ? 'Post Time' : 'Start Time'}
                  </Label>
                  <Select 
                    value={newPost.scheduled_time} 
                    onValueChange={(v) => setNewPost({ ...newPost, scheduled_time: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <React.Fragment key={hour}>
                            <SelectItem value={`${hour}:00`}>
                              {format(new Date().setHours(i, 0), 'h:00 a')}
                            </SelectItem>
                            <SelectItem value={`${hour}:30`}>
                              {format(new Date().setHours(i, 30), 'h:30 a')}
                            </SelectItem>
                          </React.Fragment>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {newPost.schedule_interval === 'once' 
                      ? 'One-time post at this time' 
                      : newPost.schedule_interval === 'twice_daily'
                        ? 'First post at this time, second 12 hours later'
                        : `Posts will be scheduled at this time ${newPost.schedule_interval === 'hourly' ? 'starting from' : 'each'} ${scheduleIntervals.find(i => i.id === newPost.schedule_interval)?.name.toLowerCase()}`
                    }
                  </p>
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
                      onClick={() => {
                        setNewPost({ ...newPost, post_type: type.id });
                        if (type.id !== 'custom') setNewPostCustomType('');
                      }}
                      className="h-auto py-2 flex-col items-start text-left"
                    >
                      <span className="font-medium">{type.name}</span>
                      <span className="text-xs opacity-70">{type.description}</span>
                    </Button>
                  ))}
                </div>
                
                {/* Custom post type input for schedules */}
                {newPost.post_type === 'custom' && (
                  <Input
                    className="mt-2"
                    placeholder="Describe your custom post type..."
                    value={newPostCustomType}
                    onChange={(e) => setNewPostCustomType(e.target.value)}
                  />
                )}
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
                onClick={() => {
                  if (newPost.schedule_interval === 'once' && !newPost.scheduled_date) {
                    toast.error('Please select a date for one-time posts');
                    return;
                  }
                  createMutation.mutate(newPost);
                }}
                disabled={createMutation.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
              </Button>
            </div>
          )}

          <TabsContent value="queue" className="m-0 space-y-4">
            {/* Setup prompt when no accounts connected */}
            {connectedAccountsCount === 0 && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-700 dark:text-amber-400">Connect your social accounts first</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Before creating auto-post schedules, you need to connect at least one social media account.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                      onClick={() => setActiveTab('accounts')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Go to Accounts
                    </Button>
                  </div>
                </div>
              </div>
            )}

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
                              onClick={async () => {
                                const confirmed = await confirm({
                                  title: 'Delete Schedule',
                                  description: 'Are you sure you want to delete this schedule? This action cannot be undone.',
                                  confirmText: 'Delete',
                                  variant: 'destructive',
                                });
                                if (confirmed) {
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
                              onClick={async () => {
                                const confirmed = await confirm({
                                  title: 'Delete Schedule',
                                  description: 'Are you sure you want to delete this schedule? This action cannot be undone.',
                                  confirmText: 'Delete',
                                  variant: 'destructive',
                                });
                                if (confirmed) {
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
                const connected = isAccountConnected(platform.id);
                const account = socialAccounts?.find(a => a.platform === platform.id);
                
                return (
                  <div 
                    key={platform.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      platform.comingSoon ? 'border-dashed border-muted' : connected ? 'border-green-500/50 bg-green-500/5' : 'border-border'
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
                          {connected && (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {platform.comingSoon 
                            ? 'Integration in development'
                            : connected 
                              ? account?.account_name || 'Connected' 
                              : 'Not connected - Go to Accounts tab to connect'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Connect Your Accounts
              </h4>
              <p className="text-sm text-muted-foreground">
                Go to the <strong>Accounts</strong> tab to connect your social media accounts. 
                Once connected, you can create auto-post schedules for your {entityType}.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="m-0">
            <SocialAccountsConfig />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};
