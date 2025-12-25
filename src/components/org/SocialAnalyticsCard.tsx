import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Activity, TrendingUp, Share2, CheckCircle, XCircle } from "lucide-react";
import { format, subDays } from "date-fns";

interface SocialAnalyticsCardProps {
  contestId: string;
  organizationId: string;
}

export const SocialAnalyticsCard = ({ contestId, organizationId }: SocialAnalyticsCardProps) => {
  const { data: postLogs, isLoading } = useQuery({
    queryKey: ['social-post-logs', contestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_post_logs')
        .select('*')
        .eq('contest_id', contestId)
        .order('posted_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Social Media Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const logs = postLogs || [];
  
  // Calculate stats
  const totalPosts = logs.length;
  const successfulPosts = logs.filter(l => l.status === 'success').length;
  const failedPosts = logs.filter(l => l.status === 'failed').length;
  const totalClicks = logs.reduce((sum, l) => sum + (l.engagement_clicks || 0), 0);
  const totalImpressions = logs.reduce((sum, l) => sum + (l.engagement_impressions || 0), 0);

  // Platform breakdown
  const platformData = logs.reduce((acc, log) => {
    const platform = log.platform;
    if (!acc[platform]) {
      acc[platform] = { name: platform, posts: 0, clicks: 0 };
    }
    acc[platform].posts += 1;
    acc[platform].clicks += log.engagement_clicks || 0;
    return acc;
  }, {} as Record<string, { name: string; posts: number; clicks: number }>);

  const platformChartData = Object.values(platformData);

  // Post type breakdown
  const postTypeData = logs.reduce((acc, log) => {
    const type = log.post_type;
    if (!acc[type]) {
      acc[type] = { name: type, count: 0 };
    }
    acc[type].count += 1;
    return acc;
  }, {} as Record<string, { name: string; count: number }>);

  const postTypeChartData = Object.values(postTypeData);

  // Daily posts (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayPosts = logs.filter(l => 
      format(new Date(l.posted_at), 'yyyy-MM-dd') === dateStr
    ).length;
    return {
      date: format(date, 'MMM d'),
      posts: dayPosts,
    };
  });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Social Media Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Share2 className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{totalPosts}</p>
            <p className="text-sm text-muted-foreground">Total Posts</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{successfulPosts}</p>
            <p className="text-sm text-muted-foreground">Successful</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <XCircle className="h-6 w-6 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold">{failedPosts}</p>
            <p className="text-sm text-muted-foreground">Failed</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-chart-2" />
            <p className="text-2xl font-bold">{totalClicks}</p>
            <p className="text-sm text-muted-foreground">Total Clicks</p>
          </div>
        </div>

        {/* Charts */}
        {logs.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Posts over time */}
            <div>
              <h4 className="font-medium mb-3">Posts (Last 7 Days)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="posts" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Platform breakdown */}
            <div>
              <h4 className="font-medium mb-3">Posts by Platform</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={platformChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="posts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Post type breakdown */}
            {postTypeChartData.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Posts by Type</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={postTypeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, count }) => `${name}: ${count}`}
                    >
                      {postTypeChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No social media posts yet</p>
            <p className="text-sm">Start posting to see analytics</p>
          </div>
        )}

        {/* Recent Posts */}
        {logs.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Recent Posts</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.slice(0, 10).map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.status === 'success' ? 'bg-green-500' : 'bg-destructive'
                    }`} />
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {log.platform} - {log.post_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.posted_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  {log.status === 'failed' && log.error_message && (
                    <span className="text-xs text-destructive max-w-[200px] truncate">
                      {log.error_message}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
