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
import { Clock, Plus, Trash2, Twitter } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
                    <Twitter className="h-5 w-5 text-primary" />
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
