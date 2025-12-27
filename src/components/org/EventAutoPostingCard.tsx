import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useEventAutoPosts, 
  useCreateEventAutoPost, 
  useUpdateEventAutoPost, 
  useDeleteEventAutoPost 
} from '@/hooks/useEventAutoPosts';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

const platformIcons: Record<string, React.FC<{ className?: string }>> = {
  twitter: TwitterIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
};

interface EventAutoPostingCardProps {
  eventId: string;
  eventTitle: string;
}

const postTypes = [
  { id: 'event_countdown', name: 'Event Countdown' },
  { id: 'tickets_selling', name: 'Tickets Selling Fast' },
  { id: 'event_reminder', name: 'Event Reminder' },
  { id: 'event_announcement', name: 'Event Announcement' },
];

const scheduleIntervals = [
  { id: 'hourly', name: 'Every Hour' },
  { id: 'twice_daily', name: 'Twice Daily' },
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
];

export const EventAutoPostingCard: React.FC<EventAutoPostingCardProps> = ({ eventId, eventTitle }) => {
  const { data: autoPosts, isLoading } = useEventAutoPosts(eventId);
  const createAutoPost = useCreateEventAutoPost();
  const updateAutoPost = useUpdateEventAutoPost();
  const deleteAutoPost = useDeleteEventAutoPost();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPost, setNewPost] = useState({
    platform: 'twitter',
    post_type: 'event_countdown',
    schedule_interval: 'daily',
    custom_message: '',
  });

  const handleCreate = async () => {
    await createAutoPost.mutateAsync({
      event_id: eventId,
      ...newPost,
      custom_message: newPost.custom_message || undefined,
    });
    setShowAddForm(false);
    setNewPost({
      platform: 'twitter',
      post_type: 'event_countdown',
      schedule_interval: 'daily',
      custom_message: '',
    });
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateAutoPost.mutateAsync({ id, is_active: !isActive });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this auto-post schedule?')) {
      await deleteAutoPost.mutateAsync(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Auto-Posts
            </CardTitle>
            <CardDescription>
              Automatically post updates about {eventTitle}
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="p-4 border border-border rounded-lg space-y-4 bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={newPost.platform} onValueChange={(v) => setNewPost({ ...newPost, platform: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">Twitter / X</SelectItem>
                    <SelectItem value="facebook">Facebook (Coming Soon)</SelectItem>
                    <SelectItem value="instagram">Instagram (Coming Soon)</SelectItem>
                    <SelectItem value="tiktok">TikTok (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Post Type</Label>
                <Select value={newPost.post_type} onValueChange={(v) => setNewPost({ ...newPost, post_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {postTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={newPost.schedule_interval} onValueChange={(v) => setNewPost({ ...newPost, schedule_interval: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleIntervals.map((interval) => (
                      <SelectItem key={interval.id} value={interval.id}>{interval.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Custom Message (optional)</Label>
              <Input
                placeholder="Leave empty for auto-generated messages"
                value={newPost.custom_message}
                onChange={(e) => setNewPost({ ...newPost, custom_message: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createAutoPost.isPending}>
                {createAutoPost.isPending ? 'Creating...' : 'Create Schedule'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : autoPosts && autoPosts.length > 0 ? (
          <div className="space-y-3">
            {autoPosts.map((post) => (
              <div 
                key={post.id} 
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {(() => {
                      const Icon = platformIcons[post.platform] || TwitterIcon;
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {postTypes.find(t => t.id === post.post_type)?.name || post.post_type}
                      </p>
                      <Badge variant={post.is_active ? 'default' : 'secondary'}>
                        {post.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {scheduleIntervals.find(i => i.id === post.schedule_interval)?.name || post.schedule_interval}
                      {post.next_post_at && ` • Next: ${format(new Date(post.next_post_at), 'MMM d, h:mm a')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={post.is_active} 
                    onCheckedChange={() => handleToggleActive(post.id, post.is_active)}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No scheduled posts yet</p>
            <p className="text-sm text-muted-foreground">Create a schedule to automatically post updates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
