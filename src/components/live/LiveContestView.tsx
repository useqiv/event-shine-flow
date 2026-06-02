import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LiveVotingWidget } from './LiveVotingWidget';
import { LiveStreamEmbed } from './LiveStreamEmbed';
import { User, Radio, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContestantVoteDisplay } from '@/components/contest/ContestantVoteDisplay';
import { normalizeVoteDisplayMode, type VoteDisplayMode } from '@/lib/voteDisplay';
import CurrencyDisplay from '@/components/ui/currency-display';
import { FavoriteButton } from '@/components/dashboard/FavoriteButton';
import { ContestantShareButton } from '@/components/ui/share-buttons';

interface Contestant {
  id: string;
  name: string;
  vote_count: number;
  photo_url?: string;
  bio?: string;
  is_public_votes?: boolean;
}

interface LiveContestViewProps {
  contestId: string;
  contestTitle: string;
  contestCustomSlug?: string | null;
  streamUrl?: string;
  streamPlatform?: 'youtube' | 'twitch' | 'custom';
  contestants: Contestant[];
  totalVotes: number;
  votePrice: number;
  voteCurrency: string;
  isVotingLocked: boolean;
  primaryColor: string;
  voteDisplayMode?: VoteDisplayMode;
  onVoteClick: (contestant: Contestant) => void;
}

export const LiveContestView: React.FC<LiveContestViewProps> = ({
  contestId,
  contestTitle,
  contestCustomSlug,
  streamUrl,
  streamPlatform = 'custom',
  contestants,
  totalVotes,
  votePrice,
  voteCurrency,
  isVotingLocked,
  primaryColor,
  voteDisplayMode: voteDisplayModeProp,
  onVoteClick,
}) => {
  const voteDisplayMode = normalizeVoteDisplayMode(voteDisplayModeProp);
  const [isStreamExpanded, setIsStreamExpanded] = useState(false);
  const [highlightedContestant, setHighlightedContestant] = useState<string | null>(null);

  const handleVoteSurge = useCallback((surge: { contestantId: string }) => {
    setHighlightedContestant(surge.contestantId);
    setTimeout(() => setHighlightedContestant(null), 2000);
  }, []);

  // Sort contestants by vote count
  const sortedContestants = [...contestants].sort((a, b) => b.vote_count - a.vote_count);
  const leaderboardMaxVotes = sortedContestants[0]?.vote_count || 1;

  return (
    <div className="space-y-4">
      {/* Live Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-red-500 animate-pulse">
            <Radio className="h-3 w-3 mr-1" />
            LIVE NOW
          </Badge>
          <span className="text-sm text-muted-foreground">
            {contestants.length} contestants competing
          </span>
        </div>
        {streamUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsStreamExpanded(!isStreamExpanded)}
          >
            {isStreamExpanded ? (
              <>
                <Minimize2 className="h-4 w-4 mr-1" />
                Split View
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-1" />
                Focus Stream
              </>
            )}
          </Button>
        )}
      </div>

      {/* Main Layout - Side by Side */}
      <div className={cn(
        "grid gap-4",
        streamUrl && !isStreamExpanded ? "lg:grid-cols-[350px_1fr]" : "grid-cols-1"
      )}>
        {/* Left Side - Live Voting Widget & Quick Vote */}
        {(!isStreamExpanded || !streamUrl) && (
          <div className="space-y-4">
            {/* Live Voting Widget */}
            <LiveVotingWidget
              contestId={contestId}
              totalVotes={totalVotes}
              contestants={sortedContestants.slice(0, 10)}
              isLive={true}
              voteDisplayMode={voteDisplayMode}
              onVoteSurge={handleVoteSurge}
            />

            {/* Quick Vote Section */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Quick Vote</h3>
                  <span className="text-xs text-muted-foreground">
                    <CurrencyDisplay 
                      amount={votePrice} 
                      currency={voteCurrency} 
                      size="sm"
                    />
                    /vote
                  </span>
                </div>
                <div className="max-h-[420px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sortedContestants.map((contestant, index) => (
                      <div
                        key={contestant.id}
                        className={cn(
                          "flex flex-col gap-3 p-3 rounded-lg transition-all border border-border/60",
                          "hover:bg-secondary/50 cursor-pointer",
                          highlightedContestant === contestant.id && "ring-2 ring-green-500 bg-green-500/10"
                        )}
                        onClick={() => !isVotingLocked && onVoteClick(contestant)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Rank & Photo */}
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden">
                              {contestant.photo_url ? (
                                <img
                                  src={contestant.photo_url}
                                  alt={contestant.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            {index < 3 && (
                              <Badge
                                className={cn(
                                  "absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]",
                                  index === 0 && "bg-yellow-500",
                                  index === 1 && "bg-gray-400",
                                  index === 2 && "bg-amber-600"
                                )}
                              >
                                {index + 1}
                              </Badge>
                            )}
                          </div>

                          {/* Name & Votes */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{contestant.name}</p>
                            <ContestantVoteDisplay
                              mode={voteDisplayMode}
                              voteCount={contestant.vote_count}
                              maxVotes={leaderboardMaxVotes}
                              isPublicVotes={contestant.is_public_votes !== false}
                              primaryColor={primaryColor}
                              className="text-xs"
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <FavoriteButton contestantId={contestant.id} />
                            <ContestantShareButton
                              contestId={contestId}
                              contestantId={contestant.id}
                              contestantName={contestant.name}
                              contestTitle={contestTitle}
                              contestCustomSlug={contestCustomSlug}
                            />
                          </div>
                          <Button
                            size="sm"
                            disabled={isVotingLocked}
                            style={!isVotingLocked ? { backgroundColor: primaryColor } : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              onVoteClick(contestant);
                            }}
                          >
                            Vote
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right Side - Live Stream */}
        {streamUrl && (
          <div className={cn(
            "relative",
            isStreamExpanded ? "min-h-[70vh]" : "min-h-[500px]"
          )}>
            <LiveStreamEmbed
              streamUrl={streamUrl}
              platform={streamPlatform}
              isEditable={false}
              className="h-full"
            />
          </div>
        )}

        {/* No Stream - Show contestant grid instead */}
        {!streamUrl && (
          <Card className="p-6 text-center">
            <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-semibold">No Live Stream Configured</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The organizer hasn't set up a live stream for this contest yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You can still vote for contestants using the panel on the left!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LiveContestView;
