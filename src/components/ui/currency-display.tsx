import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, useConversionDisplay, getCurrencySymbol } from '@/components/ui/currency-selector';
import { useUserCurrency } from '@/hooks/useUserCurrency';

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  showConversion?: boolean;
  conversionCurrency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * CurrencyDisplay component that shows an amount in a specified currency
 * with an optional tooltip showing the equivalent in user's preferred currency
 */
const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency,
  showConversion = true,
  conversionCurrency,
  className = '',
  size = 'md',
}) => {
  const { convert, isLive } = useConversionDisplay();
  const { preferredCurrency } = useUserCurrency();
  
  // Use provided conversion currency or fall back to user's preferred currency
  const targetCurrency = conversionCurrency || preferredCurrency;
  
  const formattedAmount = formatCurrency(amount, currency);
  
  // Don't show conversion if already in target currency or amount is 0
  const shouldShowConversion = showConversion && 
    currency !== targetCurrency && 
    amount > 0;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl font-bold',
  };

  if (!shouldShowConversion) {
    return <span className={`${sizeClasses[size]} ${className}`}>{formattedAmount}</span>;
  }

  const convertedAmount = convert(amount, currency, targetCurrency);
  const conversionSymbol = getCurrencySymbol(targetCurrency);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${sizeClasses[size]} ${className} cursor-help border-b border-dotted border-muted-foreground/50`}>
            {formattedAmount}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-medium">
              ≈ {conversionSymbol}{convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {targetCurrency}
            </p>
            <p className="text-muted-foreground">
              {isLive ? 'Live rate' : 'Estimated rate'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Hook to get a formatted currency with USD conversion tooltip text
 * Useful when you need the conversion text without the component
 */
export const useCurrencyWithConversion = () => {
  const { convert, getConversion, isLive } = useConversionDisplay();
  
  const getAmountWithConversion = (amount: number, currency: string, targetCurrency: string = 'USD') => {
    const formatted = formatCurrency(amount, currency);
    const conversion = getConversion(amount, currency, targetCurrency);
    return { formatted, conversion, isLive };
  };

  return { getAmountWithConversion, convert };
};

export default CurrencyDisplay;
