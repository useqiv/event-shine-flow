import React from 'react';
import InfluencerLayout from '@/components/layout/InfluencerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInfluencerLinks, useInfluencerStats } from '@/hooks/useInfluencerPortal';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/components/ui/currency-selector';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const InfluencerEarnings = () => {
  const { data: links, isLoading } = useInfluencerLinks();
  const { data: stats, isLoading: statsLoading } = useInfluencerStats();

  const totalConversions = (links || []).reduce((acc: number, link: any) => acc + (link.total_conversions || 0), 0);

  return (
    <InfluencerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Earnings</h1>
          <p className="text-muted-foreground">Detailed breakdown of your earnings by link</p>
        </div>

        {/* Summary Cards by Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsLoading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : stats?.balances_by_currency && stats.balances_by_currency.length > 0 ? (
            stats.balances_by_currency.map((balance) => (
              <Card key={balance.currency}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Earnings ({balance.currency})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(balance.total_commission, balance.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {formatCurrency(balance.available_balance, balance.currency)}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No earnings yet
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{totalConversions}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Earnings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings by Link</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : links && links.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link: any) => {
                    const currency = link.commission_currency || link.events?.currency || link.contests?.vote_currency || 'NGN';
                    return (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">{link.name}</TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">{link.code}</code>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium bg-muted px-2 py-1 rounded">{currency}</span>
                        </TableCell>
                        <TableCell className="text-right">{link.total_clicks}</TableCell>
                        <TableCell className="text-right">{link.total_conversions}</TableCell>
                        <TableCell className="text-right">
                          {link.commission_value}{link.commission_type === 'percentage' ? '%' : ` ${currency}`}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {formatCurrency(link.total_commission || 0, currency)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No earnings yet. Start sharing your links to earn commissions!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </InfluencerLayout>
  );
};

export default InfluencerEarnings;
