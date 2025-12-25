import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContests } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { Send, Twitter, Facebook, Instagram, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export const QuickSocialPost: React.FC = () => {
  const { user } = useAuth();
  const { data: contests } = useOrganizationContests();
  
  const [selectedContest, setSelectedContest] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const activeContests = contests?.filter(c => c.is_active) || [];

  const getContestUrl = (contestId: string) => {
    const contest = contests?.find(c => c.id === contestId);
    if (!contest) return '';
    return contest.custom_slug 
      ? `${window.location.origin}/c/${contest.custom_slug}`
      : `${window.location.origin}/contests/${contestId}`;
  };

  const handlePost = async (platform: string) => {
    if (!message) {
      toast.error('Please enter a message');
      return;
    }

    const contestUrl = selectedContest ? getContestUrl(selectedContest) : window.location.origin;

    if (platform !== 'twitter') {
      const encodedMessage = encodeURIComponent(message);
      const encodedUrl = encodeURIComponent(contestUrl);
      
      if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`, '_blank');
      } else if (platform === 'instagram') {
        navigator.clipboard.writeText(message);
        toast.success('Message copied! Open Instagram to post.');
      }
      return;
    }

    setIsPosting(true);

    try {
      const { error } = await supabase.functions.invoke('social-post', {
        body: {
          platform,
          message,
          contestId: selectedContest || null,
          contestUrl,
        },
      });

      if (error) throw error;

      toast.success('Posted to Twitter successfully!');
      setMessage('');
    } catch (error: any) {
      console.error('Social post error:', error);
      toast.error(error.message || 'Failed to post. Check your API keys.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Quick Post
        </CardTitle>
        <CardDescription>
          Post updates to your social media accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Contest (Optional)</Label>
          <Select value={selectedContest} onValueChange={setSelectedContest}>
            <SelectTrigger>
              <SelectValue placeholder="Select a contest to link" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No contest</SelectItem>
              {activeContests.map((contest) => (
                <SelectItem key={contest.id} value={contest.id}>
                  {contest.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your social media post..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/280 characters
          </p>
        </div>

        {message && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
            <pre className="whitespace-pre-wrap text-sm font-sans">{message}</pre>
          </div>
        )}

        <div className="space-y-2">
          <Label>Post to</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handlePost('twitter')}
              disabled={!message || isPosting}
              className="flex items-center gap-2"
            >
              {isPosting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Twitter className="h-4 w-4" />
              )}
              Post to Twitter
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePost('facebook')}
              disabled={!message}
              className="flex items-center gap-2"
            >
              <Facebook className="h-4 w-4" />
              Facebook
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePost('instagram')}
              disabled={!message}
              className="flex items-center gap-2"
            >
              <Instagram className="h-4 w-4" />
              Instagram
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Facebook & Instagram will open in a new window.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
