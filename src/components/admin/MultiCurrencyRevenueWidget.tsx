import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMultiCurrencyRevenue } from '@/hooks/useMultiCurrencyRevenue';
import { Coins, Vote, Ticket, Heart, TrendingUp } from 'lucide-react';

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
  GHS: 'GH₵',
  KES: 'KSh',
  ZAR: 'R',
};

const formatCurrency = (amount: number, currency: string) => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const MultiCurrencyRevenueWidget: React.FC = () => {
  const { data: currencyData, isLoading } = useMultiCurrencyRevenue();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');

  // All hooks must be called before any early returns
  const availableCurrencies = useMemo(() => {
    if (!currencyData) return [];
    return currencyData.map(item => item.currency);
  }, [currencyData]);

  const filteredData = useMemo(() => {
    if (!currencyData) return [];
    if (selectedCurrency === 'all') return currencyData;
    return currencyData.filter(item => item.currency === selectedCurrency);
  }, [currencyData, selectedCurrency]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!currencyData || currencyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Revenue by Currency
          </CardTitle>
          <CardDescription>Multi-currency payment breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No revenue data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Revenue by Currency
            </CardTitle>
            <CardDescription>Multi-currency payment breakdown across all revenue streams</CardDescription>
          </div>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              {availableCurrencies.map(currency => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No revenue data for selected currency.</p>
        ) : (
          filteredData.map((item) => (
            <div key={item.currency} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg font-semibold px-3 py-1">
                    {item.currency}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.totalTransactions} transactions
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">
                    {formatCurrency(item.totalRevenue, item.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    Total Revenue
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                {item.voteRevenue > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <Vote className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">{formatCurrency(item.voteRevenue, item.currency)}</div>
                      <div className="text-xs text-muted-foreground">{item.voteCount} votes</div>
                    </div>
                  </div>
                )}
                {item.ticketRevenue > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <Ticket className="h-4 w-4 text-secondary-foreground" />
                    <div>
                      <div className="font-medium">{formatCurrency(item.ticketRevenue, item.currency)}</div>
                      <div className="text-xs text-muted-foreground">{item.ticketCount} tickets</div>
                    </div>
                  </div>
                )}
                {item.donationRevenue > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <Heart className="h-4 w-4 text-destructive" />
                    <div>
                      <div className="font-medium">{formatCurrency(item.donationRevenue, item.currency)}</div>
                      <div className="text-xs text-muted-foreground">{item.donationCount} donations</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default MultiCurrencyRevenueWidget;
