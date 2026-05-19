import React from 'react';
import { Badge } from '@/components/ui/badge';
import CurrencyDisplay from '@/components/ui/currency-display';
import { hasMultipleRevenueCurrencies, normalizeRevenueByCurrency } from '@/lib/revenueByCurrency';

interface AdminCurrencyAmountsSummaryProps {
  amountsByCurrency: Record<string, number>;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Per-currency totals for admin panels (never sums across currencies). */
const AdminCurrencyAmountsSummary: React.FC<AdminCurrencyAmountsSummaryProps> = ({
  amountsByCurrency,
  label,
  size = 'lg',
  className = '',
}) => {
  const normalized = normalizeRevenueByCurrency(amountsByCurrency);
  const currencies = Object.keys(normalized).sort(
    (a, b) => (normalized[b] || 0) - (normalized[a] || 0),
  );
  const multi = hasMultipleRevenueCurrencies(normalized);

  if (currencies.length === 0) {
    return (
      <p className={`text-muted-foreground text-sm ${className}`}>
        {label ? `${label}: ` : ''}No amounts
      </p>
    );
  }

  if (currencies.length === 1) {
    const code = currencies[0];
    return (
      <div className={className}>
        {label && <p className="text-xs text-muted-foreground mb-0.5">{label}</p>}
        <CurrencyDisplay amount={normalized[code] || 0} currency={code} size={size} showConversion={false} />
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <p className="text-xs text-muted-foreground">
          {label}
          {multi && ' (per currency)'}
        </p>
      )}
      {currencies.map((code) => (
        <div key={code} className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {code}
          </Badge>
          <CurrencyDisplay amount={normalized[code] || 0} currency={code} size={size} showConversion={false} />
        </div>
      ))}
    </div>
  );
};

export default AdminCurrencyAmountsSummary;
