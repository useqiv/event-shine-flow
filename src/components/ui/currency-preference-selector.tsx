import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { currencies } from '@/components/ui/currency-selector';
import { useUserCurrency } from '@/hooks/useUserCurrency';
import LiveRatesIndicator from '@/components/ui/live-rates-indicator';
import { useConversionDisplay } from '@/components/ui/currency-selector';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
        <div className="flex items-center gap-1">
          <Label className="text-sm text-muted-foreground">Preferred Currency</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  When viewing amounts in other currencies, you'll see a conversion tooltip 
                  showing the approximate value in your preferred currency.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
      <p className="text-xs text-muted-foreground mt-2">
        Hover over amounts to see conversions to {currencies.find(c => c.code === preferredCurrency)?.name || preferredCurrency}
      </p>
    </div>
  );
};

export default CurrencyPreferenceSelector;
