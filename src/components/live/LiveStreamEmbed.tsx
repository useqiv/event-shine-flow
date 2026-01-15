import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Video, Youtube, Twitch, ExternalLink, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type StreamPlatform = 'youtube' | 'twitch' | 'custom';

interface LiveStreamEmbedProps {
  streamUrl?: string;
  platform?: StreamPlatform;
  isEditable?: boolean;
  onStreamChange?: (url: string, platform: StreamPlatform) => void;
  className?: string;
}

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&?/]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const extractTwitchChannel = (url: string): string | null => {
  const match = url.match(/twitch\.tv\/([^/?]+)/);
  return match ? match[1] : null;
};

const detectPlatform = (url: string): StreamPlatform => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('twitch.tv')) return 'twitch';
  return 'custom';
};

export const LiveStreamEmbed: React.FC<LiveStreamEmbedProps> = ({
  streamUrl,
  platform = 'youtube',
  isEditable = false,
  onStreamChange,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState(streamUrl || '');
  const [selectedPlatform, setSelectedPlatform] = useState<StreamPlatform>(platform);

  // Sync internal state when props change (e.g., after saving to DB and refetching)
  useEffect(() => {
    setInputUrl(streamUrl || '');
    setSelectedPlatform(platform);
  }, [streamUrl, platform]);

  // Reset input state when entering edit mode to show current saved values
  const handleStartEditing = () => {
    setInputUrl(streamUrl || '');
    setSelectedPlatform(platform);
    setIsEditing(true);
  };

  const handleSave = () => {
    onStreamChange?.(inputUrl, selectedPlatform);
    setIsEditing(false);
  };

  const handleUrlChange = (url: string) => {
    setInputUrl(url);
    setSelectedPlatform(detectPlatform(url));
  };

  const renderEmbed = () => {
    if (!streamUrl) return null;

    if (platform === 'youtube') {
      const videoId = extractYouTubeId(streamUrl);
      if (!videoId) return null;
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
          title="YouTube Live Stream"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      );
    }

    if (platform === 'twitch') {
      const channel = extractTwitchChannel(streamUrl);
      if (!channel) return null;
      return (
        <iframe
          src={`https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`}
          title="Twitch Live Stream"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      );
    }

    // Custom embed (iframe)
    return (
      <iframe
        src={streamUrl}
        title="Live Stream"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    );
  };

  if (isEditing) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              Configure Live Stream
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Stream URL</Label>
            <Input
              placeholder="https://youtube.com/watch?v=... or https://twitch.tv/..."
              value={inputUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Paste a YouTube Live or Twitch stream URL
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant={selectedPlatform === 'youtube' ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer",
                selectedPlatform === 'youtube' && "bg-red-500"
              )}
              onClick={() => setSelectedPlatform('youtube')}
            >
              <Youtube className="h-3 w-3 mr-1" />
              YouTube
            </Badge>
            <Badge 
              variant={selectedPlatform === 'twitch' ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer",
                selectedPlatform === 'twitch' && "bg-purple-500"
              )}
              onClick={() => setSelectedPlatform('twitch')}
            >
              <Twitch className="h-3 w-3 mr-1" />
              Twitch
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!streamUrl) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Video className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Live Stream</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isEditable 
              ? "Add a YouTube or Twitch stream to engage your audience"
              : "Live stream coming soon"
            }
          </p>
          {isEditable && (
            <Button onClick={handleStartEditing}>
              <Video className="mr-2 h-4 w-4" />
              Add Live Stream
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {platform === 'youtube' && <Youtube className="h-5 w-5 text-red-500" />}
            {platform === 'twitch' && <Twitch className="h-5 w-5 text-purple-500" />}
            {platform === 'custom' && <Video className="h-5 w-5" />}
            Live Stream
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-red-500 animate-pulse">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-white inline-block" />
              LIVE
            </Badge>
            {isEditable && (
              <Button variant="ghost" size="icon" onClick={handleStartEditing}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          {renderEmbed()}
        </div>
        <div className="p-3 flex items-center justify-between border-t">
          <span className="text-xs text-muted-foreground">
            Streaming on {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </span>
          <Button variant="ghost" size="sm" asChild>
            <a href={streamUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveStreamEmbed;
