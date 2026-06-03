import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Trophy, Calendar, ArrowRight, Vote, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isAfter, isBefore } from "date-fns";

type FilterType = "all" | "ongoing" | "coming_up" | "past";

const ContestsShowcase = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { data: contestData, isLoading } = useQuery({
    queryKey: ["landing-contests"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const [activeResult, pastResult] = await Promise.all([
        supabase
          .from("contests")
          .select("*")
          .eq("is_active", true)
          .gte("end_date", now)
          .order("start_date", { ascending: true })
          .limit(20),
        supabase
          .from("contests")
          .select("*")
          .lt("end_date", now)
          .order("end_date", { ascending: false })
          .limit(20),
      ]);

      if (activeResult.error) throw activeResult.error;
      if (pastResult.error) throw pastResult.error;

      return {
        active: activeResult.data ?? [],
        past: pastResult.data ?? [],
      };
    },
  });

  const activeContests = contestData?.active ?? [];
  const pastContests = contestData?.past ?? [];

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "ongoing", label: "Ongoing" },
    { key: "coming_up", label: "Coming Soon" },
    { key: "past", label: "Past" },
  ];

  const filteredContests = useMemo(() => {
    const now = new Date();
    const sourceContests = activeFilter === "past" ? pastContests : activeContests;
    let filtered = sourceContests;

    if (activeFilter === "past") {
      return filtered.slice(0, 10);
    }

    switch (activeFilter) {
      case "ongoing":
        filtered = activeContests.filter((contest) => {
          const startDate = new Date(contest.start_date);
          const endDate = new Date(contest.end_date);
          return isBefore(startDate, now) && isAfter(endDate, now);
        });
        break;
      case "coming_up":
        filtered = activeContests.filter((contest) => {
          const startDate = new Date(contest.start_date);
          return isAfter(startDate, now);
        });
        break;
      default:
        filtered = activeContests;
    }

    return filtered.slice(0, 10);
  }, [activeContests, pastContests, activeFilter]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      pageant: "bg-pink-500",
      music: "bg-purple-500",
      dance: "bg-orange-500",
      talent: "bg-teal-500",
      fashion: "bg-rose-500",
      awards: "bg-amber-500",
      sports: "bg-green-500",
      beauty: "bg-fuchsia-500",
    };
    return colors[category?.toLowerCase()] || "bg-primary";
  };

  const scrollContainer = (direction: "left" | "right") => {
    const container = document.getElementById("contests-scroll-container");
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
      <section className="py-10 lg:py-14 bg-muted">
        <div className="w-full px-4 md:px-6 lg:px-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
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

  if (activeContests.length === 0 && pastContests.length === 0) {
    return null;
  }

  return (
    <section className="py-10 lg:py-14 bg-muted">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-1">Contests</h2>
                <p className="text-muted-foreground text-sm">Vote for your favorite contestants or browse past results</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="rounded-full px-4" asChild>
                  <Link to="/contests">
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
            <div className="flex items-center justify-between gap-4 pb-2">
              {/* Mobile: filter dropdown */}
              <div className="sm:hidden">
                <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterType)}>
                  <SelectTrigger className="w-auto min-w-[130px] rounded-full text-sm h-9">
                    <SlidersHorizontal className="h-4 w-4 mr-1.5 shrink-0" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.map((filter) => (
                      <SelectItem key={filter.key} value={filter.key}>{filter.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop: filter pills */}
              <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeFilter === filter.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-background/80"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contests Horizontal Scroll */}
          {filteredContests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No contests found for this filter.</p>
            </div>
          ) : (
            <div
              id="contests-scroll-container"
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {filteredContests.map((contest) => (
                <ContestCard
                  key={contest.id}
                  contest={contest}
                  categoryColor={getCategoryColor(contest.category)}
                  isPast={activeFilter === "past"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

interface ContestCardProps {
  contest: {
    id: string;
    title: string;
    category: string;
    start_date: string;
    end_date: string;
    image_url: string | null;
    custom_slug: string | null;
    vote_price: number;
    vote_currency: string;
  };
  categoryColor: string;
  isPast?: boolean;
}

const ContestCard = ({ contest, categoryColor, isPast = false }: ContestCardProps) => {
  const contestUrl = contest.custom_slug ? `/c/${contest.custom_slug}` : `/contests/${contest.id}`;
  const now = new Date();
  const startDate = new Date(contest.start_date);
  const endDate = new Date(contest.end_date);
  const isOngoing = !isPast && isBefore(startDate, now) && isAfter(endDate, now);

  return (
    <Link
      to={contestUrl}
      className="group relative bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50 flex-shrink-0 w-72 snap-start"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        {contest.image_url ? (
          <img
            src={contest.image_url}
            alt={contest.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Trophy className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />

        {/* Category Badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 ${categoryColor} rounded-full shadow-md`}>
          <span className="text-xs font-semibold text-white capitalize">{contest.category}</span>
        </div>

        {/* Status Badge */}
        <div
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full shadow-md ${
            isPast ? "bg-muted-foreground" : isOngoing ? "bg-green-500" : "bg-amber-500"
          }`}
        >
          <span className="text-xs font-semibold text-white">
            {isPast ? "Ended" : isOngoing ? "Live" : "Coming Soon"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-bold text-foreground mb-2.5 group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
          {contest.title}
        </h3>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs">
              {isPast
                ? `Ended ${format(endDate, "MMM d, yyyy")}`
                : isOngoing
                  ? `Ends ${format(endDate, "MMM d, yyyy")}`
                  : `Starts ${format(startDate, "MMM d, yyyy")}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Vote className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs">
              {contest.vote_currency} {contest.vote_price.toFixed(2)} per vote
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Button variant="outline" size="sm" className="w-full rounded-full text-xs group/btn">
          <Trophy className="h-3.5 w-3.5 mr-1.5" />
          {isPast ? "View Results" : isOngoing ? "Vote Now" : "View Contest"}
          <ArrowRight className="h-3.5 w-3.5 ml-auto group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Link>
  );
};

export default ContestsShowcase;
