import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Vote, Heart, Search as SearchIcon, Award } from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["search-events", query],
    queryFn: async () => {
      if (!query) return [];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString())
        .or(`title.ilike.%${query}%,venue.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!query,
  });

  const { data: contests, isLoading: contestsLoading } = useQuery({
    queryKey: ["search-contests", query],
    queryFn: async () => {
      if (!query) return [];
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString())
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!query,
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["search-campaigns", query],
    queryFn: async () => {
      if (!query) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "active")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!query,
  });

  const { data: nominations, isLoading: nominationsLoading } = useQuery({
    queryKey: ["search-nominations", query],
    queryFn: async () => {
      if (!query) return [];
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("nominations")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", now)
        .gte("end_date", now)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!query,
  });

  const isLoading = eventsLoading || contestsLoading || campaignsLoading || nominationsLoading;
  const hasResults = (events?.length || 0) + (contests?.length || 0) + (campaigns?.length || 0) + (nominations?.length || 0) > 0;

  return (
    <>
      <Helmet>
        <title>{query ? `Search: ${query}` : "Search"} | Useqiv</title>
        <meta name="description" content={`Search results for "${query}" on Useqiv`} />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {query ? `Search results for "${query}"` : "Search"}
            </h1>
            {!isLoading && query && (
              <p className="text-muted-foreground">
                Found {(events?.length || 0) + (contests?.length || 0) + (campaigns?.length || 0) + (nominations?.length || 0)} results
              </p>
            )}
          </div>

          {!query && (
            <div className="text-center py-16">
              <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Enter a search term to find events, contests, campaigns, and nominations</p>
            </div>
          )}

          {isLoading && query && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 rounded-t-lg" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && query && !hasResults && (
            <div className="text-center py-16">
              <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No results found for "{query}"</p>
              <p className="text-muted-foreground">Try different keywords or browse our categories</p>
            </div>
          )}

          {/* Events Section */}
          {events && events.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Events ({events.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <Link key={event.id} to={`/events/${event.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <div className="aspect-video bg-muted relative">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2">{event.category}</Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.event_date), "PPP")}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {event.venue}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Contests Section */}
          {contests && contests.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Vote className="h-6 w-6 text-primary" />
                Contests ({contests.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contests.map((contest) => (
                  <Link key={contest.id} to={`/contests/${contest.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <div className="aspect-video bg-muted relative">
                        {contest.image_url ? (
                          <img src={contest.image_url} alt={contest.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Vote className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2">{contest.category}</Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{contest.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Vote className="h-4 w-4" />
                          {contest.vote_currency} {contest.vote_price}/vote
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Campaigns Section */}
          {campaigns && campaigns.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                Campaigns ({campaigns.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((campaign) => (
                  <Link key={campaign.id} to={`/campaigns/${campaign.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <div className="aspect-video bg-muted relative">
                        {campaign.image_url ? (
                          <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Heart className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2">{campaign.category}</Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{campaign.title}</h3>
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (campaign.current_amount / campaign.goal_amount) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{campaign.currency} {campaign.current_amount.toLocaleString()}</span>
                          <span>of {campaign.currency} {campaign.goal_amount.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Nominations Section */}
          {nominations && nominations.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Nominations ({nominations.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {nominations.map((nomination) => (
                  <Link key={nomination.id} to={`/nominations/${nomination.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <div className="aspect-video bg-muted relative">
                        {nomination.logo_url ? (
                          <img src={nomination.logo_url} alt={nomination.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                            <Award className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2">Open for Nominations</Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{nomination.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Ends {format(new Date(nomination.end_date), "PPP")}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Search;
