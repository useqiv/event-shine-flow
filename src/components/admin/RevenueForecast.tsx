import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { useRevenueTrends } from '@/hooks/useRevenueTrends';
import { format, addDays } from 'date-fns';

interface ForecastData {
  date: string;
  actual?: number;
  forecast?: number;
  lower?: number;
  upper?: number;
}

const RevenueForecast = () => {
  const { data: historicalData, isLoading } = useRevenueTrends(60); // Get 60 days of history

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
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading forecast data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weekly Growth</p>
                <p className="text-2xl font-bold">
                  {metrics.weeklyGrowth >= 0 ? '+' : ''}{metrics.weeklyGrowth.toFixed(1)}%
                </p>
              </div>
              <div className={`p-2 rounded-lg ${metrics.trend === 'up' ? 'bg-green-500/10' : metrics.trend === 'down' ? 'bg-red-500/10' : 'bg-muted'}`}>
                {metrics.trend === 'up' ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : metrics.trend === 'down' ? (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">30-Day Projection</p>
                <p className="text-2xl font-bold">₦{metrics.monthlyProjection.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Forecast Confidence</p>
                <p className="text-2xl font-bold">{metrics.confidence}%</p>
              </div>
              <Badge variant={metrics.confidence >= 70 ? 'default' : metrics.confidence >= 50 ? 'secondary' : 'outline'}>
                {metrics.confidence >= 70 ? 'High' : metrics.confidence >= 50 ? 'Medium' : 'Low'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Forecast Period</p>
                <p className="text-2xl font-bold">14 Days</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast</CardTitle>
          <CardDescription>
            Historical revenue (solid) and projected revenue (dashed) with confidence intervals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                  tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: ₦{Number(entry.value).toLocaleString()}
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
                  label={{ value: 'Today', position: 'top', fontSize: 12 }}
                />
                {/* Confidence interval area */}
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="transparent"
                  fill="url(#confidenceGradient)"
                  name="Upper Bound"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="transparent"
                  fill="hsl(var(--background))"
                  name="Lower Bound"
                />
                {/* Actual revenue */}
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#actualGradient)"
                  name="Actual Revenue"
                />
                {/* Forecast revenue */}
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#forecastGradient)"
                  name="Forecast"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-primary" />
              <span className="text-muted-foreground">Actual Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-chart-2 border-dashed" style={{ borderTop: '2px dashed' }} />
              <span className="text-muted-foreground">Forecast</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-chart-2/10 rounded" />
              <span className="text-muted-foreground">95% Confidence</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueForecast;
