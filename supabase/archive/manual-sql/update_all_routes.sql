-- =============================================
-- AFRIQUE-CON PLC — COMPLETE ROUTES SEED
-- Based on the uploaded PDF document
-- Paste this entire file into:
-- Supabase Dashboard > SQL Editor > Run
-- =============================================

-- 1. Clear existing routes to avoid duplicates (no foreign key constraints on routes table)
DELETE FROM public.routes;

-- 2. Insert the complete list of routes (Both directions: CM -> NG and NG -> CM)
INSERT INTO public.routes (origin, origin_code, destination, destination_code, base_rate_fcfa, estimated_hours)
VALUES
  -- ─── LAGOS ROUTES ───
  ('Yaoundé', 'YKO', 'Lagos', 'LOS', 95000, 15),
  ('Lagos', 'LOS', 'Yaoundé', 'YKO', 95000, 15),
  ('Douala', 'DLA', 'Lagos', 'LOS', 90000, 12),
  ('Lagos', 'LOS', 'Douala', 'DLA', 90000, 12),
  ('Buea', 'BUE', 'Lagos', 'LOS', 90000, 11),
  ('Lagos', 'LOS', 'Buea', 'BUE', 90000, 11),
  ('Kumba', 'KBA', 'Lagos', 'LOS', 85000, 10),
  ('Lagos', 'LOS', 'Kumba', 'KBA', 85000, 10),
  ('Mamfe', 'MMF', 'Lagos', 'LOS', 60000, 8),
  ('Lagos', 'LOS', 'Mamfe', 'MMF', 60000, 8),

  -- ─── ABUJA ROUTES ───
  ('Yaoundé', 'YKO', 'Abuja', 'ABV', 100000, 18),
  ('Abuja', 'ABV', 'Yaoundé', 'YKO', 100000, 18),
  ('Douala', 'DLA', 'Abuja', 'ABV', 90000, 16),
  ('Abuja', 'ABV', 'Douala', 'DLA', 90000, 16),
  ('Buea', 'BUE', 'Abuja', 'ABV', 90000, 15),
  ('Abuja', 'ABV', 'Buea', 'BUE', 90000, 15),
  ('Kumba', 'KBA', 'Abuja', 'ABV', 85000, 14),
  ('Abuja', 'ABV', 'Kumba', 'KBA', 85000, 14),
  ('Mamfe', 'MMF', 'Abuja', 'ABV', 65000, 10),
  ('Abuja', 'ABV', 'Mamfe', 'MMF', 65000, 10),

  -- ─── ABAKALIKI ROUTES ───
  ('Yaoundé', 'YKO', 'Abakaliki', 'ABK', 65000, 12),
  ('Abakaliki', 'ABK', 'Yaoundé', 'YKO', 65000, 12),
  ('Douala', 'DLA', 'Abakaliki', 'ABK', 55000, 10),
  ('Abakaliki', 'ABK', 'Douala', 'DLA', 55000, 10),
  ('Buea', 'BUE', 'Abakaliki', 'ABK', 55000, 9),
  ('Abakaliki', 'ABK', 'Buea', 'BUE', 55000, 9),
  ('Kumba', 'KBA', 'Abakaliki', 'ABK', 50000, 8),
  ('Abakaliki', 'ABK', 'Kumba', 'KBA', 50000, 8),

  -- ─── ENUGU ROUTES ───
  ('Yaoundé', 'YKO', 'Enugu', 'ENU', 65000, 13),
  ('Enugu', 'ENU', 'Yaoundé', 'YKO', 65000, 13),
  ('Douala', 'DLA', 'Enugu', 'ENU', 55000, 11),
  ('Enugu', 'ENU', 'Douala', 'DLA', 55000, 11),
  ('Buea', 'BUE', 'Enugu', 'ENU', 55000, 10),
  ('Enugu', 'ENU', 'Buea', 'BUE', 55000, 10),
  ('Kumba', 'KBA', 'Enugu', 'ENU', 50000, 9),
  ('Enugu', 'ENU', 'Kumba', 'KBA', 50000, 9),

  -- ─── ONITSHA ROUTES ───
  ('Yaoundé', 'YKO', 'Onitsha', 'ONI', 65000, 14),
  ('Onitsha', 'ONI', 'Yaoundé', 'YKO', 65000, 14),
  ('Douala', 'DLA', 'Onitsha', 'ONI', 55000, 12),
  ('Onitsha', 'ONI', 'Douala', 'DLA', 55000, 12),
  ('Buea', 'BUE', 'Onitsha', 'ONI', 55000, 11),
  ('Onitsha', 'ONI', 'Buea', 'BUE', 55000, 11),
  ('Kumba', 'KBA', 'Onitsha', 'ONI', 50000, 10),
  ('Onitsha', 'ONI', 'Kumba', 'KBA', 50000, 10),

  -- ─── IKOM ROUTES ───
  ('Yaoundé', 'YKO', 'Ikom', 'IKO', 60000, 8),
  ('Ikom', 'IKO', 'Yaoundé', 'YKO', 60000, 8),
  ('Douala', 'DLA', 'Ikom', 'IKO', 50000, 6),
  ('Ikom', 'IKO', 'Douala', 'DLA', 50000, 6),
  ('Buea', 'BUE', 'Ikom', 'IKO', 50000, 5),
  ('Ikom', 'IKO', 'Buea', 'BUE', 50000, 5),
  ('Kumba', 'KBA', 'Ikom', 'IKO', 40000, 4),
  ('Ikom', 'IKO', 'Kumba', 'KBA', 40000, 4);
