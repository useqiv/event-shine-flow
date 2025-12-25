-- Prevent double-processing of the same payment into multiple votes/tickets
-- We enforce idempotency at the DB level by making transaction_id unique when present.

CREATE UNIQUE INDEX IF NOT EXISTS votes_unique_transaction_id
ON public.votes (transaction_id)
WHERE transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tickets_unique_transaction_id
ON public.tickets (transaction_id)
WHERE transaction_id IS NOT NULL;