import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, useConversionDisplay, getCurrencySymbol } from '@/components/ui/currency-selector';
import { useUserCurrency } from '@/hooks/useUserCurrency';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight } from 'lucide-react';

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  showConversion?: boolean;
  conversionCurrency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  showToggle?: boolean;
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
  showBadge = false,
  showToggle = false,
}) => {
  const { convert, isLive } = useConversionDisplay();
  const { preferredCurrency, showConvertedByDefault } = useUserCurrency();
  const [showConverted, setShowConverted] = useState(showConvertedByDefault);
  
  // Sync with global preference when it changes
  React.useEffect(() => {
    setShowConverted(showConvertedByDefault);
  }, [showConvertedByDefault]);
  
  // Use provided conversion currency or fall back to user's preferred currency
  const targetCurrency = conversionCurrency || preferredCurrency;
  
  const formattedAmount = formatCurrency(amount, currency);
  
  // Don't show conversion if already in target currency or amount is 0
  const canConvert = showConversion && 
    currency !== targetCurrency && 
    amount > 0;

  const convertedAmount = canConvert ? convert(amount, currency, targetCurrency) : 0;
  const conversionSymbol = getCurrencySymbol(targetCurrency);
  const formattedConverted = `${conversionSymbol}${convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl font-bold',
  };

  const badgeSizeClasses = {
    sm: 'text-[10px] px-1 py-0',
    md: 'text-xs px-1.5 py-0.5',
    lg: 'text-sm px-2 py-0.5',
  };

  const displayAmount = showConverted && canConvert ? formattedConverted : formattedAmount;
  const displayCurrency = showConverted && canConvert ? targetCurrency : currency;

  // Simple display without conversion features
  if (!canConvert) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className={sizeClasses[size]}>{formattedAmount}</span>
        {showBadge && (
          <Badge variant="outline" className={`${badgeSizeClasses[size]} font-normal`}>
            {currency}
          </Badge>
        )}
      </span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1.5 ${className}`}>
            <span className={`${sizeClasses[size]} cursor-help border-b border-dotted border-muted-foreground/50`}>
              {displayAmount}
            </span>
            {showBadge && (
              <Badge variant="outline" className={`${badgeSizeClasses[size]} font-normal`}>
                {displayCurrency}
              </Badge>
            )}
            {showToggle && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConverted(!showConverted);
                }}
                className="p-0.5 rounded hover:bg-muted transition-colors"
                aria-label="Toggle currency display"
              >
                <ArrowLeftRight className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
              </button>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-medium">
              {showConverted ? (
                <>Original: {formattedAmount} {currency}</>
              ) : (
                <>≈ {formattedConverted} {targetCurrency}</>
              )}
            </p>
            <p className="text-muted-foreground">
              {isLive ? 'Live rate' : 'Estimated rate'}
              {showToggle && ' • Click toggle to switch'}
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
