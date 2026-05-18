import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExchangeRates, fallbackRates } from '@/hooks/useExchangeRates';

// Decimal currencies support sub-unit payments (e.g. $0.50)
const DECIMAL_CURRENCY_CODES = new Set(['USD', 'EUR', 'GBP', 'GHS', 'ZAR']);

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar', minAmount: 0.01, walletMinAmount: 1 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', minAmount: 1, walletMinAmount: 100 },
  { code: 'EUR', symbol: '€', name: 'Euro', minAmount: 0.01, walletMinAmount: 1 },
  { code: 'GBP', symbol: '£', name: 'British Pound', minAmount: 0.01, walletMinAmount: 1 },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', minAmount: 0.01, walletMinAmount: 1 },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', minAmount: 1, walletMinAmount: 100 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', minAmount: 0.01, walletMinAmount: 10 },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', minAmount: 1, walletMinAmount: 100 },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', minAmount: 1, walletMinAmount: 100 },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', minAmount: 1, walletMinAmount: 1000 },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', minAmount: 1, walletMinAmount: 1000 },
  { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', minAmount: 1, walletMinAmount: 100 },
];

export const getCurrencySymbol = (code: string): string => {
  return currencies.find(c => c.code === code)?.symbol || code;
};

/** Minimum for wallet top-ups (higher thresholds). */
export const getCurrencyMinAmount = (code: string): number => {
  const currency = currencies.find(c => c.code === code);
  return currency?.walletMinAmount ?? currency?.minAmount ?? 0.01;
};

/** Smallest charge for votes/tickets (supports sub-dollar payments). */
export const getPaymentMinAmount = (code: string): number => {
  return currencies.find(c => c.code === code)?.minAmount ?? 0.01;
};

export const roundPaymentAmount = (amount: number, currencyCode: string): number => {
  if (DECIMAL_CURRENCY_CODES.has(currencyCode)) {
    return Math.round(amount * 100) / 100;
  }
  return Math.round(amount);
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode);
  const fractionDigits = DECIMAL_CURRENCY_CODES.has(currencyCode) ? 2 : 0;
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
};

// Percentage markup to apply to all currency conversions (e.g., 0.10 = 10%)
const CURRENCY_MARKUP_PERCENT = 0.10;

// Convert amount from one currency to another using provided rates
// Applies 30% markup to all conversions
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string, rates: Record<string, number>): number => {
  if (fromCurrency === toCurrency) return amount; // No conversion needed
  
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  const amountInUSD = amount / fromRate;
  const convertedAmount = amountInUSD * toRate;
  
  // Apply percentage markup to the converted amount
  const withMarkup = convertedAmount * (1 + CURRENCY_MARKUP_PERCENT);
  const rounded = roundPaymentAmount(withMarkup, toCurrency);
  const minAmount = getPaymentMinAmount(toCurrency);
  // Never return 0 after conversion (e.g. tiny NGN → USD)
  if (rounded <= 0) return minAmount;
  return rounded;
};

// Format amount with conversion display using provided rates
export const formatWithConversion = (amount: number, fromCurrency: string, toCurrency: string, rates: Record<string, number>): string => {
  if (fromCurrency === toCurrency) return '';
  const converted = convertCurrency(amount, fromCurrency, toCurrency, rates);
  const symbol = getCurrencySymbol(toCurrency);
  return `≈ ${symbol}${converted.toFixed(2)}`;
};

// Hook to get conversion display with real-time rates
export const useConversionDisplay = () => {
  const { data: ratesData, isLoading } = useExchangeRates();
  const rates = ratesData?.rates || fallbackRates;
  
  const getConversion = (amount: number, fromCurrency: string, toCurrency: string = 'USD') => {
    if (fromCurrency === toCurrency) return '';
    return formatWithConversion(amount, fromCurrency, toCurrency, rates);
  };

  const convert = (amount: number, fromCurrency: string, toCurrency: string = 'USD') => {
    return convertCurrency(amount, fromCurrency, toCurrency, rates);
  };

  // Get conversion to user's preferred currency
  const getPreferredConversion = (amount: number, fromCurrency: string, preferredCurrency: string) => {
    if (fromCurrency === preferredCurrency) return '';
    return formatWithConversion(amount, fromCurrency, preferredCurrency, rates);
  };

  return { 
    getConversion, 
    convert, 
    getPreferredConversion,
    rates,
    isLive: !!(ratesData && !ratesData.fallback),
    lastUpdated: ratesData?.lastUpdated,
    isLoading
  };
};

interface CurrencySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onValueChange,
  disabled = false,
  className,
}) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.symbol} - {currency.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;
