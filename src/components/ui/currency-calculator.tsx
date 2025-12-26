import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Calculator } from 'lucide-react';
import { currencies, getCurrencySymbol, useConversionDisplay } from '@/components/ui/currency-selector';
import LiveRatesIndicator from '@/components/ui/live-rates-indicator';

interface CurrencyCalculatorProps {
  className?: string;
  compact?: boolean;
}

const CurrencyCalculator: React.FC<CurrencyCalculatorProps> = ({ className, compact = false }) => {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('NGN');
  
  const { convert, isLive, lastUpdated, rates } = useConversionDisplay();

  const convertedAmount = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    return convert(numAmount, fromCurrency, toCurrency);
  }, [amount, fromCurrency, toCurrency, convert]);

  const exchangeRate = useMemo(() => {
    return convert(1, fromCurrency, toCurrency);
  }, [fromCurrency, toCurrency, convert]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  if (compact) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Currency Calculator</span>
          <LiveRatesIndicator isLive={isLive} lastUpdated={lastUpdated} />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24"
            min="0"
          />
          <Select value={fromCurrency} onValueChange={setFromCurrency}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={handleSwap} className="shrink-0">
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
          <Select value={toCurrency} onValueChange={setToCurrency}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-lg font-bold whitespace-nowrap">
            = {getCurrencySymbol(toCurrency)}{formatNumber(convertedAmount)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Currency Calculator
          </CardTitle>
          <LiveRatesIndicator isLive={isLive} lastUpdated={lastUpdated} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Currency */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">From</Label>
          <div className="flex gap-2">
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {getCurrencySymbol(fromCurrency)}
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                min="0"
                step="any"
              />
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSwap}
            className="rounded-full"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Swap
          </Button>
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">To</Label>
          <div className="flex gap-2">
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 p-3 bg-secondary rounded-md">
              <p className="text-xl font-bold">
                {getCurrencySymbol(toCurrency)}{formatNumber(convertedAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground text-center">
            1 {fromCurrency} = {getCurrencySymbol(toCurrency)}{formatNumber(exchangeRate)} {toCurrency}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencyCalculator;
