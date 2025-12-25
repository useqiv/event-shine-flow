import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganizationContests } from '@/hooks/useOrganization';
import { useContestants } from '@/hooks/useContests';
import { supabase } from '@/integrations/supabase/client';
import { Send, Twitter, Facebook, Instagram, Loader2, ExternalLink, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

const postTypes = [
  { id: 'leaderboard', name: 'Leaderboard Update' },
  { id: 'contestant', name: 'Contestant Spotlight' },
  { id: 'countdown', name: 'Countdown / Urgency' },
  { id: 'engagement', name: 'Engagement Post' },
  { id: 'announcement', name: 'Announcement' },
];

export const QuickSocialPost: React.FC = () => {
  const { data: contests } = useOrganizationContests();
  
  const [selectedContest, setSelectedContest] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('twitter');
  const [postType, setPostType] = useState<string>('leaderboard');
  const [message, setMessage] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeContests = contests?.filter(c => c.is_active) || [];
  const selectedContestData = contests?.find(c => c.id === selectedContest);
  
  const { data: contestants } = useContestants(selectedContest);
  const sortedContestants = contestants ? [...contestants].sort((a, b) => b.vote_count - a.vote_count) : [];

  const getContestUrl = (contestId: string) => {
    const contest = contests?.find(c => c.id === contestId);
    if (!contest) return '';
    return contest.custom_slug 
      ? `${window.location.origin}/c/${contest.custom_slug}`
      : `${window.location.origin}/contests/${contestId}`;
  };

  const handleGenerateAI = async () => {
    if (!selectedContest) {
      toast.error('Please select a contest first');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-social-post', {
        body: {
          contestTitle: selectedContestData?.title,
          contestants: sortedContestants.slice(0, 5).map(c => ({
            name: c.name,
            vote_count: c.vote_count,
          })),
          postType,
          platform: selectedPlatform,
          customContext: customContext || undefined,
        },
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message?.includes('402')) {
          toast.error('AI credits depleted. Please add credits to continue.');
        } else {
          throw error;
        }
        return;
      }

      if (data?.post) {
        setMessage(data.post);
        toast.success('AI generated your post!');
      } else {
        throw new Error('No post generated');
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'Failed to generate post');
    } finally {
      setIsGenerating(false);
    }
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
          <Sparkles className="h-5 w-5" />
          AI-Powered Social Posts
        </CardTitle>
        <CardDescription>
          Generate engaging posts with AI or write your own
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Select Contest</Label>
            <Select value={selectedContest} onValueChange={setSelectedContest}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a contest" />
              </SelectTrigger>
              <SelectContent>
                {activeContests.map((contest) => (
                  <SelectItem key={contest.id} value={contest.id}>
                    {contest.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twitter">X / Twitter</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Post Type</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Custom Context (Optional)</Label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g., Voting ends at midnight"
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
            />
          </div>
        </div>

        {/* AI Generate Button */}
        <Button
          onClick={handleGenerateAI}
          disabled={!selectedContest || isGenerating}
          variant="outline"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating with AI...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate with AI
            </>
          )}
        </Button>

        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Generate with AI or write your own post..."
            rows={5}
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
