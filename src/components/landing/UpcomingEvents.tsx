import { Heart, MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import eventMusic from "@/assets/event-music.jpg";
import eventTech from "@/assets/event-tech.jpg";
import eventNightlife from "@/assets/event-nightlife.jpg";

const UpcomingEvents = () => {
  const events = [
    {
      id: 1,
      title: "Shatta Wale Album Launch",
      location: "Cape Coast Stadium, Cape Coast",
      date: "20th August, 2025",
      category: "Music",
      image: eventMusic,
      categoryColor: "bg-pink-500/80",
    },
    {
      id: 2,
      title: "Ghana Tech Awareness",
      location: "Conference Centre, Accra",
      date: "15th August, 2025",
      category: "Tech",
      image: eventTech,
      categoryColor: "bg-teal-500/80",
    },
    {
      id: 3,
      title: "Friday Night Vibe",
      location: "Sky Bar, East Legon",
      date: "24th September, 2025",
      category: "Nightlife",
      image: eventNightlife,
      categoryColor: "bg-orange-500/80",
    },
  ];

  return (
    <section className="py-8 bg-muted">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Upcoming Events</h2>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-full hover:bg-muted transition-colors">
              All &gt;
            </button>
            <button className="p-2 bg-card border border-border rounded-full hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button className="p-2 bg-card border border-border rounded-full hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
};

interface Event {
  id: number;
  title: string;
  location: string;
  date: string;
  category: string;
  image: string;
  categoryColor: string;
}

const EventCard = ({ event }: { event: Event }) => {
  return (
    <div className="group relative bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
        
        {/* Category Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 ${event.categoryColor} backdrop-blur-sm rounded-full`}>
          <span className="text-xs font-medium text-primary-foreground">{event.category}</span>
        </div>

        {/* Heart Button */}
        <button className="absolute top-4 right-4 p-2 bg-card/90 backdrop-blur-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-colors group/heart">
          <Heart className="h-4 w-4 text-primary group-hover/heart:text-primary-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm truncate">{event.location}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm">{event.date}</span>
        </div>
      </div>
    </div>
  );
};

export default UpcomingEvents;
