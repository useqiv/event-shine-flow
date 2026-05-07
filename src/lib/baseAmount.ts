import { supabase } from '@/integrations/supabase/client';

/**
 * For vote/ticket transactions, Flutterwave may charge "base amount + fees".
 * Org dashboards should report revenue based on the base amount (i.e. excluding fees).
 *
 * We store the fee-free base in `wallet_transactions.amount` and link records via `transaction_id`.
 */
export async function getBaseAmountsByTransactionId(transactionIds: Array<string | null | undefined>) {
  const ids = Array.from(
    new Set(transactionIds.filter((id): id is string => typeof id === 'string' && id.length > 0))
  );

  if (ids.length === 0) return new Map<string, number>();

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('id, amount')
    .in('id', ids);

  if (error) throw error;

  return new Map((data || []).map((t) => [t.id, Number(t.amount) || 0]));
}

