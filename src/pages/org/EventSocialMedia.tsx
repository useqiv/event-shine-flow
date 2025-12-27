import React from 'react';
import { useParams, Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SocialAutoPostManager } from '@/components/org/SocialAutoPostManager';
import { EventAutoPostingCard } from '@/components/org/EventAutoPostingCard';
import { useEvent } from '@/hooks/useEvents';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const EventSocialMedia = () => {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(id || '');

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
              <h1 className="text-2xl font-bold text-foreground">Social Media</h1>
              <p className="text-muted-foreground">
                {event.title} • {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* Auto-Posting Manager */}
        <SocialAutoPostManager
          entityId={event.id}
          entityType="event"
          entityTitle={event.title}
        />

        {/* Legacy Event Auto-Posting Card (for backwards compatibility) */}
        <EventAutoPostingCard
          eventId={event.id}
          eventTitle={event.title}
        />
      </div>
    </OrganizationLayout>
  );
};

export default EventSocialMedia;