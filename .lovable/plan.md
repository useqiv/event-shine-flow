

## Analysis Summary

The "Failed to claim ticket new row violates row-level security policy" error is **not actually an RLS issue** - it's caused by a **CHECK constraint violation** on the `payment_method` column.

### Root Cause

The `tickets` table has a CHECK constraint that only allows these payment methods:
- `wallet`
- `card`
- `bank_transfer`
- `usdt`

However, when claiming a free ticket, the code sets `payment_method: 'free'`, which violates this constraint. PostgreSQL sometimes surfaces constraint violations as RLS errors in certain contexts, which made debugging confusing.

### Evidence
- **Network request shows**: `"payment_method":"free"`
- **Code in `useEvents.ts`**: `payment_method: isFreeTicket ? 'free' : paymentMethod`
- **Database constraint**: `CHECK ((payment_method = ANY (ARRAY['wallet', 'card', 'bank_transfer', 'usdt'])))`

## Solution

There are two options to fix this:

### Option A: Add 'free' to the allowed payment methods (Recommended)

**Database Change:**
- Alter the CHECK constraint on `tickets.payment_method` to include `'free'` as a valid option
- SQL: `ALTER TABLE tickets DROP CONSTRAINT tickets_payment_method_check; ALTER TABLE tickets ADD CONSTRAINT tickets_payment_method_check CHECK (payment_method = ANY (ARRAY['wallet', 'card', 'bank_transfer', 'usdt', 'free']));`

No code changes needed - the current code already correctly uses `'free'` for free tickets.

### Option B: Change code to use an existing payment method

**Code Change:**
- In `src/hooks/useEvents.ts`, change the free ticket payment method from `'free'` to `'wallet'` (or another existing option)
- Change: `payment_method: isFreeTicket ? 'free' : paymentMethod` → `payment_method: isFreeTicket ? 'wallet' : paymentMethod`

Not recommended because `'wallet'` is misleading for free tickets.

## Recommendation

**Option A** is the better solution because:
1. `'free'` is semantically correct for free ticket claims
2. It makes reporting and analytics clearer
3. It's a minimal change that doesn't affect existing data

## Technical Implementation

**Database Migration:**
```sql
-- Drop the existing constraint
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_payment_method_check;

-- Add the new constraint with 'free' included
ALTER TABLE public.tickets ADD CONSTRAINT tickets_payment_method_check 
  CHECK (payment_method = ANY (ARRAY['wallet', 'card', 'bank_transfer', 'usdt', 'free']));
```

No frontend code changes are needed since the code already uses `'free'` as the payment method for free tickets.

