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
  /** Vote count from the same aggregation as revenue (not contests.total_votes). */
  totalVotes?: number;
  /** Votes paid in listing currency; used with listingCatalogGross for alignment hint. */
  listingVoteQuantity?: number;
  /** Sum of vote-price line totals for listing-currency votes. */
  listingCatalogGross?: number;
  /** Per-vote listing price when no tiered options (for display only). */
  voteUnitPrice?: number;
  totalLabel?: string;
  netLabel?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const MultiCurrencyRevenueSummary: React.FC<MultiCurrencyRevenueSummaryProps> = ({
  grossByCurrency,
  commissionRatePercent,
  listingCurrency,
  totalVotes,
  listingVoteQuantity,
  listingCatalogGross,
  voteUnitPrice,
  totalLabel = 'Total Revenue',
  netLabel = 'Net Revenue',
  size = 'md',
  className = '',
}) => {
  const gross = normalizeRevenueByCurrency(grossByCurrency);
  const net = applyCommissionToRevenueByCurrency(gross, commissionRatePercent);
  const currencies = Object.keys(gross).sort(
    (a, b) => (gross[b] || 0) - (gross[a] || 0),
  );
  const multi = hasMultipleRevenueCurrencies(gross);
  const listing = (listingCurrency || 'NGN').toUpperCase();
  const listingGross = gross[listing] || 0;
  const showListingAlignment =
    listingVoteQuantity != null &&
    listingVoteQuantity > 0 &&
    listingCatalogGross != null &&
    listingCatalogGross > 0 &&
    listingGross > 0 &&
    Math.abs(listingGross - listingCatalogGross) <= Math.max(0.02, listingCatalogGross * 0.02);

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
        {totalVotes != null && totalVotes > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {totalVotes.toLocaleString()} vote{totalVotes === 1 ? '' : 's'} (no paid revenue yet)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {totalVotes != null && totalVotes > 0 && (
        <p className="text-xs text-muted-foreground">
          {totalVotes.toLocaleString()} vote{totalVotes === 1 ? '' : 's'} counted in revenue
        </p>
      )}
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
            <span
              className={`${size === 'sm' ? 'text-sm' : 'text-base'} font-semibold text-green-600 dark:text-green-400`}
            >
              {formatCurrency(net[code] || 0, code)}
            </span>
          </div>
          {code === listing && showListingAlignment && (
            <p className="text-[10px] text-muted-foreground leading-snug">
              {listingVoteQuantity!.toLocaleString()} vote{listingVoteQuantity === 1 ? '' : 's'} at listing
              price
              {voteUnitPrice != null && voteUnitPrice > 0
                ? ` (${formatCurrency(voteUnitPrice, listing)})`
                : ''}{' '}
              = {formatCurrency(listingCatalogGross!, listing)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default MultiCurrencyRevenueSummary;
