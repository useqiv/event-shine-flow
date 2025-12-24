-- Insert sample ticket types using gen_random_uuid()
INSERT INTO public.ticket_types (event_id, name, description, price, quantity_available, quantity_sold) 
SELECT e.id, t.name, t.description, t.price, t.quantity_available, t.quantity_sold
FROM public.events e
CROSS JOIN (VALUES
  ('Regular', 'General admission with access to main stage', 15000.00, 500, 120),
  ('VIP', 'VIP area access, complimentary drinks, premium viewing', 50000.00, 100, 45),
  ('VVIP Table', 'Private table for 6, unlimited drinks, backstage access', 250000.00, 20, 8)
) AS t(name, description, price, quantity_available, quantity_sold)
WHERE e.title = 'Afrobeats Summer Fest 2024';

INSERT INTO public.ticket_types (event_id, name, description, price, quantity_available, quantity_sold) 
SELECT e.id, t.name, t.description, t.price, t.quantity_available, t.quantity_sold
FROM public.events e
CROSS JOIN (VALUES
  ('Standard', 'Conference access, networking sessions, lunch included', 25000.00, 300, 89),
  ('Premium', 'All standard benefits + workshop access + swag bag', 45000.00, 150, 67),
  ('Investor Pass', 'Exclusive investor lounge, 1-on-1 startup meetings', 100000.00, 50, 23)
) AS t(name, description, price, quantity_available, quantity_sold)
WHERE e.title = 'Tech Connect Lagos';

INSERT INTO public.ticket_types (event_id, name, description, price, quantity_available, quantity_sold) 
SELECT e.id, t.name, t.description, t.price, t.quantity_available, t.quantity_sold
FROM public.events e
CROSS JOIN (VALUES
  ('General', 'Access to all runway shows', 20000.00, 400, 156),
  ('Front Row', 'Premium front row seating at all shows', 75000.00, 80, 34)
) AS t(name, description, price, quantity_available, quantity_sold)
WHERE e.title = 'Lagos Fashion Week';

INSERT INTO public.ticket_types (event_id, name, description, price, quantity_available, quantity_sold) 
SELECT e.id, t.name, t.description, t.price, t.quantity_available, t.quantity_sold
FROM public.events e
CROSS JOIN (VALUES
  ('Standard', 'General seating', 10000.00, 200, 78),
  ('VIP', 'Reserved front seats + meet & greet', 30000.00, 50, 22)
) AS t(name, description, price, quantity_available, quantity_sold)
WHERE e.title = 'Comedy Night Live';

INSERT INTO public.ticket_types (event_id, name, description, price, quantity_available, quantity_sold) 
SELECT e.id, t.name, t.description, t.price, t.quantity_available, t.quantity_sold
FROM public.events e
CROSS JOIN (VALUES
  ('Early Bird', 'Discounted early access', 5000.00, 100, 100),
  ('Regular', 'Standard entry', 8000.00, 300, 145),
  ('Cabana', 'Private cabana for 4, drinks included', 50000.00, 15, 7)
) AS t(name, description, price, quantity_available, quantity_sold)
WHERE e.title = 'Beach Party Vibes';

-- Insert sample vouchers
INSERT INTO public.vouchers (code, amount, is_used, expires_at) VALUES
('WELCOME500', 500.00, false, NOW() + INTERVAL '30 days'),
('VOTE2024', 1000.00, false, NOW() + INTERVAL '60 days'),
('NEWYEAR', 2000.00, false, NOW() + INTERVAL '90 days');