-- Correct routes.estimated_hours to match the real per-route trip durations
-- from the updated bus schedule (previously seeded with placeholder guesses,
-- e.g. Douala <-> Lagos was 12 hours instead of the actual 28). Duration is
-- symmetric: the same number of hours applies in both directions for a
-- given city pair.

UPDATE public.routes AS r
SET estimated_hours = v.hours
FROM (VALUES
  ('Yaoundé', 'Lagos', 36),
  ('Douala',  'Lagos', 28),
  ('Buea',    'Lagos', 26),
  ('Kumba',   'Lagos', 24),
  ('Mamfe',   'Lagos', 22),

  ('Yaoundé', 'Abuja', 36),
  ('Douala',  'Abuja', 28),
  ('Buea',    'Abuja', 26),
  ('Kumba',   'Abuja', 24),
  ('Mamfe',   'Abuja', 22),

  ('Yaoundé', 'Abakaliki', 26),
  ('Douala',  'Abakaliki', 22),
  ('Buea',    'Abakaliki', 18),
  ('Kumba',   'Abakaliki', 15),
  ('Mamfe',   'Abakaliki', 12),

  ('Yaoundé', 'Enugu', 28),
  ('Douala',  'Enugu', 20),
  ('Buea',    'Enugu', 18),
  ('Kumba',   'Enugu', 16),
  ('Mamfe',   'Enugu', 14),

  ('Yaoundé', 'Onitsha', 30),
  ('Douala',  'Onitsha', 22),
  ('Buea',    'Onitsha', 20),
  ('Kumba',   'Onitsha', 18),
  ('Mamfe',   'Onitsha', 16),

  ('Yaoundé', 'Ikom', 24),
  ('Douala',  'Ikom', 16),
  ('Buea',    'Ikom', 14),
  ('Kumba',   'Ikom', 12),
  ('Mamfe',   'Ikom', 10)
) AS v(city_a, city_b, hours)
WHERE (r.origin = v.city_a AND r.destination = v.city_b)
   OR (r.origin = v.city_b AND r.destination = v.city_a);

-- Recompute arrival_time on already-generated future schedules so upcoming
-- trips reflect the corrected duration immediately, instead of waiting for
-- the next scheduled regeneration.
UPDATE public.bus_schedules AS bs
SET arrival_time = bs.departure_time + make_interval(hours => r.estimated_hours)
FROM public.routes AS r
WHERE bs.origin = r.origin
  AND bs.destination = r.destination
  AND bs.departure_time > now()
  AND r.estimated_hours IS NOT NULL
  AND r.estimated_hours > 0;
