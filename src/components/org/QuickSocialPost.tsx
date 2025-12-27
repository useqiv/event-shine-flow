import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganizationContests, useOrganizationEvents } from '@/hooks/useOrganization';
import { useContestants } from '@/hooks/useContests';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2, ExternalLink, Sparkles, Wand2, Trophy, Calendar, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

// Platform icons
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const contestPostTypes = [
  { id: 'leaderboard', name: 'Leaderboard Update', description: 'Share current standings' },
  { id: 'contestant', name: 'Contestant Spotlight', description: 'Feature a contestant' },
  { id: 'countdown', name: 'Countdown / Urgency', description: 'Create FOMO' },
  { id: 'engagement', name: 'Engagement Post', description: 'Ask questions, polls' },
  { id: 'announcement', name: 'Announcement', description: 'General updates' },
];

const eventPostTypes = [
  { id: 'event_announcement', name: 'Event Announcement', description: 'Announce the event' },
  { id: 'event_countdown', name: 'Event Countdown', description: 'Days until event' },
  { id: 'tickets_selling', name: 'Tickets Selling Fast', description: 'Create urgency' },
  { id: 'event_reminder', name: 'Event Reminder', description: 'Remind about event' },
  { id: 'event_live', name: 'Event is Live', description: 'Announce event start' },
];

const platforms = [
  { id: 'twitter', name: 'X (Twitter)', icon: TwitterIcon, bgClass: 'bg-foreground' },
  { id: 'facebook', name: 'Facebook', icon: FacebookIcon, bgClass: 'bg-[#1877F2]' },
  { id: 'instagram', name: 'Instagram', icon: InstagramIcon, bgClass: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]' },
];

export const QuickSocialPost: React.FC = () => {
  const { data: contests } = useOrganizationContests();
  const { data: events } = useOrganizationEvents();
  
  const [contentType, setContentType] = useState<'contest' | 'event'>('contest');
  const [selectedContest, setSelectedContest] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('twitter');
  const [postType, setPostType] = useState<string>('leaderboard');
  const [message, setMessage] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeContests = contests?.filter(c => c.is_active) || [];
  const activeEvents = events?.filter(e => e.is_active) || [];
  const selectedContestData = contests?.find(c => c.id === selectedContest);
  const selectedEventData = events?.find(e => e.id === selectedEvent);
  
  const { data: contestants } = useContestants(selectedContest);
  const sortedContestants = contestants ? [...contestants].sort((a, b) => b.vote_count - a.vote_count) : [];
  
  const currentPostTypes = contentType === 'contest' ? contestPostTypes : eventPostTypes;
  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform);

  const getContestUrl = (contestId: string) => {
    const contest = contests?.find(c => c.id === contestId);
    if (!contest) return '';
    return contest.custom_slug 
      ? `${window.location.origin}/c/${contest.custom_slug}`
      : `${window.location.origin}/contests/${contestId}`;
  };

  const getEventUrl = (eventId: string) => {
    return `${window.location.origin}/events/${eventId}`;
  };

  const handleGenerateAI = async () => {
    if (contentType === 'contest' && !selectedContest) {
      toast.error('Please select a contest first');
      return;
    }
    if (contentType === 'event' && !selectedEvent) {
      toast.error('Please select an event first');
      return;
    }

    setIsGenerating(true);

    try {
      const body = contentType === 'contest' 
        ? {
            contentType: 'contest',
            contestTitle: selectedContestData?.title,
            contestants: sortedContestants.slice(0, 5).map(c => ({
              name: c.name,
              vote_count: c.vote_count,
            })),
            postType,
            platform: selectedPlatform,
            customContext: customContext || undefined,
          }
        : {
            contentType: 'event',
            eventTitle: selectedEventData?.title,
            eventDate: selectedEventData?.event_date,
            venue: selectedEventData?.venue,
            postType,
            platform: selectedPlatform,
            customContext: customContext || undefined,
          };

      const { data, error } = await supabase.functions.invoke('generate-social-post', {
        body,
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

    const targetUrl = contentType === 'contest' 
      ? (selectedContest ? getContestUrl(selectedContest) : window.location.origin)
      : (selectedEvent ? getEventUrl(selectedEvent) : window.location.origin);

    if (platform !== 'twitter') {
      const encodedMessage = encodeURIComponent(message);
      const encodedUrl = encodeURIComponent(targetUrl);
      
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
          contestId: contentType === 'contest' ? selectedContest : null,
          eventId: contentType === 'event' ? selectedEvent : null,
          targetUrl,
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

  const handleContentTypeChange = (type: string) => {
    setContentType(type as 'contest' | 'event');
    setPostType(type === 'contest' ? 'leaderboard' : 'event_announcement');
    setSelectedContest('');
    setSelectedEvent('');
    setMessage('');
  };

  const isEntitySelected = contentType === 'contest' ? !!selectedContest : !!selectedEvent;
  const characterCount = message.length;
  const isOverLimit = selectedPlatform === 'twitter' && characterCount > 280;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">AI Post Creator</CardTitle>
              <CardDescription className="mt-1">
                Generate engaging posts with AI or write your own
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-accent/10 text-accent border-0 px-3 py-1 gap-1.5">
            <Wand2 className="h-3.5 w-3.5" />
            AI Powered
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Content Type Tabs */}
        <Tabs value={contentType} onValueChange={handleContentTypeChange}>
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50">
            <TabsTrigger value="contest" className="flex items-center gap-2 h-10 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Trophy className="h-4 w-4" />
              Contest
            </TabsTrigger>
            <TabsTrigger value="event" className="flex items-center gap-2 h-10 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Calendar className="h-4 w-4" />
              Event
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{contentType === 'contest' ? 'Select Contest' : 'Select Event'}</Label>
            {contentType === 'contest' ? (
              <Select value={selectedContest} onValueChange={setSelectedContest}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose a contest" />
                </SelectTrigger>
                <SelectContent>
                  {activeContests.length > 0 ? (
                    activeContests.map((contest) => (
                      <SelectItem key={contest.id} value={contest.id}>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-primary" />
                          {contest.title}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No active contests</SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {activeEvents.length > 0 ? (
                    activeEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {event.title}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No active events</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Post Type</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentPostTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex flex-col">
                      <span>{type.name}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Platform</Label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatform === platform.id;
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg text-primary-foreground ${platform.bgClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {platform.name}
                  </span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Context */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Additional Context</Label>
            <Badge variant="outline" className="text-[10px]">Optional</Badge>
          </div>
          <input
            type="text"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            placeholder="e.g., Voting ends at midnight, Use hashtag #VoteNow"
            value={customContext}
            onChange={(e) => setCustomContext(e.target.value)}
          />
        </div>

        {/* AI Generate Button */}
        <Button
          onClick={handleGenerateAI}
          disabled={!isEntitySelected || isGenerating}
          variant="outline"
          className="w-full h-12 gap-2 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating with AI...
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5 text-primary" />
              Generate with AI
            </>
          )}
        </Button>

        {/* Message Textarea */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Your Message</Label>
            <div className={`text-xs font-medium ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
              {characterCount}{selectedPlatform === 'twitter' ? '/280' : ''} characters
            </div>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Generate with AI or write your own post..."
            rows={5}
            className={`resize-none rounded-xl ${isOverLimit ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {isOverLimit && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              Message exceeds Twitter's 280 character limit
            </div>
          )}
        </div>

        {/* Preview */}
        {message && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              Preview
            </div>
            <pre className="whitespace-pre-wrap text-sm font-sans text-foreground">{message}</pre>
          </div>
        )}

        {/* Post Buttons */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Post to</Label>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handlePost('twitter')}
              disabled={!message || isPosting || isOverLimit}
              className="gap-2 h-11 px-6"
            >
              {isPosting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TwitterIcon className="h-4 w-4" />
              )}
              Post to X
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePost('facebook')}
              disabled={!message}
              className="gap-2 h-11 px-6"
            >
              <FacebookIcon className="h-4 w-4" />
              Facebook
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePost('instagram')}
              disabled={!message}
              className="gap-2 h-11 px-6"
            >
              <InstagramIcon className="h-4 w-4" />
              Instagram
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Facebook & Instagram will open in a new window for manual posting.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};