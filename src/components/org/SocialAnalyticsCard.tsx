import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Line, Area, AreaChart } from "recharts";
import { Activity, Share2, CheckCircle, XCircle, MousePointerClick, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { format, subDays } from "date-fns";

interface SocialAnalyticsCardProps {
  contestId: string;
  organizationId: string;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  trend?: string;
  trendUp?: boolean;
  iconBg: string;
}

const StatCard = ({ icon: Icon, label, value, trend, trendUp, iconBg }: StatCardProps) => (
  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/50 overflow-hidden group hover:shadow-lg transition-all duration-300">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-destructive'}`}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
    </div>
  </div>
);

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
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-4 w-60 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-2xl animate-pulse" />
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
  const successRate = totalPosts > 0 ? Math.round((successfulPosts / totalPosts) * 100) : 0;

  // Platform breakdown
  const platformData = logs.reduce((acc, log) => {
    const platform = log.platform;
    if (!acc[platform]) {
      acc[platform] = { name: platform.charAt(0).toUpperCase() + platform.slice(1), posts: 0, clicks: 0 };
    }
    acc[platform].posts += 1;
    acc[platform].clicks += log.engagement_clicks || 0;
    return acc;
  }, {} as Record<string, { name: string; posts: number; clicks: number }>);

  const platformChartData = Object.values(platformData);

  // Post type breakdown
  const postTypeData = logs.reduce((acc, log) => {
    const type = log.post_type.replace(/_/g, ' ');
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
    const dayClicks = logs.filter(l => 
      format(new Date(l.posted_at), 'yyyy-MM-dd') === dateStr
    ).reduce((sum, l) => sum + (l.engagement_clicks || 0), 0);
    return {
      date: format(date, 'EEE'),
      fullDate: format(date, 'MMM d'),
      posts: dayPosts,
      clicks: dayClicks,
    };
  });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-xl p-3">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs text-muted-foreground">
              {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Social Analytics</CardTitle>
              <CardDescription className="mt-1">
                Track your social media performance
              </CardDescription>
            </div>
          </div>
          {totalPosts > 0 && (
            <Badge className="bg-primary/10 text-primary border-0 px-3 py-1">
              {successRate}% Success Rate
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={Share2} 
            label="Total Posts" 
            value={totalPosts}
            iconBg="bg-gradient-to-br from-primary to-primary/80"
          />
          <StatCard 
            icon={CheckCircle} 
            label="Successful" 
            value={successfulPosts}
            trend={totalPosts > 0 ? `${successRate}% rate` : undefined}
            trendUp={successRate >= 80}
            iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <StatCard 
            icon={XCircle} 
            label="Failed" 
            value={failedPosts}
            iconBg="bg-gradient-to-br from-destructive to-destructive/80"
          />
          <StatCard 
            icon={MousePointerClick} 
            label="Total Clicks" 
            value={totalClicks}
            iconBg="bg-gradient-to-br from-accent to-accent/80"
          />
        </div>

        {/* Charts */}
        {logs.length > 0 ? (
          <div className="space-y-8">
            {/* Activity Chart */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-muted/30 to-transparent border border-border/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="font-semibold text-foreground">Posting Activity</h4>
                  <p className="text-sm text-muted-foreground">Posts & clicks over the last 7 days</p>
                </div>
                <Badge variant="outline" className="gap-1.5">
                  <Clock className="h-3 w-3" />
                  Last 7 days
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={last7Days}>
                  <defs>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="posts" 
                    name="Posts"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2.5}
                    fill="url(#colorPosts)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    name="Clicks"
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 0, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Platform breakdown */}
              {platformChartData.length > 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-muted/30 to-transparent border border-border/50">
                  <h4 className="font-semibold text-foreground mb-6">Posts by Platform</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={platformChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={true} vertical={false} />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="posts" name="Posts" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Post type breakdown */}
              {postTypeChartData.length > 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-muted/30 to-transparent border border-border/50">
                  <h4 className="font-semibold text-foreground mb-6">Posts by Type</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={postTypeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="name"
                      >
                        {postTypeChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {postTypeChartData.slice(0, 4).map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-muted-foreground capitalize">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Share2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Start posting to your social media accounts to see analytics and engagement data here.
            </p>
          </div>
        )}

        {/* Recent Posts */}
        {logs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Recent Activity</h4>
              <Badge variant="outline" className="text-xs">{logs.length} posts</Badge>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {logs.slice(0, 8).map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      log.status === 'success' ? 'bg-emerald-500' : 'bg-destructive'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {log.platform} • {log.post_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.posted_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                  {log.status === 'failed' && log.error_message && (
                    <span className="text-xs text-destructive max-w-[180px] truncate">
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