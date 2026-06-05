import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSocialPostLogs } from '@/hooks/useSocialPostLogs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { BarChart3, TrendingUp, CheckCircle2, XCircle, MousePointerClick, Eye } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export const MarketingAnalyticsDashboard: React.FC = () => {
  const { data: postLogs, isLoading } = useSocialPostLogs();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!postLogs || postLogs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">No Social Media Analytics Yet</h3>
            <p className="text-muted-foreground">
              Start posting to your social media accounts to see analytics here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats
  const totalPosts = postLogs.length;
  const successfulPosts = postLogs.filter(p => p.status === 'success').length;
  const failedPosts = postLogs.filter(p => p.status === 'failed').length;
  const totalClicks = postLogs.reduce((sum, p) => sum + (p.engagement_clicks || 0), 0);
  const totalImpressions = postLogs.reduce((sum, p) => sum + (p.engagement_impressions || 0), 0);

  // Platform breakdown
  const platformData = postLogs.reduce((acc, log) => {
    const platform = log.platform;
    if (!acc[platform]) acc[platform] = { name: platform, posts: 0, successful: 0 };
    acc[platform].posts++;
    if (log.status === 'success') acc[platform].successful++;
    return acc;
  }, {} as Record<string, { name: string; posts: number; successful: number }>);

  // Post type breakdown
  const postTypeData = postLogs.reduce((acc, log) => {
    const type = log.post_type;
    if (!acc[type]) acc[type] = { name: type, count: 0 };
    acc[type].count++;
    return acc;
  }, {} as Record<string, { name: string; count: number }>);

  // Contest breakdown
  const contestData = postLogs.reduce((acc, log) => {
    const title = (log.contests as any)?.title || 'Unknown';
    if (!acc[title]) acc[title] = { name: title, posts: 0 };
    acc[title].posts++;
    return acc;
  }, {} as Record<string, { name: string; posts: number }>);

  // Last 14 days trend
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 13 - i));
    const dateStr = format(date, 'MMM d');
    const count = postLogs.filter(log => 
      format(startOfDay(new Date(log.posted_at)), 'MMM d') === dateStr
    ).length;
    return { date: dateStr, posts: count };
  });

  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalPosts}</p>
                <p className="text-xs text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{successfulPosts}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{failedPosts}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MousePointerClick className="h-8 w-8 text-chart-2" />
              <div>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-chart-3" />
              <div>
                <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Impressions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Posts Over Time (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={last14Days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="posts" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Posts by Platform */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Posts by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={Object.values(platformData)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="posts" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="successful" name="Successful" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Posts by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.values(postTypeData)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  label={(entry) => entry.name}
                >
                  {Object.values(postTypeData).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Contests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Posts by Contest</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={Object.values(contestData).slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="posts" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Posts</CardTitle>
          <CardDescription>Last 10 social media posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {postLogs.slice(0, 10).map((log) => (
              <div 
                key={log.id} 
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-destructive'}`} />
                  <div>
                    <p className="text-sm font-medium">
                      {(log.contests as any)?.title || 'Unknown Contest'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.platform} • {log.post_type} • {format(new Date(log.posted_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
                {log.status === 'failed' && (
                  <span className="text-xs text-destructive">{log.error_message || 'Failed'}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
