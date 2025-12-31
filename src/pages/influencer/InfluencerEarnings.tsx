import React from 'react';
import InfluencerLayout from '@/components/layout/InfluencerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInfluencerLinks } from '@/hooks/useInfluencerPortal';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/components/ui/currency-selector';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const InfluencerEarnings = () => {
  const { data: links, isLoading } = useInfluencerLinks();

  const totalEarnings = (links || []).reduce((acc: number, link: any) => acc + Number(link.total_commission || 0), 0);
  const totalRevenue = (links || []).reduce((acc: number, link: any) => acc + Number(link.total_revenue || 0), 0);
  const totalConversions = (links || []).reduce((acc: number, link: any) => acc + (link.total_conversions || 0), 0);

  return (
    <InfluencerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Earnings</h1>
          <p className="text-muted-foreground">Detailed breakdown of your earnings by link</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue Generated</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue, 'USD')}</p>
              )}
            </CardContent>
          </Card>

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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalEarnings, 'USD')}</p>
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
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link: any) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{link.name}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">{link.code}</code>
                      </TableCell>
                      <TableCell className="text-right">{link.total_clicks}</TableCell>
                      <TableCell className="text-right">{link.total_conversions}</TableCell>
                      <TableCell className="text-right">{formatCurrency(link.total_revenue || 0, 'USD')}</TableCell>
                      <TableCell className="text-right">
                        {link.commission_value}{link.commission_type === 'percentage' ? '%' : ' (fixed)'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(link.total_commission || 0, 'USD')}
                      </TableCell>
                    </TableRow>
                  ))}
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
