import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { useRevenueTrends } from '@/hooks/useRevenueTrends';
import { format, addDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/components/ui/currency-selector';

interface RevenueForecastWidgetProps {
  currency?: string;
}

interface ForecastData {
  date: string;
  actual?: number;
  forecast?: number;
  lower?: number;
  upper?: number;
}

const RevenueForecastWidget = ({ currency = 'USD' }: RevenueForecastWidgetProps) => {
  const { data: historicalData, isLoading } = useRevenueTrends(60, currency);

  const forecastData = useMemo(() => {
    if (!historicalData || historicalData.length < 7) return [];

    // Calculate trend using linear regression on the last 30 days
    const recentData = historicalData.slice(-30);
    const n = recentData.length;
    
    // Calculate averages
    const avgX = (n - 1) / 2;
    const avgY = recentData.reduce((sum, d) => sum + d.total, 0) / n;
    
    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    recentData.forEach((d, i) => {
      numerator += (i - avgX) * (d.total - avgY);
      denominator += (i - avgX) ** 2;
    });
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = avgY - slope * avgX;
    
    // Calculate standard deviation for confidence intervals
    const predictions = recentData.map((_, i) => intercept + slope * i);
    const residuals = recentData.map((d, i) => d.total - predictions[i]);
    const stdDev = Math.sqrt(residuals.reduce((sum, r) => sum + r ** 2, 0) / n);
    
    // Build combined data with historical and forecast
    const result: ForecastData[] = [];
    
    // Add last 14 days of actual data
    const last14Days = historicalData.slice(-14);
    last14Days.forEach((d) => {
      result.push({
        date: d.date,
        actual: d.total,
      });
    });
    
    // Add 14 days of forecast
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const forecastValue = Math.max(0, intercept + slope * (n + i - 1));
      const forecastDate = addDays(today, i);
      
      result.push({
        date: format(forecastDate, 'MMM d'),
        forecast: Math.round(forecastValue),
        lower: Math.max(0, Math.round(forecastValue - 1.96 * stdDev)),
        upper: Math.round(forecastValue + 1.96 * stdDev),
      });
    }
    
    return result;
  }, [historicalData]);

  const metrics = useMemo(() => {
    if (!historicalData || historicalData.length < 14) {
      return {
        weeklyGrowth: 0,
        monthlyProjection: 0,
        trend: 'stable' as const,
        confidence: 0,
      };
    }

    const last7Days = historicalData.slice(-7);
    const previous7Days = historicalData.slice(-14, -7);
    
    const lastWeekTotal = last7Days.reduce((sum, d) => sum + d.total, 0);
    const prevWeekTotal = previous7Days.reduce((sum, d) => sum + d.total, 0);
    
    const weeklyGrowth = prevWeekTotal > 0 
      ? ((lastWeekTotal - prevWeekTotal) / prevWeekTotal) * 100 
      : 0;
    
    // Project next 30 days based on recent average and growth
    const dailyAvg = lastWeekTotal / 7;
    const growthFactor = 1 + (weeklyGrowth / 100 / 7);
    let monthlyProjection = 0;
    for (let i = 0; i < 30; i++) {
      monthlyProjection += dailyAvg * (growthFactor ** i);
    }

    // Calculate confidence based on variance
    const last30Days = historicalData.slice(-30);
    const avg = last30Days.reduce((sum, d) => sum + d.total, 0) / last30Days.length;
    const variance = last30Days.reduce((sum, d) => sum + (d.total - avg) ** 2, 0) / last30Days.length;
    const coeffOfVariation = avg > 0 ? Math.sqrt(variance) / avg : 1;
    const confidence = Math.max(0, Math.min(100, 100 - coeffOfVariation * 100));

    return {
      weeklyGrowth,
      monthlyProjection: Math.round(monthlyProjection),
      trend: weeklyGrowth > 5 ? 'up' as const : weeklyGrowth < -5 ? 'down' as const : 'stable' as const,
      confidence: Math.round(confidence),
    };
  }, [historicalData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-[250px]" />
        </CardContent>
      </Card>
    );
  }

  if (!historicalData || historicalData.length < 7) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Not enough data yet. Forecasting requires at least 7 days of revenue history.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Revenue Forecast
        </CardTitle>
        <CardDescription>
          14-day projection based on your revenue trends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Weekly Growth</p>
            <div className="flex items-center gap-1">
              <p className={`text-sm sm:text-lg font-bold ${metrics.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.weeklyGrowth >= 0 ? '+' : ''}{metrics.weeklyGrowth.toFixed(1)}%
              </p>
              {metrics.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
              ) : metrics.trend === 'down' ? (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
              ) : null}
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">30-Day Projection</p>
            <p className="text-sm sm:text-lg font-bold truncate">{formatCurrency(metrics.monthlyProjection, currency)}</p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Confidence</p>
            <div className="flex items-center gap-1 sm:gap-2">
              <p className="text-sm sm:text-lg font-bold">{metrics.confidence}%</p>
              <Badge variant={metrics.confidence >= 70 ? 'default' : metrics.confidence >= 50 ? 'secondary' : 'outline'} className="text-[10px] sm:text-xs">
                {metrics.confidence >= 70 ? 'High' : metrics.confidence >= 50 ? 'Med' : 'Low'}
              </Badge>
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Forecast Period</p>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm sm:text-lg font-bold">14 Days</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="orgActualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="orgForecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="orgConfidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                className="text-muted-foreground"
                tickFormatter={(value) => 
                  value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()
                }
                width={45}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2 shadow-lg text-xs">
                      <p className="font-medium mb-1">{label}</p>
                      {payload.filter(p => p.value !== undefined && p.dataKey !== 'upper' && p.dataKey !== 'lower').map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                          {entry.name}: {formatCurrency(Number(entry.value), currency)}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <ReferenceLine
                x={forecastData.find(d => d.forecast !== undefined)?.date}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
              />
              {/* Confidence interval */}
              <Area
                type="monotone"
                dataKey="upper"
                stroke="transparent"
                fill="url(#orgConfidenceGradient)"
                name="Upper Bound"
              />
              {/* Actual revenue */}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#orgActualGradient)"
                name="Actual"
              />
              {/* Forecast revenue */}
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#orgForecastGradient)"
                name="Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-primary" />
            <span>Actual</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-chart-2" style={{ borderTop: '2px dashed' }} />
            <span>Forecast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-chart-2/10 rounded-sm" />
            <span>95% Confidence</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueForecastWidget;
