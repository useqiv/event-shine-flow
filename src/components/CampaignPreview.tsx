import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Users, Calendar, Share2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface CampaignPreviewProps {
  title: string;
  short_description: string;
  description: string;
  goal_amount: string;
  currency: string;
  category: string;
  image_url: string;
  end_date?: Date;
}

const CATEGORY_LABELS: Record<string, string> = {
  medical: 'Medical & Health',
  education: 'Education',
  community: 'Community',
  emergency: 'Emergency',
  creative: 'Creative Projects',
  charity: 'Charity',
  sports: 'Sports',
  other: 'Other',
};

export const CampaignPreview: React.FC<CampaignPreviewProps> = ({
  title,
  short_description,
  description,
  goal_amount,
  currency,
  category,
  image_url,
  end_date,
}) => {
  const { user } = useAuth();
  const goalNum = parseFloat(goal_amount) || 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        This is how your campaign will appear to donors
      </p>

      <div className="border rounded-lg overflow-hidden bg-background">
        {/* Hero Image */}
        <div className="aspect-video bg-muted relative">
          {image_url ? (
            <img 
              src={image_url} 
              alt={title || 'Campaign image'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Heart className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{CATEGORY_LABELS[category] || category}</Badge>
              {end_date && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Ends {format(end_date, 'MMM d, yyyy')}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">{title || 'Your Campaign Title'}</h1>
            {short_description && (
              <p className="text-muted-foreground mt-2">{short_description}</p>
            )}
          </div>

          {/* Progress Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-lg">{currency} 0</span>
                <span className="text-muted-foreground">of {currency} {goalNum.toLocaleString()} goal</span>
              </div>
              <Progress value={0} className="h-3 mb-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>0 donors</span>
                </div>
                {end_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{Math.ceil((end_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons Preview */}
          <div className="flex gap-3">
            <Button className="flex-1" disabled>
              <Heart className="h-4 w-4 mr-2" />
              Donate Now
            </Button>
            <Button variant="outline" disabled>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Avatar>
              <AvatarImage src={undefined} />
              <AvatarFallback>{user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Organized by</p>
              <p className="font-medium">{user?.email || 'You'}</p>
            </div>
          </div>

          {/* Description */}
          {description && (
            <div>
              <h3 className="font-semibold mb-3">About this campaign</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                {description}
              </div>
            </div>
          )}

          {!description && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>Your campaign description will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
