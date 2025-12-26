import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExchangeRates, fallbackRates } from '@/hooks/useExchangeRates';

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar', minAmount: 1 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', minAmount: 100 },
  { code: 'EUR', symbol: '€', name: 'Euro', minAmount: 1 },
  { code: 'GBP', symbol: '£', name: 'British Pound', minAmount: 1 },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', minAmount: 1 },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', minAmount: 100 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', minAmount: 10 },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', minAmount: 100 },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', minAmount: 100 },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', minAmount: 1000 },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', minAmount: 1000 },
  { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', minAmount: 100 },
];

export const getCurrencySymbol = (code: string): string => {
  return currencies.find(c => c.code === code)?.symbol || code;
};

export const getCurrencyMinAmount = (code: string): number => {
  return currencies.find(c => c.code === code)?.minAmount || 1;
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString()}`;
};

// Convert amount from one currency to another using provided rates
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string, rates: Record<string, number>): number => {
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
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
      <SelectContent className="bg-popover">
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
