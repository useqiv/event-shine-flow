import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganizationContests, useOrganizationEvents } from '@/hooks/useOrganization';
import { useContestants } from '@/hooks/useContests';
import { Download, Image, Trophy, Star, Users, Calendar, MapPin, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type ContestCardType = 'leaderboard' | 'contestant' | 'announcement';
type EventCardType = 'event_promo' | 'event_countdown' | 'event_announcement';

const contestCardTemplates = [
  { id: 'leaderboard', name: 'Leaderboard', icon: Trophy, description: 'Top contestants ranking' },
  { id: 'contestant', name: 'Contestant Spotlight', icon: Star, description: 'Feature a contestant' },
  { id: 'announcement', name: 'Announcement', icon: Users, description: 'Custom announcement' },
];

const eventCardTemplates = [
  { id: 'event_promo', name: 'Event Promo', icon: Calendar, description: 'Promote your event' },
  { id: 'event_countdown', name: 'Event Countdown', icon: Ticket, description: 'Countdown to event' },
  { id: 'event_announcement', name: 'Announcement', icon: MapPin, description: 'Custom announcement' },
];

export const ShareCardGeneratorMarketing: React.FC = () => {
  const { data: contests } = useOrganizationContests();
  const { data: events } = useOrganizationEvents();
  
  const [contentType, setContentType] = useState<'contest' | 'event'>('contest');
  const [selectedContest, setSelectedContest] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [contestCardType, setContestCardType] = useState<ContestCardType>('leaderboard');
  const [eventCardType, setEventCardType] = useState<EventCardType>('event_promo');
  const [selectedContestant, setSelectedContestant] = useState<string>('');
  const [customText, setCustomText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeContests = contests?.filter(c => c.is_active) || [];
  const activeEvents = events?.filter(e => e.is_active) || [];
  const selectedContestData = contests?.find(c => c.id === selectedContest);
  const selectedEventData = events?.find(e => e.id === selectedEvent);

  const { data: contestants } = useContestants(selectedContest);
  const sortedContestants = contestants ? [...contestants].sort((a, b) => b.vote_count - a.vote_count) : [];
  
  const currentTemplates = contentType === 'contest' ? contestCardTemplates : eventCardTemplates;

  const generateCard = async () => {
    if (!canvasRef.current) {
      return;
    }
    
    if (contentType === 'contest' && !selectedContestData) {
      toast.error('Please select a contest first');
      return;
    }
    
    if (contentType === 'event' && !selectedEventData) {
      toast.error('Please select an event first');
      return;
    }

    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for social media (1080x1080 for Instagram)
    canvas.width = 1080;
    canvas.height = 1080;

    // Get branding colors
    const primaryColor = contentType === 'contest' 
      ? (selectedContestData?.brand_primary_color || '#7c3aed')
      : '#7c3aed';
    const secondaryColor = contentType === 'contest'
      ? (selectedContestData?.brand_secondary_color || '#f97316')
      : '#f97316';

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < canvas.width; i += 40) {
      for (let j = 0; j < canvas.height; j += 40) {
        ctx.beginPath();
        ctx.arc(i, j, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // White content area
    const padding = 60;
    const contentWidth = canvas.width - padding * 2;
    const contentHeight = canvas.height - padding * 2 - 100;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(padding, padding, contentWidth, contentHeight, 24);
    ctx.fill();

    if (contentType === 'contest' && selectedContestData) {
      // Contest title
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 48px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(selectedContestData.title, canvas.width / 2, padding + 80, contentWidth - 40);

      if (contestCardType === 'leaderboard' && sortedContestants.length > 0) {
        // Leaderboard content
        ctx.font = 'bold 36px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText('🏆 Live Leaderboard', canvas.width / 2, padding + 150);

        const top3 = sortedContestants.slice(0, 3);
        const medals = ['🥇', '🥈', '🥉'];
        
        top3.forEach((contestant, index) => {
          const y = padding + 240 + index * 160;
          
          // Name
          ctx.font = 'bold 42px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#1a1a1a';
          ctx.textAlign = 'left';
          ctx.fillText(`${medals[index]} ${contestant.name}`, padding + 40, y);
          
          // Vote count
          ctx.font = '36px Inter, system-ui, sans-serif';
          ctx.fillStyle = primaryColor;
          ctx.textAlign = 'right';
          ctx.fillText(`${contestant.vote_count.toLocaleString()} votes`, canvas.width - padding - 40, y);
          
          // Divider line
          if (index < 2) {
            ctx.strokeStyle = '#e5e5e5';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(padding + 40, y + 60);
            ctx.lineTo(canvas.width - padding - 40, y + 60);
            ctx.stroke();
          }
        });

      } else if (contestCardType === 'contestant' && selectedContestant) {
        const contestant = contestants?.find(c => c.id === selectedContestant);
        if (contestant) {
          const rank = sortedContestants.findIndex(c => c.id === selectedContestant) + 1;
          
          ctx.font = 'bold 36px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#666';
          ctx.textAlign = 'center';
          ctx.fillText('⭐ Contestant Spotlight', canvas.width / 2, padding + 150);

          ctx.font = 'bold 64px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#1a1a1a';
          ctx.fillText(contestant.name, canvas.width / 2, padding + 350);

          ctx.font = '48px Inter, system-ui, sans-serif';
          ctx.fillStyle = primaryColor;
          ctx.fillText(`Rank #${rank}`, canvas.width / 2, padding + 450);

          ctx.font = 'bold 56px Inter, system-ui, sans-serif';
          ctx.fillStyle = secondaryColor;
          ctx.fillText(`${contestant.vote_count.toLocaleString()} votes`, canvas.width / 2, padding + 550);
        }

      } else if (contestCardType === 'announcement') {
        ctx.font = 'bold 36px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('📢 Announcement', canvas.width / 2, padding + 150);

        // Word wrap custom text
        const maxWidth = contentWidth - 80;
        const lineHeight = 60;
        const words = (customText || 'Vote Now!').split(' ');
        let line = '';
        let y = padding + 350;

        ctx.font = 'bold 48px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#1a1a1a';

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line.trim(), canvas.width / 2, y);
            line = words[n] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), canvas.width / 2, y);
      }

      // Footer with vote URL
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 32px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      
      const contestUrl = selectedContestData.custom_slug 
        ? `Vote at: /${selectedContestData.custom_slug}`
        : 'Vote Now!';
      ctx.fillText(contestUrl, canvas.width / 2, canvas.height - 50);
    } else if (contentType === 'event' && selectedEventData) {
      // Event title
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 48px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(selectedEventData.title, canvas.width / 2, padding + 80, contentWidth - 40);

      if (eventCardType === 'event_promo') {
        ctx.font = 'bold 36px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText('🎉 Upcoming Event', canvas.width / 2, padding + 150);

        ctx.font = '42px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(`📅 ${format(new Date(selectedEventData.event_date), 'MMMM d, yyyy')}`, canvas.width / 2, padding + 300);
        
        ctx.fillText(`📍 ${selectedEventData.venue}`, canvas.width / 2, padding + 400);

        ctx.font = 'bold 56px Inter, system-ui, sans-serif';
        ctx.fillStyle = primaryColor;
        ctx.fillText('Get Your Tickets!', canvas.width / 2, padding + 550);

      } else if (eventCardType === 'event_countdown') {
        const eventDate = new Date(selectedEventData.event_date);
        const now = new Date();
        const diffTime = eventDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        ctx.font = 'bold 36px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText('⏰ Countdown', canvas.width / 2, padding + 150);

        ctx.font = 'bold 120px Inter, system-ui, sans-serif';
        ctx.fillStyle = primaryColor;
        ctx.fillText(diffDays > 0 ? `${diffDays}` : 'TODAY!', canvas.width / 2, padding + 380);

        if (diffDays > 0) {
          ctx.font = 'bold 48px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#1a1a1a';
          ctx.fillText(diffDays === 1 ? 'day left' : 'days left', canvas.width / 2, padding + 460);
        }

        ctx.font = '36px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(`📅 ${format(eventDate, 'MMMM d, yyyy')}`, canvas.width / 2, padding + 560);

      } else if (eventCardType === 'event_announcement') {
        ctx.font = 'bold 36px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText('📢 Announcement', canvas.width / 2, padding + 150);

        // Word wrap custom text
        const maxWidth = contentWidth - 80;
        const lineHeight = 60;
        const words = (customText || 'Get your tickets now!').split(' ');
        let line = '';
        let y = padding + 350;

        ctx.font = 'bold 48px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#1a1a1a';

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line.trim(), canvas.width / 2, y);
            line = words[n] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), canvas.width / 2, y);
      }

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 32px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Get Your Tickets Now!', canvas.width / 2, canvas.height - 50);
    }

    setIsGenerating(false);
    toast.success('Card generated! Click download to save.');
  };

  const downloadCard = () => {
    if (!canvasRef.current) return;
    
    const title = contentType === 'contest' 
      ? selectedContestData?.title 
      : selectedEventData?.title;
    const cardType = contentType === 'contest' ? contestCardType : eventCardType;
    
    const link = document.createElement('a');
    link.download = `${title || 'share-card'}-${cardType}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast.success('Card downloaded!');
  };

  const handleContentTypeChange = (type: string) => {
    setContentType(type as 'contest' | 'event');
    setSelectedContest('');
    setSelectedEvent('');
    setCustomText('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Share Card Generator
        </CardTitle>
        <CardDescription>
          Create branded image cards for social media for contests and events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={contentType} onValueChange={handleContentTypeChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contest" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Contest
            </TabsTrigger>
            <TabsTrigger value="event" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Event
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{contentType === 'contest' ? 'Select Contest' : 'Select Event'}</Label>
              {contentType === 'contest' ? (
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
              ) : (
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Card Type</Label>
              <div className="grid grid-cols-1 gap-2">
                {currentTemplates.map((template) => {
                  const Icon = template.icon;
                  const isSelected = contentType === 'contest' 
                    ? contestCardType === template.id 
                    : eventCardType === template.id;
                  return (
                    <Button
                      key={template.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="justify-start h-auto py-3"
                      onClick={() => {
                        if (contentType === 'contest') {
                          setContestCardType(template.id as ContestCardType);
                        } else {
                          setEventCardType(template.id as EventCardType);
                        }
                      }}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs opacity-70">{template.description}</p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            {contentType === 'contest' && contestCardType === 'contestant' && (
              <div className="space-y-2">
                <Label>Select Contestant</Label>
                <Select value={selectedContestant} onValueChange={setSelectedContestant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a contestant" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedContestants.map((contestant) => (
                      <SelectItem key={contestant.id} value={contestant.id}>
                        {contestant.name} ({contestant.vote_count.toLocaleString()} votes)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {((contentType === 'contest' && contestCardType === 'announcement') || 
              (contentType === 'event' && eventCardType === 'event_announcement')) && (
              <div className="space-y-2">
                <Label>Announcement Text</Label>
                <Input
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={contentType === 'contest' ? 'e.g., Voting ends tonight!' : 'e.g., Limited tickets available!'}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={generateCard} 
                disabled={(contentType === 'contest' ? !selectedContest : !selectedEvent) || isGenerating} 
                className="flex-1"
              >
                {isGenerating ? 'Generating...' : 'Generate Card'}
              </Button>
              <Button 
                variant="outline" 
                onClick={downloadCard} 
                disabled={contentType === 'contest' ? !selectedContest : !selectedEvent}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              1080x1080px - Perfect for Instagram
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
