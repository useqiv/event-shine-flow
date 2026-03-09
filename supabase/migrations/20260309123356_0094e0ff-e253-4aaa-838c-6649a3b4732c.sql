-- One-time backfill: auto-detect country from venue/address for existing events
UPDATE public.events SET country = 'Nigeria' WHERE id = '648bece2-3542-421d-a7e4-f5a575f4c338';
UPDATE public.events SET country = 'Ghana' WHERE id = '3f66a0d5-f8e7-43b5-a519-5fb4425ac621';
UPDATE public.events SET country = 'Nigeria' WHERE id = '9d549136-4618-4921-870f-5bdd5fbe7348';