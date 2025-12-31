import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIDescriptionGeneratorProps {
  type: 'event' | 'contest' | 'campaign';
  title: string;
  category: string;
  venue?: string;
  eventDate?: string;
  onGenerated: (description: string) => void;
  disabled?: boolean;
}

const styles = [
  { value: 'engaging', label: 'Engaging & Exciting', description: 'Builds enthusiasm and urgency' },
  { value: 'professional', label: 'Professional', description: 'Formal and informative' },
  { value: 'casual', label: 'Casual & Friendly', description: 'Approachable and relatable' },
  { value: 'luxury', label: 'Luxury & Exclusive', description: 'Sophisticated and premium' },
];

export const AIDescriptionGenerator: React.FC<AIDescriptionGeneratorProps> = ({
  type,
  title,
  category,
  venue,
  eventDate,
  onGenerated,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [style, setStyle] = useState('engaging');
  const [additionalContext, setAdditionalContext] = useState('');

  const handleGenerate = async () => {
    if (!title) {
      toast.error('Please enter a title first');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-description', {
        body: {
          type,
          title,
          category: category || 'General',
          venue,
          eventDate,
          additionalContext: additionalContext.trim() || undefined,
          style,
        },
      });

      if (error) throw error;

      if (data?.description) {
        onGenerated(data.description);
        toast.success('Description generated!');
        setIsOpen(false);
        setAdditionalContext('');
      } else {
        throw new Error('No description received');
      }
    } catch (error: any) {
      console.error('Failed to generate description:', error);
      
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.message?.includes('402') || error.message?.includes('credits')) {
        toast.error('AI credits depleted. Please add credits to continue.');
      } else {
        toast.error('Failed to generate description. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const typeLabel = type === 'event' ? 'event' : type === 'contest' ? 'contest' : 'campaign';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !title}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          AI Generate
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <div>
              <h4 className="font-medium">AI Description Generator</h4>
              <p className="text-xs text-muted-foreground">
                Generate a compelling {typeLabel} description
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Writing Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {styles.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div>
                      <span className="font-medium">{s.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {s.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional Context (optional)</Label>
            <Textarea
              placeholder={`E.g., Key highlights, special guests, unique features...`}
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={3}
              className="text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating || !title}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
