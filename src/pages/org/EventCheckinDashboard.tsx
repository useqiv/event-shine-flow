import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useEventTicketTypes, useQRScanLogs } from '@/hooks/useOrganization';
import ManualTicketLookup from '@/components/org/ManualTicketLookup';
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp,
  QrCode,
  RefreshCw,
  BarChart3,
  Wifi,
  WifiOff,
  User
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface EventDetails {
  id: string;
  title: string;
  event_date: string;
  venue: string;
}

interface RecentCheckin {
  id: string;
  scanned_at: string;
  scan_result: string;
  attendee_name?: string;
  ticket_type?: string;
}

interface CheckinStats {
  totalTickets: number;
  checkedIn: number;
  pending: number;
  checkInRate: number;
  recentCheckins: RecentCheckin[];
  hourlyCheckins: { hour: number; count: number }[];
}

const EventCheckinDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [stats, setStats] = useState<CheckinStats>({
    totalTickets: 0,
    checkedIn: 0,
    pending: 0,
    checkInRate: 0,
    recentCheckins: [],
    hourlyCheckins: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { data: ticketTypes } = useEventTicketTypes(id || '');
  const { data: scanLogs, refetch: refetchScans } = useQRScanLogs(id);

  const fetchStats = async () => {
    if (!id) return;

    try {
      // Fetch event details
      const { data: eventData } = await supabase
        .from('events')
        .select('id, title, event_date, venue')
        .eq('id', id)
        .single();
      
      if (eventData) setEvent(eventData);

      // Fetch tickets for this event with user info
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, status, quantity, user_id')
        .eq('event_id', id);

      const totalTickets = tickets?.reduce((sum, t) => sum + t.quantity, 0) || 0;
      const checkedIn = tickets?.filter(t => t.status === 'used').reduce((sum, t) => sum + t.quantity, 0) || 0;

      // Fetch scan logs with ticket info for recent checkins
      const { data: scans } = await supabase
        .from('qr_scan_logs')
        .select('id, scanned_at, scan_result, ticket_id')
        .eq('event_id', id)
        .order('scanned_at', { ascending: false })
        .limit(50);

      // Enrich recent check-ins with attendee info
      const recentCheckins: RecentCheckin[] = [];
      for (const scan of (scans || []).slice(0, 15)) {
        if (scan.ticket_id) {
          const { data: ticket } = await supabase
            .from('tickets')
            .select('user_id, ticket_type_id')
            .eq('id', scan.ticket_id)
            .maybeSingle();
          
          let attendeeName = 'Unknown';
          let ticketType = 'Standard';
          
          if (ticket) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', ticket.user_id)
              .maybeSingle();
            
            const { data: type } = await supabase
              .from('ticket_types')
              .select('name')
              .eq('id', ticket.ticket_type_id)
              .maybeSingle();
            
            attendeeName = profile?.full_name || 'Unknown';
            ticketType = type?.name || 'Standard';
          }
          
          recentCheckins.push({
            id: scan.id,
            scanned_at: scan.scanned_at,
            scan_result: scan.scan_result,
            attendee_name: attendeeName,
            ticket_type: ticketType,
          });
        }
      }

      // Calculate hourly breakdown from successful scans
      const successfulScans = scans?.filter(s => s.scan_result === 'success') || [];
      const hourlyMap = new Map<number, number>();
      successfulScans.forEach(scan => {
        const hour = new Date(scan.scanned_at).getHours();
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
      });

      const hourlyCheckins = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: hourlyMap.get(i) || 0,
      }));

      setStats({
        totalTickets,
        checkedIn,
        pending: totalTickets - checkedIn,
        checkInRate: totalTickets > 0 ? (checkedIn / totalTickets) * 100 : 0,
        recentCheckins,
        hourlyCheckins,
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [id, scanLogs]);

  // Real-time subscription for scan logs and tickets
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`checkin-updates-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qr_scan_logs',
          filter: `event_id=eq.${id}`,
        },
        () => {
          refetchScans();
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `event_id=eq.${id}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const maxHourlyCount = Math.max(...stats.hourlyCheckins.map(h => h.count), 1);

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Check-in Dashboard</h1>
              {isConnected ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Reconnecting
                </Badge>
              )}
            </div>
            {event && (
              <p className="text-muted-foreground">
                {event.title} • {event.venue}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {formatDistanceToNow(lastUpdate, { addSuffix: true })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchStats}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Link to={`/org/events/${id}/scanner`}>
              <Button>
                <QrCode className="mr-2 h-4 w-4" />
                Open Scanner
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Checked In</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1 bg-primary-foreground/20" />
                  ) : (
                    <p className="text-3xl font-bold">{stats.checkedIn}</p>
                  )}
                </div>
                <UserCheck className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
                  )}
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tickets</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{stats.totalTickets}</p>
                  )}
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in Rate</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{stats.checkInRate.toFixed(1)}%</p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>
              {stats.checkedIn} of {stats.totalTickets} attendees checked in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={stats.checkInRate} className="h-4" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Check-ins Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Hourly Check-ins (Last 24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-40">
                {stats.hourlyCheckins.map((h) => (
                  <div key={h.hour} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-primary rounded-t"
                      style={{ height: `${(h.count / maxHourlyCount) * 100}%`, minHeight: h.count > 0 ? '4px' : '0' }}
                    />
                    <span className="text-xs text-muted-foreground mt-1">
                      {h.hour}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Check-ins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Recent Check-ins
                {isConnected && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </CardTitle>
              <CardDescription>Live feed of latest check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : stats.recentCheckins.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {stats.recentCheckins.map((scan) => (
                    <div 
                      key={scan.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-in fade-in slide-in-from-top-1 duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${scan.scan_result === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          <User className={`h-4 w-4 ${scan.scan_result === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {scan.attendee_name || 'Unknown Attendee'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {scan.ticket_type} • {format(new Date(scan.scanned_at), 'HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={scan.scan_result === 'success' ? 'default' : 'destructive'}>
                        {scan.scan_result}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No check-ins yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Manual Ticket Lookup */}
        <ManualTicketLookup eventId={id || ''} onCheckIn={fetchStats} />

        {/* Ticket Types Breakdown */}
        {ticketTypes && ticketTypes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ticket Types Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ticketTypes.map((type: any) => (
                  <div key={type.id} className="p-4 rounded-lg border border-border">
                    <p className="font-medium">{type.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">Sold</span>
                      <Badge variant="outline">{type.quantity_sold}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-muted-foreground">Available</span>
                      <Badge variant="outline">{type.quantity_available - type.quantity_sold}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OrganizationLayout>
  );
};

export default EventCheckinDashboard;
