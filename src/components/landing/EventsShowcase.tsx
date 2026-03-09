import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { MapPin, Calendar, ArrowRight, Ticket, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isThisWeek, isThisMonth, addMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

type FilterType = "all" | "today" | "this_week" | "this_month" | "next_month";

const EventsShowcase = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  const { data: events, isLoading } = useQuery({
    queryKey: ["landing-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "this_week", label: "This Week" },
    { key: "this_month", label: "This Month" },
    { key: "next_month", label: "Next Month" },
  ];

  const availableCountries = useMemo(() => {
    if (!events) return [];
    return [...new Set(events.map((e: any) => e.country).filter(Boolean))].sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];

    let filtered = events;

    // Apply country filter first
    if (countryFilter !== "all") {
      filtered = filtered.filter((event: any) => event.country === countryFilter);
    }

    switch (activeFilter) {
      case "today":
        filtered = filtered.filter((event) => isToday(new Date(event.event_date)));
        break;
      case "this_week":
        filtered = filtered.filter((event) => isThisWeek(new Date(event.event_date)));
        break;
      case "this_month":
        filtered = filtered.filter((event) => isThisMonth(new Date(event.event_date)));
        break;
      case "next_month":
        const nextMonthStart = startOfMonth(addMonths(new Date(), 1));
        const nextMonthEnd = endOfMonth(addMonths(new Date(), 1));
        filtered = filtered.filter((event) =>
          isWithinInterval(new Date(event.event_date), { start: nextMonthStart, end: nextMonthEnd })
        );
        break;
      default:
        break;
    }

    return filtered.slice(0, 10);
  }, [events, activeFilter, countryFilter]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      music: "bg-pink-500",
      tech: "bg-teal-500",
      nightlife: "bg-orange-500",
      sports: "bg-green-500",
      fashion: "bg-purple-500",
      awards: "bg-amber-500",
      conference: "bg-blue-500",
      entertainment: "bg-red-500",
    };
    return colors[category?.toLowerCase()] || "bg-primary";
  };

  const scrollContainer = (direction: "left" | "right") => {
    const container = document.getElementById("events-scroll-container");
    if (container) {
      const scrollAmount = 320;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-10 lg:py-14 bg-background">
        <div className="w-full px-4 md:px-6 lg:px-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-full" />
                ))}
              </div>
            </div>
            <div className="flex gap-5 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-80 w-72 flex-shrink-0 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className="py-10 lg:py-14 bg-background">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-1">Upcoming Events</h2>
                <p className="text-muted-foreground text-sm">Discover exciting events happening soon</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="rounded-full px-4" asChild>
                  <Link to="/events">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
                <div className="hidden sm:flex items-center gap-1.5">
                  <button
                    onClick={() => scrollContainer("left")}
                    className="p-2.5 bg-card border border-border rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => scrollContainer("right")}
                    className="p-2.5 bg-card border border-border rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
             </div>
            </div>

          </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeFilter === filter.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {filter.label}
                </button>
              ))}

              {/* Country Filter */}
              {availableCountries.length > 0 && (
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-auto min-w-[140px] rounded-full text-sm h-9">
                    <Globe className="h-4 w-4 mr-1.5 shrink-0" />
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {availableCountries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Events Horizontal Scroll */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No events found for this filter.</p>
            </div>
          ) : (
            <div
              id="events-scroll-container"
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} categoryColor={getCategoryColor(event.category)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

interface EventCardProps {
  event: {
    id: string;
    title: string;
    venue: string;
    event_date: string;
    category: string;
    image_url: string | null;
    custom_slug: string | null;
    currency: string;
    country?: string | null;
  };
  categoryColor: string;
}

const EventCard = ({ event, categoryColor }: EventCardProps) => {
  const eventUrl = event.custom_slug ? `/e/${event.custom_slug}` : `/events/${event.id}`;

  return (
    <Link
      to={eventUrl}
      className="group relative bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50 flex-shrink-0 w-72 snap-start"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />

        {/* Category Badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 ${categoryColor} rounded-full shadow-md`}>
          <span className="text-xs font-semibold text-white capitalize">{event.category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-bold text-foreground mb-2.5 group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
          {event.title}
        </h3>

        <div className="space-y-2 mb-3">
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span className="text-xs line-clamp-1">
              {event.venue}{event.country ? `, ${event.country}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs">{format(new Date(event.event_date), "EEE, MMM d, yyyy • h:mm a")}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button variant="outline" size="sm" className="w-full rounded-full text-xs group/btn">
          <Ticket className="h-3.5 w-3.5 mr-1.5" />
          Get Tickets
          <ArrowRight className="h-3.5 w-3.5 ml-auto group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Link>
  );
};

export default EventsShowcase;
