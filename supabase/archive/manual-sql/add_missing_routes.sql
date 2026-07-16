-- =============================================
-- AFRIQUE-CON PLC — MISSING ROUTES SEED
-- Paste this entire file into:
-- Supabase Dashboard > SQL Editor > Run
-- =============================================

INSERT INTO public.routes (origin, origin_code, destination, destination_code, base_rate_fcfa, estimated_hours)
VALUES
  ('Yaoundé', 'YKO', 'Abuja', 'ABV', 100000, 15),
  ('Douala', 'DLA', 'Abuja', 'ABV', 90000, 14),
  ('Buea', 'BUE', 'Lagos', 'LOS', 90000, 9),
  ('Kumba', 'KBA', 'Lagos', 'LOS', 85000, 8),
  ('Kumba', 'KBA', 'Abuja', 'ABV', 85000, 13),
  ('Ikom', 'IKO', 'Lagos', 'LOS', 40000, 10)
ON CONFLICT DO NOTHING;
