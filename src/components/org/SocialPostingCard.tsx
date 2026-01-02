import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Twitter, Facebook, Instagram, Send, Clock, CheckCircle2, AlertCircle, ExternalLink, ImagePlus, X } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';

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

const platforms = [
  { id: 'twitter', name: 'X/Twitter', icon: Twitter, available: true, color: 'bg-black' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, available: false, color: 'bg-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, available: false, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
];

export const SocialPostingCard: React.FC<SocialPostingCardProps> = ({ contest, contestants }) => {
  const { toast } = useToast();
  const [postType, setPostType] = useState<'leaderboard' | 'contestant' | 'custom'>('leaderboard');
  const [selectedContestant, setSelectedContestant] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [postStatus, setPostStatus] = useState<PostStatus>('idle');
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');
  const [postImage, setPostImage] = useState<string>('');

  const contestUrl = contest.custom_slug 
    ? `${window.location.origin}/${contest.custom_slug}`
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

  const handlePost = async (platform: string) => {
    const message = generateMessage();
    if (!message) {
      toast({
        title: 'Empty Message',
        description: 'Please generate or write a message first.',
        variant: 'destructive',
      });
      return;
    }

    if (platform !== 'twitter') {
      // Open share URL for unsupported platforms
      const encodedMessage = encodeURIComponent(message);
      const encodedUrl = encodeURIComponent(contestUrl);
      
      if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`, '_blank');
      } else if (platform === 'instagram') {
        // Instagram doesn't have a web share API, copy to clipboard
        navigator.clipboard.writeText(message);
        toast({
          title: 'Copied to Clipboard',
          description: 'Message copied! Open Instagram to post manually.',
        });
      }
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
          imageUrl: postImage || undefined,
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
        description: error.message || 'Failed to post. Check your API keys in Supabase secrets.',
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
          Social Media Posting
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

        {/* Image Upload */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4" />
            Attach Image (Optional)
          </Label>
          {postImage ? (
            <div className="relative inline-block">
              <img 
                src={postImage} 
                alt="Post image" 
                className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-border"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={() => setPostImage('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <ImageUpload
              bucket="contest-images"
              value={postImage}
              onChange={setPostImage}
              className="max-w-[300px]"
            />
          )}
        </div>

        {/* Message Preview */}
        {previewMessage && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <pre className="whitespace-pre-wrap text-sm font-sans">{previewMessage}</pre>
              {postImage && (
                <img 
                  src={postImage} 
                  alt="Preview" 
                  className="mt-3 max-w-full max-h-[150px] rounded-lg object-cover"
                />
              )}
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

        {/* Platform Buttons */}
        <div className="space-y-2">
          <Label>Post to Platform</Label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <Button
                  key={platform.id}
                  onClick={() => handlePost(platform.id)}
                  disabled={!previewMessage || postStatus === 'posting'}
                  variant={platform.available ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {platform.name}
                  {!platform.available && (
                    <ExternalLink className="h-3 w-3 ml-1" />
                  )}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Facebook & Instagram will open in a new window for manual posting.
          </p>
        </div>

        {/* Setup Instructions */}
        <div className="mt-4 p-4 rounded-lg bg-muted/50">
          <h4 className="font-medium text-sm mb-2">Auto-Posting Setup (Twitter)</h4>
          <p className="text-xs text-muted-foreground">
            Configure your Twitter API keys in Supabase Edge Function secrets:
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
