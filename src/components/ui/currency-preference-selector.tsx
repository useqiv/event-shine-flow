import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { currencies } from '@/components/ui/currency-selector';
import { useUserCurrency } from '@/hooks/useUserCurrency';
import LiveRatesIndicator from '@/components/ui/live-rates-indicator';
import { useConversionDisplay } from '@/components/ui/currency-selector';

interface CurrencyPreferenceSelectorProps {
  showLiveIndicator?: boolean;
  className?: string;
}

const CurrencyPreferenceSelector: React.FC<CurrencyPreferenceSelectorProps> = ({
  showLiveIndicator = true,
  className,
}) => {
  const { preferredCurrency, updatePreferredCurrency } = useUserCurrency();
  const { isLive, lastUpdated } = useConversionDisplay();

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm text-muted-foreground">Display Currency</Label>
        {showLiveIndicator && (
          <LiveRatesIndicator isLive={isLive} lastUpdated={lastUpdated} />
        )}
      </div>
      <Select value={preferredCurrency} onValueChange={updatePreferredCurrency}>
        <SelectTrigger>
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.symbol} - {currency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        Prices will show conversions to this currency
      </p>
    </div>
  );
};

export default CurrencyPreferenceSelector;
