import { Heart, MapPin, Calendar, ChevronLeft, ChevronRight, ArrowRight, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      categoryColor: "bg-pink-500",
      price: "$25",
    },
    {
      id: 2,
      title: "Ghana Tech Awareness",
      location: "Conference Centre, Accra",
      date: "15th August, 2025",
      category: "Tech",
      image: eventTech,
      categoryColor: "bg-teal-500",
      price: "$15",
    },
    {
      id: 3,
      title: "Friday Night Vibe",
      location: "Sky Bar, East Legon",
      date: "24th September, 2025",
      category: "Nightlife",
      image: eventNightlife,
      categoryColor: "bg-orange-500",
      price: "$30",
    },
  ];

  return (
    <section className="py-10 lg:py-14 bg-muted">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-1">Upcoming Events</h2>
              <p className="text-muted-foreground text-sm">Discover exciting events near you</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full px-4">
                All Events
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <div className="flex items-center gap-1.5">
                <button className="p-2.5 bg-card border border-border rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="p-2.5 bg-card border border-border rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
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
  price: string;
}

const EventCard = ({ event }: { event: Event }) => {
  return (
    <div className="group relative bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50">
      {/* Image */}
      <div className="relative h-52 lg:h-56 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        
        {/* Category Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1.5 ${event.categoryColor} rounded-full shadow-md`}>
          <span className="text-xs font-semibold text-primary-foreground">{event.category}</span>
        </div>

        {/* Heart Button */}
        <button className="absolute top-4 right-4 p-2.5 bg-card/90 backdrop-blur-sm rounded-full hover:bg-primary transition-all shadow-md group/heart hover:scale-110">
          <Heart className="h-4 w-4 text-primary group-hover/heart:text-primary-foreground transition-colors" />
        </button>

        {/* Price Badge */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-card/90 backdrop-blur-sm rounded-full shadow-md">
          <span className="text-sm font-bold text-foreground">{event.price}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 lg:p-6">
        <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-1">
          {event.title}
        </h3>
        
        <div className="space-y-2.5 mb-4">
          <div className="flex items-start gap-2.5 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="text-sm line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm">{event.date}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button variant="outline" size="sm" className="w-full rounded-full group/btn">
          <Ticket className="h-4 w-4 mr-2" />
          Get Tickets
          <ArrowRight className="h-4 w-4 ml-auto group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default UpcomingEvents;
