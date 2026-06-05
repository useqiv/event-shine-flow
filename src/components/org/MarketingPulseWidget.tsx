import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSocialPostLogs, type SocialPostLog } from '@/hooks/useSocialPostLogs';
import { useOrganizationContests, useOrganizationEvents } from '@/hooks/useOrganization';
import { resolveMarketingHref } from '@/hooks/useOrgOnboardingProgress';
import {
  Megaphone,
  MousePointerClick,
  Eye,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { format, subDays } from 'date-fns';

function computePulseStats(postLogs: SocialPostLog[]) {
  const weekAgo = subDays(new Date(), 7);
  const recent = postLogs.filter((p) => new Date(p.posted_at) >= weekAgo);

  const postsThisWeek = recent.length;
  const clicks = recent.reduce((sum, p) => sum + (p.engagement_clicks || 0), 0);
  const impressions = recent.reduce((sum, p) => sum + (p.engagement_impressions || 0), 0);
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
  const successRate =
    recent.length > 0
      ? (recent.filter((p) => p.status === 'success').length / recent.length) * 100
      : null;

  const platformCounts = recent.reduce<Record<string, number>>((acc, log) => {
    acc[log.platform] = (acc[log.platform] || 0) + 1;
    return acc;
  }, {});

  const topPlatformEntry = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];
  const topPlatform = topPlatformEntry?.[0] ?? null;
  const topPlatformPosts = topPlatformEntry?.[1] ?? 0;

  const latestPost = postLogs[0];

  return {
    postsThisWeek,
    clicks,
    impressions,
    ctr,
    successRate,
    topPlatform,
    topPlatformPosts,
    latestPost,
    hasData: postLogs.length > 0,
  };
}

const MarketingPulseWidget = () => {
  const { data: postLogs, isLoading } = useSocialPostLogs();
  const { data: contests } = useOrganizationContests();
  const { data: events } = useOrganizationEvents();

  const marketingHref = resolveMarketingHref(contests, events);

  const stats = useMemo(
    () => computePulseStats(postLogs || []),
    [postLogs],
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats.hasData) {
    return (
      <Card>
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Megaphone className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Marketing Pulse
          </CardTitle>
          <CardDescription>
            Track social posts, clicks, and reach across your contests and events
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-center py-6">
            <Share2 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
            <p className="text-sm font-medium mb-1">No social activity yet</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              Connect your accounts and post from a contest or event marketing page to see
              performance here.
            </p>
            <Button asChild size="sm">
              <Link to={marketingHref}>Set Up Marketing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Megaphone className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              Marketing Pulse
            </CardTitle>
            <CardDescription>Last 7 days of social media activity</CardDescription>
          </div>
          <Link to="/org/marketing" className="shrink-0">
            <Button variant="ghost" size="sm" className="h-8 text-xs sm:text-sm gap-1">
              Full Analytics
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs">Posts</span>
            </div>
            <p className="text-lg sm:text-xl font-bold">{stats.postsThisWeek}</p>
            <p className="text-[10px] text-muted-foreground">this week</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MousePointerClick className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs">CTR</span>
            </div>
            <p className="text-lg sm:text-xl font-bold">
              {stats.ctr != null ? `${stats.ctr.toFixed(1)}%` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {stats.clicks.toLocaleString()} clicks
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs">Impressions</span>
            </div>
            <p className="text-lg sm:text-xl font-bold">{stats.impressions.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">this week</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-[10px] sm:text-xs">Success</span>
            </div>
            <p className="text-lg sm:text-xl font-bold">
              {stats.successRate != null ? `${stats.successRate.toFixed(0)}%` : '—'}
            </p>
            {stats.topPlatform && (
              <p className="text-[10px] text-muted-foreground capitalize truncate">
                Top: {stats.topPlatform} ({stats.topPlatformPosts})
              </p>
            )}
          </div>
        </div>

        {stats.latestPost && (
          <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-secondary/20">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Latest post</p>
              <p className="text-sm font-medium truncate">
                {(stats.latestPost.contests as { title?: string } | null)?.title || 'Promotion'}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.latestPost.platform} ·{' '}
                {format(new Date(stats.latestPost.posted_at), 'MMM d, h:mm a')}
              </p>
            </div>
            <Badge
              variant={stats.latestPost.status === 'success' ? 'default' : 'destructive'}
              className="shrink-0 capitalize text-[10px]"
            >
              {stats.latestPost.status}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketingPulseWidget;
