import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEvents } from '@/hooks/useEvents';
import { Calendar, Search, Filter, MapPin, Clock, Heart, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { AFRICAN_COUNTRIES } from '@/lib/africanCountries';
import { useIsSaved, useToggleSave } from '@/hooks/useSavedItems';
import { useAuth } from '@/contexts/AuthContext';
import { getBreadcrumbSchema } from '@/lib/structuredData';

const EventCard = ({ event }: { event: any }) => {
  const { user } = useAuth();
  const { data: isSaved } = useIsSaved('event', event.id);
  const toggleSave = useToggleSave();

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggleSave.mutate({ itemType: 'event', itemId: event.id });
    }
  };

  

  return (
    <Link to={`/events/${event.id}`}>
      <Card className="group hover:border-primary/50 transition-all duration-300 overflow-hidden">
        <div className="relative h-48 bg-secondary">
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.title} 
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Calendar className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant={event.is_featured ? 'default' : 'secondary'}>
              {event.category}
            </Badge>
          </div>
          {user && (
            <button 
              onClick={handleToggleSave}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
            </button>
          )}
          
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {event.title}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{event.event_date ? format(new Date(event.event_date), 'EEEE, MMMM d, yyyy') : 'Date TBD'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{event.event_date ? format(new Date(event.event_date), 'h:mm a') : 'Time TBD'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{event.venue || 'Venue TBD'}</span>
          </div>
          <Button className="w-full mt-4">
            Get Tickets
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};

const Events = () => {
  const { data: events, isLoading } = useEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = events 
    ? [...new Set(events.map(e => e.category).filter(Boolean))]
    : [];

  const filteredEvents = events?.filter(event => {
    const matchesSearch = (event.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (event.venue?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: 'https://www.useqiv.com' },
    { name: 'Events', url: 'https://www.useqiv.com/events' },
  ]);

  return (
    <>
      <Helmet>
        <title>Discover Events & Buy Tickets | USEQIV</title>
        <meta name="description" content="Find and book tickets for amazing events - concerts, conferences, parties, and more. Secure QR code tickets with instant delivery." />
        <meta name="keywords" content="event tickets, concerts, conferences, parties, QR tickets, event booking, ticket sales" />
        <link rel="canonical" href="https://www.useqiv.com/events" />
        
        <meta property="og:title" content="Discover Events & Buy Tickets | USEQIV" />
        <meta property="og:description" content="Find and book tickets for amazing events. Secure QR code tickets with instant delivery." />
        <meta property="og:url" content="https://www.useqiv.com/events" />
        <meta property="og:type" content="website" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Discover Events & Buy Tickets | USEQIV" />
        <meta name="twitter:description" content="Find and book tickets for amazing events on USEQIV." />

        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
          <div className="space-y-6">
            {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground">Discover and book tickets for amazing events</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Events Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEvents && filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No events found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Check back later for new events'}
              </p>
            </Card>
          )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Events;
