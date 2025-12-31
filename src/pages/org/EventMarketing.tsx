import React from 'react';
import { useParams, Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialAutoPostManager } from '@/components/org/SocialAutoPostManager';
import { EntityInfluencerLinks } from '@/components/org/EntityInfluencerLinks';
import { EntityPromoCodes } from '@/components/org/EntityPromoCodes';
import { useEvent, useTicketTypes } from '@/hooks/useEvents';
import { ArrowLeft, Calendar, Link2, Tag, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

const EventMarketing = () => {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(id || '');
  const { data: ticketTypes } = useTicketTypes(event?.id || '');
  
  // Get currency from first ticket type, default to NGN
  const eventCurrency = ticketTypes?.[0]?.currency || 'NGN';

  if (eventLoading) {
    return (
      <OrganizationLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </OrganizationLayout>
    );
  }

  if (!event) {
    return (
      <OrganizationLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Event not found</p>
          <Link to="/org/events">
            <Button variant="outline" className="mt-4">
              Back to Events
            </Button>
          </Link>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={`/org/events/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Marketing Hub</h1>
              <p className="text-muted-foreground">
                {event.title} • {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="auto-posting" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 w-full lg:w-auto">
            <TabsTrigger value="auto-posting" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Auto-Posting</span>
              <span className="sm:hidden">Auto</span>
            </TabsTrigger>
            <TabsTrigger value="influencers" className="gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Influencers</span>
              <span className="sm:hidden">Links</span>
            </TabsTrigger>
            <TabsTrigger value="promos" className="gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Promo Codes</span>
              <span className="sm:hidden">Promos</span>
            </TabsTrigger>
          </TabsList>

          {/* Auto-Posting Tab */}
          <TabsContent value="auto-posting" className="space-y-6">
            <SocialAutoPostManager
              entityId={event.id}
              entityType="event"
              entityTitle={event.title}
            />
          </TabsContent>

          {/* Influencer Links Tab */}
          <TabsContent value="influencers" className="space-y-6">
            <EntityInfluencerLinks
              entityId={event.id}
              entityType="event"
              entityTitle={event.title}
              customSlug={event.custom_slug}
              currency={eventCurrency}
            />
          </TabsContent>

          {/* Promo Codes Tab */}
          <TabsContent value="promos" className="space-y-6">
            <EntityPromoCodes
              entityId={event.id}
              entityType="event"
              entityTitle={event.title}
              currency={eventCurrency}
            />
          </TabsContent>
        </Tabs>
      </div>
    </OrganizationLayout>
  );
};

export default EventMarketing;
