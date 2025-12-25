import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Copy, Check, Trophy, Star, Users, Clock, Flame } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  template: string;
  category: 'engagement' | 'announcement' | 'countdown' | 'results';
}

const templates: Template[] = [
  {
    id: 'leaderboard',
    name: 'Leaderboard Update',
    description: 'Share current top contestants',
    icon: Trophy,
    category: 'engagement',
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
    template: `🎊 WE HAVE A WINNER! 🎊

Congratulations to [Winner Name] for winning {{CONTEST_NAME}}!

🥇 1st: [Name] - X,XXX votes
🥈 2nd: [Name] - X,XXX votes  
🥉 3rd: [Name] - X,XXX votes

Thank you to all participants and voters!
#winner #congratulations`,
  },
];

const categoryColors: Record<string, string> = {
  engagement: 'bg-blue-500/10 text-blue-500',
  announcement: 'bg-green-500/10 text-green-500',
  countdown: 'bg-orange-500/10 text-orange-500',
  results: 'bg-purple-500/10 text-purple-500',
};

export const SocialPostTemplates: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (template: string, id: string) => {
    navigator.clipboard.writeText(template);
    setCopiedId(id);
    toast.success('Template copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
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
                  onClick={() => handleCopy(template.template, template.id)}
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
          })}
        </div>
      </CardContent>
    </Card>
  );
};
