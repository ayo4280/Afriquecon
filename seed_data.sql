-- =============================================
-- AFRIQUE-CON PLC — MOCK DATA SEEDING
-- Paste this entire file into:
-- Supabase Dashboard > SQL Editor > Run
-- =============================================

-- ─────────────────────────────────────────────
-- 1. Insert Buses
-- ─────────────────────────────────────────────
INSERT INTO public.buses (id, bus_number, registration_plate, capacity, features)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'AFCON-01', 'LT-123-AB', 48, '{"wifi","ac","reclining_seats"}'),
  ('22222222-2222-2222-2222-222222222222', 'AFCON-02', 'CE-456-CD', 48, '{"wifi","ac","tv"}')
ON CONFLICT (bus_number) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. Insert Routes (Optional, but good for completeness)
-- ─────────────────────────────────────────────
INSERT INTO public.routes (origin, origin_code, destination, destination_code, base_rate_fcfa, estimated_hours)
VALUES
  ('Douala', 'DLA', 'Lagos', 'LOS', 48000, 9),
  ('Yaoundé', 'YKO', 'Lagos', 'LOS', 60000, 11),
  ('Lagos', 'LOS', 'Douala', 'DLA', 48000, 9),
  ('Lagos', 'LOS', 'Yaoundé', 'YKO', 60000, 11)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. Insert Schedules for the next few days
-- We use DO NOTHING on conflict to avoid errors if run multiple times, 
-- though schedules don't have unique constraints so we'll just insert fresh ones.
-- To keep it simple, we just insert a few hardcoded dates.
-- ─────────────────────────────────────────────
INSERT INTO public.bus_schedules (id, bus_id, origin, destination, departure_time, arrival_time, base_fare_fcfa, available_seats)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Douala', 'Lagos', (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '07:00:00')::timestamp, (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '16:00:00')::timestamp, 48000, 48),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Douala', 'Lagos', (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '19:00:00')::timestamp, (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '04:00:00')::timestamp, 48000, 48),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Yaoundé', 'Lagos', (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '06:00:00')::timestamp, (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '17:00:00')::timestamp, 60000, 48),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Lagos', 'Douala', (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '08:00:00')::timestamp, (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '17:00:00')::timestamp, 48000, 48);

-- ─────────────────────────────────────────────
-- 4. Create RPC Function to decrement seats securely
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_available_seats(schedule_id_param UUID, seats_to_book INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bus_schedules
  SET available_seats = available_seats - seats_to_book
  WHERE id = schedule_id_param AND available_seats >= seats_to_book;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough available seats or schedule not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
