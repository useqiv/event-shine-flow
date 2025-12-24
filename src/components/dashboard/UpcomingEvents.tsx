import { Heart, MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const UpcomingEvents = () => {
  const events = [
    {
      id: 1,
      title: "Shatta Wale Album Lunch",
      category: "Music",
      location: "Cape Coast Stadium, Cape Coa...",
      date: "20th August, 2025",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      categoryColor: "bg-primary",
    },
    {
      id: 2,
      title: "Ghana Tech Awareness",
      category: "Tech",
      location: "Conference Centre, Accra",
      date: "15th August, 2025",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
      categoryColor: "bg-accent",
    },
    {
      id: 3,
      title: "Friday Night Vibe",
      category: "Nightlife",
      location: "Sky Bar, East Legon",
      date: "24th September, 2025",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop",
      categoryColor: "bg-chart-1",
    },
  ];

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
            All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
          >
            {/* Image */}
            <div className="relative h-44 overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              
              {/* Category Badge */}
              <span className={`absolute top-3 left-3 px-2.5 py-1 ${event.categoryColor} text-primary-foreground text-xs font-medium rounded-md`}>
                {event.category}
              </span>
              
              {/* Favorite Button */}
              <button className="absolute top-3 right-3 h-8 w-8 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-card transition-colors">
                <Heart className="h-4 w-4 text-primary" />
              </button>

              {/* Event Info on Image */}
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-foreground font-semibold text-base mb-1.5 line-clamp-1">
                  {event.title}
                </h3>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>{event.date}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UpcomingEvents;
