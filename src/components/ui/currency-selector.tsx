import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar', minAmount: 1 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', minAmount: 100 },
  { code: 'EUR', symbol: '€', name: 'Euro', minAmount: 1 },
  { code: 'GBP', symbol: '£', name: 'British Pound', minAmount: 1 },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', minAmount: 1 },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', minAmount: 100 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', minAmount: 10 },
];

// Approximate exchange rates to USD (for display purposes only)
export const exchangeRates: Record<string, number> = {
  USD: 1,
  NGN: 1550,
  EUR: 0.92,
  GBP: 0.79,
  GHS: 15.5,
  KES: 153,
  ZAR: 18.5,
};

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

// Convert amount from one currency to another (approximate)
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
};

// Format amount with conversion display
export const formatWithConversion = (amount: number, fromCurrency: string, toCurrency: string): string => {
  if (fromCurrency === toCurrency) return '';
  const converted = convertCurrency(amount, fromCurrency, toCurrency);
  const symbol = getCurrencySymbol(toCurrency);
  return `≈ ${symbol}${converted.toFixed(2)}`;
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
