import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { ShareButtons } from '@/components/ui/share-buttons';
import { Trophy, User, Vote, ExternalLink } from 'lucide-react';

const PublicContest = () => {
  const { slug } = useParams<{ slug: string }>();

  // Fetch contest by slug
  const { data: contest, isLoading: contestLoading } = useQuery({
    queryKey: ['public-contest', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('custom_slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch contestants
  const { data: contestants, isLoading: contestantsLoading } = useQuery({
    queryKey: ['public-contestants', contest?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contestants')
        .select('*')
        .eq('contest_id', contest!.id)
        .order('vote_count', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!contest?.id,
  });

  // Brand colors with fallbacks
  const primaryColor = contest?.brand_primary_color || '#7c3aed';
  const secondaryColor = contest?.brand_secondary_color || '#f97316';

  // Generate CSS variables for branding
  const brandStyles = useMemo(() => ({
    '--brand-primary': primaryColor,
    '--brand-secondary': secondaryColor,
  } as React.CSSProperties), [primaryColor, secondaryColor]);

  const isEnded = contest && new Date(contest.end_date) < new Date();
  const contestUrl = `${window.location.origin}/c/${slug}`;

  if (contestLoading) {
    return (
      <div className="min-h-screen bg-background" style={brandStyles}>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Contest not found</h2>
          <p className="text-muted-foreground mb-4">This contest may not exist or is no longer active.</p>
          <Link to="/">
            <Button variant="outline">Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{contest.title} | VotePass</title>
        <meta name="description" content={contest.description || `Vote now in ${contest.title}`} />
        <meta property="og:title" content={contest.title} />
        <meta property="og:description" content={contest.description || `Vote now in ${contest.title}`} />
        {contest.image_url && <meta property="og:image" content={contest.image_url} />}
        <meta property="og:url" content={contestUrl} />
      </Helmet>

      <div className="min-h-screen bg-background" style={brandStyles}>
        {/* Header with branding */}
        <header 
          className="py-4 px-6"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="container mx-auto flex items-center justify-between">
            {contest.brand_logo_url ? (
              <img 
                src={contest.brand_logo_url} 
                alt="Contest Logo" 
                className="h-10 object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 text-white">
                <Trophy className="h-6 w-6" />
                <span className="font-bold text-lg">VotePass</span>
              </div>
            )}
            <Link to="/auth">
              <Button 
                variant="secondary" 
                size="sm"
                className="text-foreground"
              >
                Login to Vote
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Contest Header */}
          <Card className="mb-8 overflow-hidden">
            <div className="relative h-64 md:h-80 bg-secondary overflow-hidden">
              {contest.image_url ? (
                <img 
                  src={contest.image_url} 
                  alt={contest.title} 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <div 
                  className="h-full w-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <Trophy className="h-24 w-24 text-white/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <Badge 
                  className="mb-2"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {contest.category}
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{contest.title}</h1>
              </div>
              {isEnded && (
                <div className="absolute top-4 right-4">
                  <Badge variant="destructive" className="text-lg px-4 py-2">Ended</Badge>
                </div>
              )}
            </div>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Votes</p>
                    <p className="text-xl font-bold">{contest.total_votes.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vote Price</p>
                    <p className="text-xl font-bold">₦{Number(contest.vote_price).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <CountdownTimer 
                      endDate={contest.end_date} 
                      startDate={contest.start_date}
                    />
                  </div>
                </div>
                <ShareButtons 
                  title={contest.title} 
                  description={contest.description || `Vote now in ${contest.title}`}
                  url={contestUrl}
                />
              </div>
              {contest.description && (
                <p className="mt-4 text-muted-foreground">{contest.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Contestants */}
          <div>
            <h2 className="text-xl font-bold mb-4">Contestants</h2>
            {contestantsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : contestants && contestants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contestants.map((contestant, index) => (
                  <Card 
                    key={contestant.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-48 bg-secondary">
                      {contestant.photo_url ? (
                        <img 
                          src={contestant.photo_url} 
                          alt={contestant.name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <User className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      {index < 3 && (
                        <div className="absolute top-2 left-2">
                          <Badge 
                            style={{ 
                              backgroundColor: index === 0 ? '#eab308' : index === 1 ? '#9ca3af' : '#b45309'
                            }}
                          >
                            #{index + 1}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg">{contestant.name}</h3>
                      {contestant.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{contestant.bio}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <Vote className="h-4 w-4" />
                        <span>
                          {contestant.is_public_votes 
                            ? `${contestant.vote_count.toLocaleString()} votes`
                            : 'Votes hidden'}
                        </span>
                      </div>
                      <Link to={`/auth?redirect=/contests/${contest.id}?vote=${contestant.id}`}>
                        <Button 
                          className="w-full mt-4"
                          style={{ backgroundColor: primaryColor }}
                          disabled={isEnded}
                        >
                          {isEnded ? 'Voting Ended' : 'Vote Now'}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No contestants yet</p>
              </Card>
            )}
          </div>

          {/* Call to Action */}
          <Card className="mt-8 p-6 text-center" style={{ borderColor: primaryColor }}>
            <h3 className="text-xl font-bold mb-2">Want to vote?</h3>
            <p className="text-muted-foreground mb-4">
              Create an account or login to cast your votes for your favorite contestant.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/auth">
                <Button style={{ backgroundColor: primaryColor }}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Login / Sign Up
                </Button>
              </Link>
            </div>
          </Card>
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 border-t border-border mt-8">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            Powered by <Link to="/" className="font-semibold hover:underline" style={{ color: primaryColor }}>VotePass</Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default PublicContest;
