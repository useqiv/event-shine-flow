import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePromoCodes } from '@/hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Tag, Users, DollarSign, Percent, Clock, ShoppingCart } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

export const PromoCodeAnalytics = () => {
  const { data: promoCodes, isLoading } = usePromoCodes();
  
  // Fetch detailed usage data
  const { data: usageData, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['promo-code-usage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_code_usage')
        .select(`
          *,
          promo_codes (code, discount_type, discount_value)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!promoCodes || promoCodes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No promo codes found. Create your first promo code to see analytics.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate analytics from usage data (more accurate)
  const totalDiscountGiven = usageData?.reduce((sum: number, u: any) => sum + Number(u.discount_amount || 0), 0) || 0;
  const totalOrderValue = usageData?.reduce((sum: number, u: any) => sum + Number(u.order_amount || 0), 0) || 0;
  
  // Calculate analytics from promo codes
  const totalCodes = promoCodes.length;
  const activeCodes = promoCodes.filter((p: any) => p.is_active).length;
  const totalRedemptions = usageData?.length || promoCodes.reduce((sum: number, p: any) => sum + (p.current_uses || 0), 0);
  
  // Calculate redemption rate for codes with max_uses
  const codesWithLimit = promoCodes.filter((p: any) => p.max_uses);
  const avgRedemptionRate = codesWithLimit.length > 0
    ? codesWithLimit.reduce((sum: number, p: any) => sum + ((p.current_uses / p.max_uses) * 100), 0) / codesWithLimit.length
    : 0;

  // Prepare usage over time data (last 14 days)
  const usageByDay = Array.from({ length: 14 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 13 - i));
    const dayUsage = usageData?.filter((u: any) => {
      const usageDate = startOfDay(new Date(u.created_at));
      return usageDate.getTime() === date.getTime();
    }) || [];
    
    return {
      date: format(date, 'MMM dd'),
      uses: dayUsage.length,
      discount: dayUsage.reduce((sum: number, u: any) => sum + Number(u.discount_amount || 0), 0),
    };
  });

  // Prepare data for charts
  const codeUsageData = promoCodes
    .filter((p: any) => p.current_uses > 0)
    .sort((a: any, b: any) => b.current_uses - a.current_uses)
    .slice(0, 10)
    .map((p: any) => ({
      code: p.code,
      uses: p.current_uses,
      maxUses: p.max_uses || 'Unlimited',
    }));

  const discountTypeData = [
    { name: 'Percentage', value: promoCodes.filter((p: any) => p.discount_type === 'percentage').length },
    { name: 'Fixed', value: promoCodes.filter((p: any) => p.discount_type === 'fixed').length },
  ].filter(d => d.value > 0);

  const applicableToData = [
    { name: 'All', value: promoCodes.filter((p: any) => p.applicable_to === 'all').length },
    { name: 'Events', value: promoCodes.filter((p: any) => p.applicable_to === 'events').length },
    { name: 'Contests', value: promoCodes.filter((p: any) => p.applicable_to === 'contests').length },
  ].filter(d => d.value > 0);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Codes</p>
                <p className="text-2xl font-bold">{totalCodes}</p>
              </div>
              <Tag className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeCodes} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Redemptions</p>
                <p className="text-2xl font-bold">{totalRedemptions}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isLoadingUsage ? 'Loading...' : `From ${usageData?.length || 0} tracked uses`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Redemption Rate</p>
                <p className="text-2xl font-bold">{avgRedemptionRate.toFixed(1)}%</p>
              </div>
              <Percent className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              For codes with limits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Discount Given</p>
                <p className="text-2xl font-bold">₦{totalDiscountGiven.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              On ₦{totalOrderValue.toLocaleString()} orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Codes by Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Codes by Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {codeUsageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={codeUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="code" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="uses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No redemptions yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution Charts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Code Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground text-center mb-2">By Discount Type</p>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={discountTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="value"
                      label={({ name }) => name}
                    >
                      {discountTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-center mb-2">By Applicable To</p>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={applicableToData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="value"
                      label={({ name }) => name}
                    >
                      {applicableToData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Code Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Code Performance</CardTitle>
          <CardDescription>Redemption progress for each promo code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {promoCodes.slice(0, 10).map((promo: any) => {
              const redemptionRate = promo.max_uses 
                ? (promo.current_uses / promo.max_uses) * 100 
                : null;
              
              return (
                <div key={promo.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{promo.code}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {promo.discount_type === 'percentage' 
                          ? `${promo.discount_value}% off` 
                          : `₦${promo.discount_value} off`}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{promo.current_uses}</span>
                      <span className="text-muted-foreground">
                        {promo.max_uses ? ` / ${promo.max_uses}` : ' uses'}
                      </span>
                    </div>
                  </div>
                  {redemptionRate !== null && (
                    <Progress value={redemptionRate} className="h-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Usage Over Time (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={usageByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="uses" stroke="hsl(var(--primary))" name="Uses" />
              <Line yAxisId="right" type="monotone" dataKey="discount" stroke="hsl(var(--secondary))" name="Discount (₦)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Usage Table */}
      {usageData && usageData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Promo Code Usage
            </CardTitle>
            <CardDescription>Detailed tracking of recent redemptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Order</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Final</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageData.slice(0, 20).map((usage: any) => (
                    <TableRow key={usage.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {usage.promo_codes?.code || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {usage.email || 'Guest'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={usage.order_type === 'ticket' ? 'default' : 'secondary'}>
                          {usage.order_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ₦{Number(usage.order_amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        -₦{Number(usage.discount_amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₦{Number(usage.final_amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(usage.created_at), 'MMM dd, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
