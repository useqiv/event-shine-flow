import React from 'react';
import InfluencerLayout from '@/components/layout/InfluencerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInfluencerStats, useInfluencerLinks } from '@/hooks/useInfluencerPortal';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2, MousePointerClick, ShoppingCart, DollarSign, Wallet, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/components/ui/currency-selector';

const InfluencerDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useInfluencerStats();
  const { data: links, isLoading: linksLoading } = useInfluencerLinks();

  const conversionRate = stats?.total_clicks 
    ? ((stats.total_conversions / stats.total_clicks) * 100).toFixed(1)
    : '0';

  return (
    <InfluencerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Track your performance and earnings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total_clicks?.toLocaleString() || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.total_conversions?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">{conversionRate}% conversion rate</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.total_revenue || 0, 'USD')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(stats?.total_commission || 0, 'USD')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.available_balance || 0, 'USD')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Links</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {linksLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{links?.filter(l => l.is_active).length || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Links */}
        <Card>
          <CardHeader>
            <CardTitle>Your Links</CardTitle>
          </CardHeader>
          <CardContent>
            {linksLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : links && links.length > 0 ? (
              <div className="space-y-4">
                {links.slice(0, 5).map((link: any) => (
                  <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{link.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Code: <span className="font-mono bg-muted px-2 py-0.5 rounded">{link.code}</span>
                      </p>
                      {link.contests?.title && (
                        <p className="text-xs text-muted-foreground">Contest: {link.contests.title}</p>
                      )}
                      {link.events?.title && (
                        <p className="text-xs text-muted-foreground">Event: {link.events.title}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        <span className="font-medium">{link.total_clicks}</span> clicks
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">{link.total_conversions}</span> conversions
                      </p>
                      <p className="text-sm text-primary font-medium">
                        {formatCurrency(link.total_commission || 0, 'USD')} earned
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No links assigned yet. Contact an organization to get your influencer code.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </InfluencerLayout>
  );
};

export default InfluencerDashboard;
