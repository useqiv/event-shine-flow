import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShareCardGenerator } from '@/components/org/ShareCardGenerator';
import { Image, Download, Share2 } from 'lucide-react';

interface Contestant {
  id: string;
  name: string;
  photo_url: string | null;
  vote_count: number;
}

interface Contest {
  id: string;
  title: string;
  brand_primary_color?: string;
  brand_logo_url?: string;
  custom_slug?: string | null;
}

interface ContestShareCardsProps {
  contest: Contest;
  contestants: Contestant[];
}

export const ContestShareCards: React.FC<ContestShareCardsProps> = ({
  contest,
  contestants,
}) => {
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const handleGenerateCard = (contestant: Contestant) => {
    setSelectedContestant(contestant);
    setIsGeneratorOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Share Cards
          </CardTitle>
          <CardDescription>
            Generate shareable cards for each contestant to promote voting
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contestants.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contestants.map((contestant) => (
                <div 
                  key={contestant.id} 
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contestant.photo_url || undefined} alt={contestant.name} />
                    <AvatarFallback>{contestant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contestant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {contestant.vote_count.toLocaleString()} votes
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGenerateCard(contestant)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Add contestants to generate share cards
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedContestant && (
        <ShareCardGenerator
          open={isGeneratorOpen}
          onOpenChange={setIsGeneratorOpen}
          contestant={selectedContestant}
          contest={contest}
        />
      )}
    </>
  );
};
