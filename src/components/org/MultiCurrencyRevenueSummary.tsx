import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/components/ui/currency-selector';
import {
  applyCommissionToRevenueByCurrency,
  hasMultipleRevenueCurrencies,
  normalizeRevenueByCurrency,
} from '@/lib/revenueByCurrency';

interface MultiCurrencyRevenueSummaryProps {
  grossByCurrency: Record<string, number>;
  commissionRatePercent: number;
  listingCurrency: string;
  totalLabel?: string;
  netLabel?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const MultiCurrencyRevenueSummary: React.FC<MultiCurrencyRevenueSummaryProps> = ({
  grossByCurrency,
  commissionRatePercent,
  listingCurrency,
  totalLabel = 'Total Revenue',
  netLabel = 'Net Revenue',
  size = 'md',
  className = '',
}) => {
  const gross = normalizeRevenueByCurrency(grossByCurrency);
  const net = applyCommissionToRevenueByCurrency(gross, commissionRatePercent);
  // Only show currencies with real paid revenue (no phantom USD/NGN lines)
  const currencies = Object.keys(gross).sort(
    (a, b) => (gross[b] || 0) - (gross[a] || 0),
  );
  const multi = hasMultipleRevenueCurrencies(gross);

  const amountClass = size === 'sm' ? 'text-sm font-semibold' : 'text-lg font-bold';

  if (currencies.length === 0) {
    const code = (listingCurrency || 'NGN').toUpperCase();
    return (
      <div className={`space-y-1 ${className}`}>
        <p className="text-xs text-muted-foreground">{totalLabel}</p>
        <p className={amountClass}>{formatCurrency(0, code)}</p>
        <p className="text-xs text-muted-foreground">
          {netLabel}: {formatCurrency(0, code)}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {multi && (
        <p className="text-xs text-muted-foreground">
          Revenue is shown per paid currency (never mixed).
        </p>
      )}
      {currencies.map((code) => (
        <div key={code} className="space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              {totalLabel}
              {multi && <Badge variant="outline" className="text-[10px] px-1 py-0">{code}</Badge>}
            </span>
            <span className={amountClass}>{formatCurrency(gross[code] || 0, code)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-green-700 dark:text-green-400">{netLabel}</span>
            <span className={`${size === 'sm' ? 'text-sm' : 'text-base'} font-semibold text-green-600 dark:text-green-400`}>
              {formatCurrency(net[code] || 0, code)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MultiCurrencyRevenueSummary;
