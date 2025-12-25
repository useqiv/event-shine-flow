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
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp,
  QrCode,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

interface EventDetails {
  id: string;
  title: string;
  event_date: string;
  venue: string;
}

interface CheckinStats {
  totalTickets: number;
  checkedIn: number;
  pending: number;
  checkInRate: number;
  recentCheckins: any[];
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

      // Fetch tickets for this event
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, status, quantity')
        .eq('event_id', id);

      const totalTickets = tickets?.reduce((sum, t) => sum + t.quantity, 0) || 0;
      const checkedIn = tickets?.filter(t => t.status === 'used').reduce((sum, t) => sum + t.quantity, 0) || 0;

      // Fetch scan logs for hourly breakdown
      const { data: scans } = await supabase
        .from('qr_scan_logs')
        .select('scanned_at')
        .eq('event_id', id)
        .eq('scan_result', 'success')
        .gte('scanned_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Calculate hourly breakdown
      const hourlyMap = new Map<number, number>();
      scans?.forEach(scan => {
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
        recentCheckins: scanLogs?.slice(0, 10) || [],
        hourlyCheckins,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [id, scanLogs]);

  // Real-time subscription for scan logs
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('checkin-updates')
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
      .subscribe();

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
            <h1 className="text-2xl font-bold text-foreground">Check-in Dashboard</h1>
            {event && (
              <p className="text-muted-foreground">
                {event.title} • {event.venue}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchStats}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Link to={`/org/events/${id}/scan`}>
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
              <CardTitle>Recent Check-ins</CardTitle>
              <CardDescription>Live feed of latest check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : scanLogs && scanLogs.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {scanLogs.slice(0, 15).map((scan: any) => (
                    <div 
                      key={scan.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${scan.scan_result === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium">
                            {scan.tickets?.ticket_types?.name || 'Standard Ticket'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(scan.scanned_at), 'HH:mm:ss')}
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
