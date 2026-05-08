import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getContestantUrlById } from '@/lib/urlHelpers';

interface ShareCardGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contestant: {
    id: string;
    name: string;
    photo_url: string | null;
    vote_count: number;
  };
  contest: {
    id: string;
    title: string;
    brand_primary_color?: string;
    brand_logo_url?: string;
    custom_slug?: string | null;
  };
}

export const ShareCardGenerator: React.FC<ShareCardGeneratorProps> = ({
  open,
  onOpenChange,
  contestant,
  contest,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const primaryColor = contest.brand_primary_color || '#7c3aed';
  const votingUrl = getContestantUrlById(contest.id, contestant.id, contest.custom_slug);

  const generateCard = async () => {
    setIsGenerating(true);
    let photoCleanup: (() => void) | null = null;
    let logoCleanup: (() => void) | null = null;

    try {
      // Use the hidden canvas if available, otherwise create an offscreen canvas.
      // This avoids timing issues where the dialog renders before the ref is set.
      const canvas =
        canvasRef.current ??
        (typeof document !== 'undefined' ? document.createElement('canvas') : null);
      if (!canvas) {
        toast.error('Unable to generate card (canvas unavailable). Please try again.');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Unable to generate card (canvas unavailable). Please try again.');
        return;
      }

      // Set canvas size (1200x630 for social media optimal)
      canvas.width = 1200;
      canvas.height = 630;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, primaryColor);
      gradient.addColorStop(1, adjustColor(primaryColor, -30));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add decorative elements
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(canvas.width - 100, 100, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(100, canvas.height - 50, 150, 0, Math.PI * 2);
      ctx.fill();

      // White card area
      const cardX = 60;
      const cardY = 60;
      const cardWidth = canvas.width - 120;
      const cardHeight = canvas.height - 120;
      ctx.fillStyle = 'white';
      roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 24);
      ctx.fill();

      // Add shadow effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;

      // Load contestant photo
      if (contestant.photo_url) {
        try {
          const result = await loadImageViaFetch(contestant.photo_url);
          const img = result.img;
          photoCleanup = result.cleanup;

          const photoSize = 280;
          const photoX = cardX + 60;
          const photoY = cardY + (cardHeight - photoSize) / 2;

          // Circular clip
          ctx.save();
          ctx.beginPath();
          ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, photoX, photoY, photoSize, photoSize);
          ctx.restore();

          // Photo border
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 2, 0, Math.PI * 2);
          ctx.stroke();
        } catch (e) {
          console.error('Failed to load contestant photo:', e);
        }
      }

      // Text content
      const textX = 420;
      ctx.textBaseline = 'middle';

      // Contest title
      ctx.fillStyle = '#666';
      ctx.font = '500 24px system-ui, sans-serif';
      ctx.fillText(contest.title, textX, cardY + 100);

      // Contestant name
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 56px system-ui, sans-serif';
      ctx.fillText(contestant.name, textX, cardY + 180);

      // Vote count
      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 72px system-ui, sans-serif';
      const voteCountText = contestant.vote_count.toLocaleString();
      ctx.fillText(voteCountText, textX, cardY + 280);

      ctx.fillStyle = '#666';
      ctx.font = '500 32px system-ui, sans-serif';
      ctx.fillText('votes', textX + ctx.measureText(voteCountText).width + 20, cardY + 280);

      // Call to action
      ctx.fillStyle = primaryColor;
      roundRect(ctx, textX, cardY + 340, 300, 60, 12);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VOTE NOW!', textX + 150, cardY + 370);
      ctx.textAlign = 'left';

      // URL
      ctx.fillStyle = '#999';
      ctx.font = '400 18px system-ui, sans-serif';
      ctx.fillText(votingUrl.replace('https://', '').replace('http://', ''), textX, cardY + 440);

      // Brand logo if available
      if (contest.brand_logo_url) {
        try {
          const result = await loadImageViaFetch(contest.brand_logo_url);
          const logo = result.img;
          logoCleanup = result.cleanup;

          const logoHeight = 50;
          const logoWidth = (logo.width / logo.height) * logoHeight;
          ctx.drawImage(
            logo,
            canvas.width - cardX - logoWidth - 40,
            cardY + cardHeight - logoHeight - 40,
            logoWidth,
            logoHeight
          );
        } catch (e) {
          console.error('Failed to load brand logo:', e);
        }
      }

      // Generate preview
      let dataUrl: string;
      try {
        dataUrl = canvas.toDataURL('image/png');
      } catch (e) {
        // Commonly occurs when a cross-origin image taints the canvas.
        console.error('Failed to export canvas:', e);
        toast.error('Could not export this card (image permissions). Try removing external images/logos.');
        return;
      }

      setPreviewUrl(dataUrl);
    } catch (e) {
      console.error('Failed to generate share card:', e);
      toast.error('Failed to generate share card. Please try again.');
    } finally {
      try {
        photoCleanup?.();
      } catch {
        // ignore
      }
      try {
        logoCleanup?.();
      } catch {
        // ignore
      }
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.download = `vote-${contestant.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = previewUrl;
    link.click();
    toast.success('Share card downloaded!');
  };

  const handleShare = async () => {
    if (!previewUrl) return;
    
    try {
      const blob = await (await fetch(previewUrl)).blob();
      const file = new File([blob], `vote-${contestant.name}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Vote for ${contestant.name}`,
          text: `Support ${contestant.name} in ${contest.title}!`,
          files: [file],
        });
      } else {
        handleDownload();
      }
    } catch (error) {
      console.error('Share failed:', error);
      handleDownload();
    }
  };

  // Generate card when dialog opens
  React.useEffect(() => {
    if (open) {
      setPreviewUrl(null);
      generateCard();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Card for {contestant.name}</DialogTitle>
          <DialogDescription>
            Download or share this card on social media to promote voting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden canvas for generation */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Preview */}
          <div className="relative aspect-[1200/630] bg-muted rounded-lg overflow-hidden">
            {isGenerating ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : previewUrl ? (
              <img src={previewUrl} alt="Share card preview" className="w-full h-full object-contain" />
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleDownload} disabled={!previewUrl} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button onClick={handleShare} disabled={!previewUrl} variant="outline" className="flex-1">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper functions
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadImageViaFetch(src: string): Promise<{ img: HTMLImageElement; cleanup: () => void }> {
  // Fetching the image and drawing from a blob URL avoids "tainted canvas" issues
  // when the remote server doesn't provide permissive CORS headers.
  const res = await fetch(src, { mode: 'cors' });
  if (!res.ok) {
    throw new Error(`Image fetch failed: ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    return { img, cleanup: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
