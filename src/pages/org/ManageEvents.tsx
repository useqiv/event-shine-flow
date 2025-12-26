import React from 'react';
import { Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOrganizationEvents } from '@/hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, PlusCircle, MapPin, Eye, Settings, DollarSign, TrendingUp, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/components/ui/currency-selector';
import CurrencyDisplay from '@/components/ui/currency-display';

const ManageEvents = () => {
  const { data: events, isLoading } = useOrganizationEvents();
  const { user } = useAuth();

  // Fetch ticket revenue per event with currency info
  const { data: eventRevenues } = useQuery({
    queryKey: ['event-revenues', user?.id],
    queryFn: async () => {
      const { data: eventsData } = await supabase
        .from('events')
        .select('id')
        .eq('organization_id', user!.id);

      const eventIds = eventsData?.map(e => e.id) || [];
      if (eventIds.length === 0) return {};

      // Fetch tickets with ticket_type to get currency
      const { data: tickets } = await supabase
        .from('tickets')
        .select('event_id, amount_paid, quantity, ticket_type_id')
        .in('event_id', eventIds);

      // Fetch ticket types to get currencies
      const ticketTypeIds = [...new Set(tickets?.map(t => t.ticket_type_id) || [])];
      const { data: ticketTypes } = await supabase
        .from('ticket_types')
        .select('id, currency')
        .in('id', ticketTypeIds);

      const ticketTypeCurrencyMap: Record<string, string> = {};
      ticketTypes?.forEach(tt => {
        ticketTypeCurrencyMap[tt.id] = tt.currency || 'USD';
      });

      const revenues: Record<string, { revenue: number; ticketsSold: number; currency: string }> = {};
      tickets?.forEach(ticket => {
        if (!revenues[ticket.event_id]) {
          revenues[ticket.event_id] = { revenue: 0, ticketsSold: 0, currency: ticketTypeCurrencyMap[ticket.ticket_type_id] || 'USD' };
        }
        revenues[ticket.event_id].revenue += Number(ticket.amount_paid);
        revenues[ticket.event_id].ticketsSold += ticket.quantity;
      });

      return revenues;
    },
    enabled: !!user,
  });

  // Fetch commission settings
  const { data: commissionSettings } = useQuery({
    queryKey: ['platform-commission-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_key, setting_value')
        .eq('category', 'commission');
      
      if (error) throw error;
      
      const settings: Record<string, number> = {};
      data?.forEach((s: any) => {
        settings[s.setting_key] = Number(s.setting_value) || 0;
      });
      return settings;
    },
  });

  // Fetch organization-specific commission rates
  const { data: orgApproval } = useQuery({
    queryKey: ['org-approval-commission'],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('organization_approvals')
        .select('vote_commission_rate, ticket_commission_rate, special_commission_rate')
        .eq('organization_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const platformTicketCommission = commissionSettings?.ticket_commission_percentage || commissionSettings?.platform_commission_percentage || 10;
  const ticketCommission = orgApproval?.ticket_commission_rate ?? orgApproval?.special_commission_rate ?? platformTicketCommission;

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Events</h1>
            <p className="text-muted-foreground">View and manage all your events.</p>
          </div>
          <Link to="/org/events/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event: any) => {
              const eventData = eventRevenues?.[event.id] || { revenue: 0, ticketsSold: 0, currency: 'USD' };
              const totalRevenue = eventData.revenue;
              const netRevenue = totalRevenue * (1 - ticketCommission / 100);
              const commissionDeducted = totalRevenue - netRevenue;
              const eventCurrency = eventData.currency || 'USD';

              return (
                <Card key={event.id} className="overflow-hidden">
                  <div className="h-32 bg-secondary">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold truncate">{event.title}</h3>
                      <Badge variant={event.is_active ? "default" : "secondary"}>
                        {event.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{event.event_date ? format(new Date(event.event_date), 'MMM d, yyyy • h:mm a') : 'Date TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>

                    {/* Revenue Section */}
                    <div className="bg-secondary/50 rounded-lg p-3 mb-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>Total Revenue</span>
                        </div>
                        <span className="font-medium">
                          <CurrencyDisplay amount={totalRevenue} currency={eventCurrency} size="sm" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <TrendingUp className="h-3 w-3" />
                          <span>Net Revenue</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {ticketCommission}% commission<br/>
                                  Deducted: {formatCurrency(commissionDeducted, eventCurrency)}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          <CurrencyDisplay amount={netRevenue} currency={eventCurrency} size="sm" className="text-green-600 dark:text-green-400" />
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {eventData.ticketsSold} tickets sold
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/org/events/${event.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Settings className="mr-2 h-4 w-4" />
                          Manage
                        </Button>
                      </Link>
                      <Link to={`/events/${event.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first event to start selling tickets.
              </p>
              <Link to="/org/events/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </OrganizationLayout>
  );
};

export default ManageEvents;