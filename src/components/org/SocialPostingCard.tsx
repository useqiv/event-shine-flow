import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Twitter, Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Contestant {
  id: string;
  name: string;
  vote_count: number;
  photo_url: string | null;
}

interface Contest {
  id: string;
  title: string;
  custom_slug: string | null;
  brand_primary_color: string | null;
}

interface SocialPostingCardProps {
  contest: Contest;
  contestants: Contestant[];
}

type PostStatus = 'idle' | 'posting' | 'success' | 'error';

export const SocialPostingCard: React.FC<SocialPostingCardProps> = ({ contest, contestants }) => {
  const { toast } = useToast();
  const [postType, setPostType] = useState<'leaderboard' | 'contestant' | 'custom'>('leaderboard');
  const [selectedContestant, setSelectedContestant] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [postStatus, setPostStatus] = useState<PostStatus>('idle');

  const contestUrl = contest.custom_slug 
    ? `${window.location.origin}/c/${contest.custom_slug}`
    : `${window.location.origin}/contests/${contest.id}`;

  const generateMessage = () => {
    if (postType === 'custom') return customMessage;
    
    if (postType === 'leaderboard') {
      const top3 = contestants.slice(0, 3);
      let message = `🏆 ${contest.title} - Live Leaderboard!\n\n`;
      top3.forEach((c, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
        message += `${medal} ${c.name}: ${c.vote_count.toLocaleString()} votes\n`;
      });
      message += `\n🗳️ Vote now: ${contestUrl}`;
      return message;
    }

    if (postType === 'contestant' && selectedContestant) {
      const contestant = contestants.find(c => c.id === selectedContestant);
      if (contestant) {
        const rank = contestants.findIndex(c => c.id === selectedContestant) + 1;
        return `🌟 ${contestant.name} is currently #${rank} in ${contest.title} with ${contestant.vote_count.toLocaleString()} votes!\n\nSupport them now: ${contestUrl}?vote=${contestant.id}`;
      }
    }

    return '';
  };

  const handlePost = async (platform: 'twitter') => {
    const message = generateMessage();
    if (!message) {
      toast({
        title: 'Empty Message',
        description: 'Please generate or write a message first.',
        variant: 'destructive',
      });
      return;
    }

    setPostStatus('posting');

    try {
      const { data, error } = await supabase.functions.invoke('social-post', {
        body: {
          platform,
          message,
          contestId: contest.id,
          contestUrl,
        },
      });

      if (error) throw error;

      setPostStatus('success');
      toast({
        title: 'Posted Successfully!',
        description: `Your message has been posted to ${platform}.`,
      });

      setTimeout(() => setPostStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Social post error:', error);
      setPostStatus('error');
      toast({
        title: 'Posting Failed',
        description: error.message || 'Failed to post to social media. Please check your API keys.',
        variant: 'destructive',
      });

      setTimeout(() => setPostStatus('idle'), 3000);
    }
  };

  const previewMessage = generateMessage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Social Media Auto-Posting
        </CardTitle>
        <CardDescription>
          Share contest updates to your social media accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Post Type Selection */}
        <div className="space-y-2">
          <Label>Post Type</Label>
          <Select value={postType} onValueChange={(v) => setPostType(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="leaderboard">Leaderboard Update</SelectItem>
              <SelectItem value="contestant">Contestant Spotlight</SelectItem>
              <SelectItem value="custom">Custom Message</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contestant Selection for Spotlight */}
        {postType === 'contestant' && (
          <div className="space-y-2">
            <Label>Select Contestant</Label>
            <Select value={selectedContestant} onValueChange={setSelectedContestant}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a contestant" />
              </SelectTrigger>
              <SelectContent>
                {contestants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.vote_count.toLocaleString()} votes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Custom Message */}
        {postType === 'custom' && (
          <div className="space-y-2">
            <Label>Custom Message</Label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Write your custom message..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {customMessage.length}/280 characters
            </p>
          </div>
        )}

        {/* Message Preview */}
        {previewMessage && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <pre className="whitespace-pre-wrap text-sm font-sans">{previewMessage}</pre>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        {postStatus !== 'idle' && (
          <div className="flex items-center gap-2">
            {postStatus === 'posting' && (
              <>
                <Clock className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Posting...</span>
              </>
            )}
            {postStatus === 'success' && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">Posted successfully!</span>
              </>
            )}
            {postStatus === 'error' && (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">Failed to post</span>
              </>
            )}
          </div>
        )}

        {/* Post Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handlePost('twitter')}
            disabled={!previewMessage || postStatus === 'posting'}
            className="flex items-center gap-2"
          >
            <Twitter className="h-4 w-4" />
            Post to X/Twitter
          </Button>
        </div>

        {/* Setup Instructions */}
        <div className="mt-4 p-4 rounded-lg bg-muted/50">
          <h4 className="font-medium text-sm mb-2">Setup Required</h4>
          <p className="text-xs text-muted-foreground">
            To enable auto-posting, configure your Twitter API keys in Supabase Edge Function secrets:
          </p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
            <li>• TWITTER_CONSUMER_KEY</li>
            <li>• TWITTER_CONSUMER_SECRET</li>
            <li>• TWITTER_ACCESS_TOKEN</li>
            <li>• TWITTER_ACCESS_TOKEN_SECRET</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
