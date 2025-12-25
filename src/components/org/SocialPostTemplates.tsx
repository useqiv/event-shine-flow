import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Copy, Check, Trophy, Star, Users, Clock, Flame, Calendar, Ticket, Bell, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  template: string;
  category: 'engagement' | 'announcement' | 'countdown' | 'results';
  type: 'contest' | 'event';
}

const templates: Template[] = [
  // Contest Templates
  {
    id: 'leaderboard',
    name: 'Leaderboard Update',
    description: 'Share current top contestants',
    icon: Trophy,
    category: 'engagement',
    type: 'contest',
    template: `🏆 {{CONTEST_NAME}} - Live Leaderboard!

🥇 #1: [Contestant Name] - X,XXX votes
🥈 #2: [Contestant Name] - X,XXX votes
🥉 #3: [Contestant Name] - X,XXX votes

🗳️ Vote now: {{CONTEST_URL}}
#voting #contest`,
  },
  {
    id: 'spotlight',
    name: 'Contestant Spotlight',
    description: 'Feature a specific contestant',
    icon: Star,
    category: 'engagement',
    type: 'contest',
    template: `🌟 Contestant Spotlight 🌟

Meet [Contestant Name]! Currently ranked #X in {{CONTEST_NAME}} with X,XXX votes!

Support them now: {{CONTEST_URL}}?vote=[ID]
#vote #support #contest`,
  },
  {
    id: 'voting-open',
    name: 'Voting Now Open',
    description: 'Announce voting has started',
    icon: Users,
    category: 'announcement',
    type: 'contest',
    template: `🎉 VOTING IS NOW OPEN! 🎉

{{CONTEST_NAME}} is live!

🗳️ Cast your vote now and support your favorite contestant!

Vote here: {{CONTEST_URL}}
#voting #live #contest`,
  },
  {
    id: 'countdown-24h',
    name: '24 Hour Countdown',
    description: 'Create urgency before closing',
    icon: Clock,
    category: 'countdown',
    type: 'contest',
    template: `⏰ ONLY 24 HOURS LEFT! ⏰

{{CONTEST_NAME}} voting closes tomorrow!

Don't miss your chance to support your favorite contestant. Every vote counts!

Vote now: {{CONTEST_URL}}
#lastchance #votenow`,
  },
  {
    id: 'final-hours',
    name: 'Final Hours',
    description: 'Last call for votes',
    icon: Flame,
    category: 'countdown',
    type: 'contest',
    template: `🔥 FINAL HOURS! 🔥

{{CONTEST_NAME}} closes in just a few hours!

Current standings are TIGHT! Your vote could decide the winner!

Cast your final votes: {{CONTEST_URL}}
#finalcall #voting`,
  },
  {
    id: 'winner-announcement',
    name: 'Winner Announcement',
    description: 'Announce contest results',
    icon: Trophy,
    category: 'results',
    type: 'contest',
    template: `🎊 WE HAVE A WINNER! 🎊

Congratulations to [Winner Name] for winning {{CONTEST_NAME}}!

🥇 1st: [Name] - X,XXX votes
🥈 2nd: [Name] - X,XXX votes  
🥉 3rd: [Name] - X,XXX votes

Thank you to all participants and voters!
#winner #congratulations`,
  },
  // Event Templates
  {
    id: 'event-announcement',
    name: 'Event Announcement',
    description: 'Announce a new event',
    icon: Calendar,
    category: 'announcement',
    type: 'event',
    template: `🎉 SAVE THE DATE! 🎉

{{EVENT_NAME}} is happening!

📅 Date: [Event Date]
📍 Venue: [Venue Name]
🎫 Tickets available now!

Get yours: {{EVENT_URL}}
#event #liveshow #entertainment`,
  },
  {
    id: 'event-countdown',
    name: 'Event Countdown',
    description: 'Build excitement before the event',
    icon: Clock,
    category: 'countdown',
    type: 'event',
    template: `⏰ COUNTDOWN TO {{EVENT_NAME}}! ⏰

Only [X] days left until the big day!

📅 [Event Date]
📍 [Venue Name]

Tickets selling fast! 🎫 {{EVENT_URL}}
#countdown #dontmissout`,
  },
  {
    id: 'tickets-selling-fast',
    name: 'Tickets Selling Fast',
    description: 'Create urgency for ticket sales',
    icon: Ticket,
    category: 'engagement',
    type: 'event',
    template: `🔥 TICKETS SELLING FAST! 🔥

{{EVENT_NAME}} is almost sold out!

Don't miss your chance to be there!

📅 [Event Date]
📍 [Venue Name]

Get tickets now: {{EVENT_URL}}
#limitedtickets #hurry`,
  },
  {
    id: 'event-reminder',
    name: 'Event Reminder',
    description: 'Remind attendees about the event',
    icon: Bell,
    category: 'countdown',
    type: 'event',
    template: `📢 REMINDER: {{EVENT_NAME}} IS TOMORROW! 📢

Get ready for an amazing experience!

📅 [Event Date & Time]
📍 [Venue Name]
📍 [Address]

See you there! 🎉
#eventreminder #seeyoutomorrow`,
  },
  {
    id: 'event-live',
    name: 'Event is Live',
    description: 'Announce event has started',
    icon: Flame,
    category: 'announcement',
    type: 'event',
    template: `🎤 WE'RE LIVE! 🎤

{{EVENT_NAME}} is happening NOW!

Join us at [Venue Name] for an unforgettable experience!

#liveshow #happeningnow #event`,
  },
  {
    id: 'event-thankyou',
    name: 'Post-Event Thank You',
    description: 'Thank attendees after the event',
    icon: Heart,
    category: 'results',
    type: 'event',
    template: `💜 THANK YOU! 💜

What an incredible night at {{EVENT_NAME}}!

Thank you to everyone who came out and made it unforgettable!

Stay tuned for our next event! 🎉
#thankyou #amazingnight #untilnexttime`,
  },
];

const categoryColors: Record<string, string> = {
  engagement: 'bg-blue-500/10 text-blue-500',
  announcement: 'bg-green-500/10 text-green-500',
  countdown: 'bg-orange-500/10 text-orange-500',
  results: 'bg-purple-500/10 text-purple-500',
};

const TemplateCard: React.FC<{ template: Template; copiedId: string | null; onCopy: (template: string, id: string) => void }> = ({ template, copiedId, onCopy }) => {
  const Icon = template.icon;
  return (
    <div className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium">{template.name}</h4>
            <p className="text-xs text-muted-foreground">{template.description}</p>
          </div>
        </div>
        <Badge className={categoryColors[template.category]}>
          {template.category}
        </Badge>
      </div>
      <div className="p-3 rounded bg-muted/50 mb-3">
        <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground">
          {template.template}
        </pre>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onCopy(template.template, template.id)}
      >
        {copiedId === template.id ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            Copy Template
          </>
        )}
      </Button>
    </div>
  );
};

export const SocialPostTemplates: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (template: string, id: string) => {
    navigator.clipboard.writeText(template);
    setCopiedId(id);
    toast.success('Template copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const contestTemplates = templates.filter(t => t.type === 'contest');
  const eventTemplates = templates.filter(t => t.type === 'event');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Social Post Templates
        </CardTitle>
        <CardDescription>
          Ready-to-use templates for your social media posts. Copy and customize!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="contest" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="contest" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Contest Templates
            </TabsTrigger>
            <TabsTrigger value="event" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Event Templates
            </TabsTrigger>
          </TabsList>
          <TabsContent value="contest">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contestTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="event">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};