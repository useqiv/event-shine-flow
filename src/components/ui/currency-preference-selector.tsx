import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  const { preferredCurrency, updatePreferredCurrency, showConvertedByDefault, updateShowConvertedByDefault } = useUserCurrency();
  const { isLive, lastUpdated } = useConversionDisplay();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Currency Selection */}
      <div>
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
      </div>

      {/* Display Preference Toggle */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Show converted amounts by default</Label>
          <p className="text-xs text-muted-foreground">
            Display prices in {currencies.find(c => c.code === preferredCurrency)?.name || preferredCurrency} instead of original currency
          </p>
        </div>
        <Switch
          checked={showConvertedByDefault}
          onCheckedChange={updateShowConvertedByDefault}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {showConvertedByDefault 
          ? `Amounts will be shown in ${preferredCurrency} by default. You can toggle to see original amounts.`
          : `Hover over amounts to see conversions to ${currencies.find(c => c.code === preferredCurrency)?.name || preferredCurrency}`
        }
      </p>
    </div>
  );
};

export default CurrencyPreferenceSelector;
