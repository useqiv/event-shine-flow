import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useRevenueTrends } from '@/hooks/useRevenueTrends';
import { formatCurrency, getCurrencySymbol, currencies } from '@/components/ui/currency-selector';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, LineChart, Calendar, Download, Loader2 } from 'lucide-react';
import { exportRevenuePdf } from '@/lib/exportPdf';
import { toast } from 'sonner';

interface AdvancedRevenueChartProps {
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
  companyName?: string;
  commissionRate?: number;
}

const dateRanges = [
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

const AdvancedRevenueChart = ({ currency, onCurrencyChange, companyName = 'Your Organization', commissionRate = 10 }: AdvancedRevenueChartProps) => {
  const [displayCurrency, setDisplayCurrency] = useState<string>(currency || 'NGN');
  const [dateRange, setDateRange] = useState<number>(30);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: currentTrends, isLoading: currentLoading } = useRevenueTrends(dateRange, displayCurrency);
  const { data: previousTrends } = useRevenueTrends(dateRange * 2, displayCurrency);
  
  const currencySymbol = getCurrencySymbol(displayCurrency);

  const handleCurrencyChange = (value: string) => {
    setDisplayCurrency(value);
    onCurrencyChange?.(value);
  };

  // Calculate comparison metrics
  const currentTotal = currentTrends?.reduce((sum, day) => sum + day.total, 0) || 0;
  const ticketTotal = currentTrends?.reduce((sum, day) => sum + day.tickets, 0) || 0;
  const voteTotal = currentTrends?.reduce((sum, day) => sum + day.votes, 0) || 0;
  const netRevenue = currentTotal * (1 - commissionRate / 100);
  
  const previousPeriodData = previousTrends?.slice(0, dateRange) || [];
  const previousTotal = previousPeriodData.reduce((sum, day) => sum + day.total, 0);
  const growthPercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  const isPositiveGrowth = growthPercent >= 0;

  const handleExportPdf = () => {
    if (!currentTrends || currentTrends.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    setIsExporting(true);
    try {
      exportRevenuePdf({
        data: currentTrends,
        currency: displayCurrency,
        dateRange,
        companyName,
        totalRevenue: currentTotal,
        ticketRevenue: ticketTotal,
        voteRevenue: voteTotal,
        netRevenue,
        commissionRate,
      });
      toast.success('PDF report generated');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  if (currentLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = currentTotal > 0;

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Revenue Analytics
            </CardTitle>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* PDF Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={isExporting || !hasData}
                className="h-7 sm:h-8 px-2 sm:px-3"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                <span className="ml-1 hidden sm:inline">PDF</span>
              </Button>
              
              {/* Chart Type Toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={chartType === 'area' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-none h-7 sm:h-8 w-7 sm:w-8 p-0"
                  onClick={() => setChartType('area')}
                >
                  <LineChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-none h-7 sm:h-8 w-7 sm:w-8 p-0"
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
              
              {/* Date Range Selector */}
              <Select value={dateRange.toString()} onValueChange={(v) => setDateRange(parseInt(v))}>
                <SelectTrigger className="w-[80px] sm:w-[110px] h-7 sm:h-8 text-xs sm:text-sm">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 flex-shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value.toString()}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Currency Selector */}
              <Select value={displayCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-[70px] sm:w-[100px] h-7 sm:h-8 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-secondary/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-sm sm:text-lg font-bold truncate">{formatCurrency(currentTotal, displayCurrency)}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-secondary/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Ticket Sales</p>
              <p className="text-sm sm:text-lg font-bold truncate">{formatCurrency(ticketTotal, displayCurrency)}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-secondary/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Vote Revenue</p>
              <p className="text-sm sm:text-lg font-bold truncate">{formatCurrency(voteTotal, displayCurrency)}</p>
            </div>
            <div className={`p-2 sm:p-3 rounded-lg ${isPositiveGrowth ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <p className="text-[10px] sm:text-xs text-muted-foreground">vs Previous</p>
              <div className="flex items-center gap-1">
                {isPositiveGrowth ? (
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                )}
                <p className={`text-sm sm:text-lg font-bold ${isPositiveGrowth ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositiveGrowth ? '+' : ''}{growthPercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[220px] sm:h-[280px] w-full min-w-0 -mx-1 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={currentTrends} margin={{ top: 10, right: 4, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ticketGradientAdv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="voteGradientAdv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                    tickFormatter={(value) => `${currencySymbol}${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value, displayCurrency),
                      name === 'tickets' ? 'Ticket Sales' : 'Vote Revenue'
                    ]}
                  />
                  <Legend formatter={(value) => value === 'tickets' ? 'Ticket Sales' : 'Vote Revenue'} />
                  <Area
                    type="monotone"
                    dataKey="tickets"
                    stroke="hsl(var(--primary))"
                    fill="url(#ticketGradientAdv)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="votes"
                    stroke="hsl(var(--chart-2))"
                    fill="url(#voteGradientAdv)"
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <BarChart data={currentTrends} margin={{ top: 10, right: 4, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                    tickFormatter={(value) => `${currencySymbol}${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value, displayCurrency),
                      name === 'tickets' ? 'Ticket Sales' : 'Vote Revenue'
                    ]}
                  />
                  <Legend formatter={(value) => value === 'tickets' ? 'Ticket Sales' : 'Vote Revenue'} />
                  <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="votes" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No revenue data in {displayCurrency} for the last {dateRange} days</p>
              <p className="text-sm">Start selling tickets and votes to see trends</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedRevenueChart;