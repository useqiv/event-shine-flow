import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Database, 
  Server, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  HardDrive,
  Globe
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: Date;
}

const AdminSystemHealth: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [responseHistory, setResponseHistory] = useState<{ time: string; db: number; api: number }[]>([]);

  // Check database health
  const { data: dbHealth, refetch: refetchDb } = useQuery({
    queryKey: ['system-health-db'],
    queryFn: async () => {
      const start = performance.now();
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        const responseTime = performance.now() - start;
        return {
          status: error ? 'down' : responseTime > 500 ? 'degraded' : 'healthy',
          responseTime: Math.round(responseTime),
          lastChecked: new Date(),
        } as HealthMetric;
      } catch {
        return { status: 'down', responseTime: 0, lastChecked: new Date() } as HealthMetric;
      }
    },
    refetchInterval: 30000,
  });

  // Check auth service health
  const { data: authHealth, refetch: refetchAuth } = useQuery({
    queryKey: ['system-health-auth'],
    queryFn: async () => {
      const start = performance.now();
      try {
        const { error } = await supabase.auth.getSession();
        const responseTime = performance.now() - start;
        return {
          status: error ? 'down' : responseTime > 500 ? 'degraded' : 'healthy',
          responseTime: Math.round(responseTime),
          lastChecked: new Date(),
        } as HealthMetric;
      } catch {
        return { status: 'down', responseTime: 0, lastChecked: new Date() } as HealthMetric;
      }
    },
    refetchInterval: 30000,
  });

  // Fetch error counts from recent activity
  const { data: errorStats } = useQuery({
    queryKey: ['system-error-stats'],
    queryFn: async () => {
      // Get fraud alerts as proxy for system errors
      const { count: fraudCount } = await supabase
        .from('fraud_alerts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get failed content moderation as proxy
      const { count: moderationCount } = await supabase
        .from('content_moderation')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      return {
        fraudAlerts: fraudCount || 0,
        rejectedContent: moderationCount || 0,
        total: (fraudCount || 0) + (moderationCount || 0),
      };
    },
  });

  // Get database statistics
  const { data: dbStats } = useQuery({
    queryKey: ['system-db-stats'],
    queryFn: async () => {
      const [profiles, contests, events, votes, tickets] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('contests').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('votes').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
      ]);

      return {
        users: profiles.count || 0,
        contests: contests.count || 0,
        events: events.count || 0,
        votes: votes.count || 0,
        tickets: tickets.count || 0,
      };
    },
  });

  // Update response history
  useEffect(() => {
    if (dbHealth && authHealth) {
      setResponseHistory(prev => {
        const newEntry = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          db: dbHealth.responseTime,
          api: authHealth.responseTime,
        };
        const updated = [...prev, newEntry].slice(-20);
        return updated;
      });
    }
  }, [dbHealth?.responseTime, authHealth?.responseTime]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchDb(), refetchAuth()]);
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-500">Operational</Badge>;
      case 'degraded': return <Badge className="bg-yellow-500">Degraded</Badge>;
      case 'down': return <Badge variant="destructive">Down</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const overallStatus = () => {
    if (!dbHealth || !authHealth) return 'unknown';
    if (dbHealth.status === 'down' || authHealth.status === 'down') return 'down';
    if (dbHealth.status === 'degraded' || authHealth.status === 'degraded') return 'degraded';
    return 'healthy';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">System Health</h1>
            <p className="text-muted-foreground">Monitor system performance and status</p>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Overall Status */}
        <Card className={`border-2 ${
          overallStatus() === 'healthy' ? 'border-green-500' :
          overallStatus() === 'degraded' ? 'border-yellow-500' :
          'border-red-500'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                  overallStatus() === 'healthy' ? 'bg-green-100 dark:bg-green-900/30' :
                  overallStatus() === 'degraded' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {overallStatus() === 'healthy' ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : overallStatus() === 'degraded' ? (
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {overallStatus() === 'healthy' ? 'All Systems Operational' :
                     overallStatus() === 'degraded' ? 'Some Systems Degraded' :
                     'System Issues Detected'}
                  </h2>
                  <p className="text-muted-foreground">
                    Last updated: {dbHealth?.lastChecked.toLocaleTimeString() || 'Never'}
                  </p>
                </div>
              </div>
              {getStatusBadge(overallStatus())}
            </div>
          </CardContent>
        </Card>

        {/* Service Status Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Database */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database
                </CardTitle>
                {dbHealth && getStatusBadge(dbHealth.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className={`font-medium ${
                    (dbHealth?.responseTime || 0) < 100 ? 'text-green-500' :
                    (dbHealth?.responseTime || 0) < 500 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {dbHealth?.responseTime || 0}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, ((dbHealth?.responseTime || 0) / 500) * 100)} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Auth Service */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Auth Service
                </CardTitle>
                {authHealth && getStatusBadge(authHealth.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className={`font-medium ${
                    (authHealth?.responseTime || 0) < 100 ? 'text-green-500' :
                    (authHealth?.responseTime || 0) < 500 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {authHealth?.responseTime || 0}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, ((authHealth?.responseTime || 0) / 500) * 100)} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Error Rate */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alerts (24h)
                </CardTitle>
                <Badge variant={errorStats?.total === 0 ? 'outline' : 'destructive'}>
                  {errorStats?.total || 0} issues
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fraud Alerts</span>
                  <span>{errorStats?.fraudAlerts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rejected Content</span>
                  <span>{errorStats?.rejectedContent || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Response Time History
            </CardTitle>
            <CardDescription>Real-time API response times</CardDescription>
          </CardHeader>
          <CardContent>
            {responseHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={responseHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis unit="ms" className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="db" 
                    name="Database" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="api" 
                    name="Auth API" 
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2) / 0.2)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Collecting response time data...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Database Statistics
            </CardTitle>
            <CardDescription>Current record counts across tables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{dbStats?.users?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Users</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{dbStats?.contests?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Contests</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{dbStats?.events?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Events</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{dbStats?.votes?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Votes</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{dbStats?.tickets?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSystemHealth;
