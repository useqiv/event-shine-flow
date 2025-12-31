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
              <CardTitle className="text-sm font-medium">Active Links</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {linksLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{links?.filter((l: any) => l.is_active).length || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Multi-Currency Balances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Earnings by Currency
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : stats?.balances_by_currency && stats.balances_by_currency.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.balances_by_currency.map((balance) => (
                  <div key={balance.currency} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">{balance.currency}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Earned</span>
                        <span className="font-medium">{formatCurrency(balance.total_commission, balance.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pending</span>
                        <span className="text-yellow-600">{formatCurrency(balance.pending_payout, balance.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid</span>
                        <span>{formatCurrency(balance.paid_earnings, balance.currency)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">Available</span>
                        <span className="font-bold text-green-600">{formatCurrency(balance.available_balance, balance.currency)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No earnings yet</p>
            )}
          </CardContent>
        </Card>

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
                        <span className="ml-2 text-xs">({link.commission_currency || link.events?.currency || link.contests?.vote_currency || 'NGN'})</span>
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
                        {formatCurrency(link.total_commission || 0, link.commission_currency || link.events?.currency || link.contests?.vote_currency || 'NGN')} earned
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
