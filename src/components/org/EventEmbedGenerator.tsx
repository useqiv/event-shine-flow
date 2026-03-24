import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface EventEmbedGeneratorProps {
  eventId: string;
  eventTitle: string;
}

export const EventEmbedGenerator: React.FC<EventEmbedGeneratorProps> = ({
  eventId,
  eventTitle,
}) => {
  const [width, setWidth] = useState('100%');
  const [height, setHeight] = useState('600');
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/embed/event/${eventId}`;

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}px"
  frameborder="0"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"
  title="${eventTitle} - Event"
></iframe>`;

  const scriptCode = `<div id="useqiv-event" data-event-id="${eventId}"></div>
<script src="${baseUrl}/event-embed.js"></script>`;

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
          Embed Event Widget
        </CardTitle>
        <CardDescription>
          Embed this event on your website so visitors can view details and get tickets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Width</Label>
            <Input value={width} onChange={(e) => setWidth(e.target.value)} placeholder="100% or 400px" />
          </div>
          <div className="space-y-2">
            <Label>Height (px)</Label>
            <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="600" />
          </div>
        </div>

        <Tabs defaultValue="iframe">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="iframe">iFrame Embed</TabsTrigger>
            <TabsTrigger value="script">Script Embed</TabsTrigger>
          </TabsList>

          <TabsContent value="iframe" className="space-y-4">
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono text-foreground">
                {iframeCode}
              </pre>
              <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={() => handleCopy(iframeCode)}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Copy and paste this code into your website's HTML where you want the event widget to appear.
            </p>
          </TabsContent>

          <TabsContent value="script" className="space-y-4">
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono text-foreground">
                {scriptCode}
              </pre>
              <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={() => handleCopy(scriptCode)}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add the div where you want the widget, then include the script before the closing body tag.
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
      </CardContent>
    </Card>
  );
};
