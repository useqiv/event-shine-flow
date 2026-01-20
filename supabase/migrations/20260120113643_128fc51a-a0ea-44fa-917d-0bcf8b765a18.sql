
-- Delete all votes
DELETE FROM public.votes;

-- Delete all tickets  
DELETE FROM public.tickets;

-- Delete all donations
DELETE FROM public.donations;

-- Delete all wallet transactions
DELETE FROM public.wallet_transactions;

-- Reset wallet balances to 0
UPDATE public.wallets SET balance = 0, referral_earnings = 0;

-- Delete all wallet currency balances
DELETE FROM public.wallet_currency_balances;

-- Reset contestant vote counts to 0
UPDATE public.contestants SET vote_count = 0;

-- Reset contest total votes to 0
UPDATE public.contests SET total_votes = 0;

-- Reset ticket type quantity sold to 0
UPDATE public.ticket_types SET quantity_sold = 0;

-- Reset campaign amounts to 0
UPDATE public.campaigns SET current_amount = 0, donor_count = 0;

-- Reset influencer link stats
UPDATE public.influencer_links SET total_clicks = 0, total_conversions = 0, total_revenue = 0, total_commission = 0;

-- Delete influencer clicks
DELETE FROM public.influencer_clicks;

-- Reset influencer profile earnings
UPDATE public.influencer_profiles SET total_earnings = 0, pending_earnings = 0, paid_earnings = 0;

-- Delete payouts
DELETE FROM public.payouts;

-- Delete influencer payouts
DELETE FROM public.influencer_payouts;

-- Delete contest analytics
DELETE FROM public.contest_analytics;

-- Delete campaign analytics
DELETE FROM public.campaign_analytics;
