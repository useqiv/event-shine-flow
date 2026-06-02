import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, User, Vote, Eye } from 'lucide-react';
import { ContestantVoteDisplay } from '@/components/contest/ContestantVoteDisplay';
import { normalizeVoteDisplayMode, type VoteDisplayMode } from '@/lib/voteDisplay';

interface BrandingPreviewProps {
  contestTitle: string;
  brandLogoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  voteDisplayMode?: VoteDisplayMode;
  contestants?: Array<{
    name: string;
    photo_url?: string;
    vote_count: number;
  }>;
}

export const BrandingPreview: React.FC<BrandingPreviewProps> = ({
  contestTitle,
  brandLogoUrl,
  primaryColor,
  secondaryColor,
  voteDisplayMode: voteDisplayModeProp,
  contestants = [],
}) => {
  const previewContestants = contestants.slice(0, 3);
  const voteDisplayMode = normalizeVoteDisplayMode(voteDisplayModeProp);
  const maxVotes = previewContestants[0]?.vote_count || 1;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Live Branding Preview
        </CardTitle>
        <CardDescription>See how your branding will look to voters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contest Header Preview */}
        <div className="rounded-lg overflow-hidden border">
          {/* Header Bar */}
          <div 
            className="h-12 flex items-center justify-between px-4"
            style={{ backgroundColor: primaryColor }}
          >
            {brandLogoUrl ? (
              <img 
                src={brandLogoUrl} 
                alt="Logo" 
                className="h-8 object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5" />
                <span className="font-semibold text-sm">{contestTitle}</span>
              </div>
            )}
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white border-0 text-xs"
            >
              Live
            </Badge>
          </div>
          
          {/* Contest Info Preview */}
          <div className="p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Badge style={{ backgroundColor: primaryColor, color: 'white' }}>
                Category
              </Badge>
              <span className="text-sm font-medium">{contestTitle || 'Contest Title'}</span>
            </div>
            
            {/* Mini Leaderboard Preview */}
            <div className="space-y-2">
              {previewContestants.length > 0 ? (
                previewContestants.map((contestant, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-2 rounded-md bg-background"
                    style={index === 0 ? { borderLeft: `3px solid ${primaryColor}` } : undefined}
                  >
                    <span 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ 
                        backgroundColor: index === 0 ? primaryColor : 
                                        index === 1 ? secondaryColor : 
                                        'hsl(var(--muted-foreground))' 
                      }}
                    >
                      {index + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                      {contestant.photo_url ? (
                        <img src={contestant.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium flex-1 truncate">{contestant.name}</span>
                    <ContestantVoteDisplay
                      mode={voteDisplayMode}
                      voteCount={contestant.vote_count}
                      maxVotes={maxVotes}
                      primaryColor={primaryColor}
                      className="text-xs"
                    />
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 p-2 rounded-md bg-background">
                  <span 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    1
                  </span>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Sample Contestant</span>
                </div>
              )}
            </div>
            
            {/* Vote Button Preview */}
            <Button 
              className="w-full mt-4 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Vote className="mr-2 h-4 w-4" />
              Vote Now
            </Button>
          </div>
        </div>
        
        {/* Color Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: primaryColor }}
            />
            <span>Primary</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: secondaryColor }}
            />
            <span>Secondary</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
