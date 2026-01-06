import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganizationContests } from '@/hooks/useOrganization';
import { Code, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export const EmbedCodeGenerator: React.FC = () => {
  const { data: contests } = useOrganizationContests();
  
  const [selectedContest, setSelectedContest] = useState<string>('');
  const [width, setWidth] = useState('100%');
  const [height, setHeight] = useState('600');
  const [copied, setCopied] = useState(false);

  const activeContests = contests?.filter(c => c.is_active) || [];
  
  const baseUrl = window.location.origin;
  const embedUrl = selectedContest ? `${baseUrl}/embed/leaderboard/${selectedContest}` : '';
  
  const iframeCode = `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}px"
  frameborder="0"
  style="border: none; border-radius: 8px;"
  title="Contest Leaderboard"
></iframe>`;

  const scriptCode = `<div id="useqiv-leaderboard" data-contest-id="${selectedContest}"></div>
<script src="${baseUrl}/embed.js"></script>`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Embeddable Leaderboard Widget
        </CardTitle>
        <CardDescription>
          Add a live leaderboard to your website using an iframe or script tag
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Label>Width</Label>
            <Input
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="100% or 500px"
            />
          </div>
          <div className="space-y-2">
            <Label>Height (px)</Label>
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="600"
            />
          </div>
        </div>

        {selectedContest && (
          <>
            <Tabs defaultValue="iframe">
              <TabsList>
                <TabsTrigger value="iframe">iFrame Embed</TabsTrigger>
                <TabsTrigger value="script">Script Embed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="iframe" className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono">
                    {iframeCode}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(iframeCode)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Copy and paste this code into your website's HTML where you want the leaderboard to appear.
                </p>
              </TabsContent>
              
              <TabsContent value="script" className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono">
                    {scriptCode}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(scriptCode)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add the div where you want the leaderboard, then include the script before the closing body tag.
                </p>
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <a href={embedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview Widget
                </a>
              </Button>
            </div>
          </>
        )}

        {!selectedContest && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select a contest to generate embed code</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
