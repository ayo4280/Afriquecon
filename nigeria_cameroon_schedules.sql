-- =============================================
-- AFRIQUE-CON PLC — SCHEDULE MATRIX GENERATOR
-- Based on PRD v2.4 PDF Matrix
-- Run in: Supabase Dashboard > SQL Editor
-- =============================================

-- Ensure buses exist
INSERT INTO public.buses (id, bus_number, registration_plate, capacity, features)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'AFCON-01', 'LT-123-AB', 48, '{"wifi","ac","reclining_seats"}'),
  ('22222222-2222-2222-2222-222222222222', 'AFCON-02', 'CE-456-CD', 48, '{"wifi","ac","tv"}'),
  ('33333333-3333-3333-3333-333333333333', 'AFCON-03', 'LT-789-EF', 48, '{"wifi","ac","reclining_seats"}'),
  ('44444444-4444-4444-4444-444444444444', 'AFCON-04', 'CE-012-GH', 48, '{"wifi","ac","tv"}')
ON CONFLICT (bus_number) DO NOTHING;

-- Clear upcoming schedules to avoid duplication
DELETE FROM public.bus_schedules WHERE departure_time >= CURRENT_DATE;

DO $$
DECLARE
  d DATE;
  dow INT;
  
  -- Record type for Nigerian departures
  TYPE RouteType IS RECORD (
    nig_city TEXT,
    cam_city TEXT,
    nig_fare DECIMAL,
    non_nig_fare DECIMAL,
    nig_dow1 INT, -- 2=Tue, 3=Wed
    nig_dow2 INT, -- 5=Fri, 6=Sat
    nig_time TIME,
    cam_dow1 INT, -- 2=Tue
    cam_dow2 INT, -- 6=Sat
    cam_time TIME
  );
  
  r RouteType;
  routes RouteType[];
  i INT;
  bus_uuid UUID := '11111111-1111-1111-1111-111111111111'::UUID;
BEGIN

  -- Define the matrix
  -- Format: (NigCity, CamCity, NigFare, NonNigFare, NigDow1, NigDow2, NigTime, CamDow1, CamDow2, CamTime)
  
  -- LAGOS (Tue=2, Fri=5 at 07:00) | Cam (Tue=2, Sat=6 at 10:00)
  routes := array_append(routes, ('Lagos', 'Yaoundé', 95000, 95000, 2, 5, '07:00:00'::TIME, 2, 6, '10:00:00'::TIME));
  routes := array_append(routes, ('Lagos', 'Douala', 90000, 90000, 2, 5, '07:00:00'::TIME, 2, 6, '10:00:00'::TIME));
  routes := array_append(routes, ('Lagos', 'Buea', 90000, 90000, 2, 5, '07:00:00'::TIME, 2, 6, '10:00:00'::TIME));
  routes := array_append(routes, ('Lagos', 'Kumba', 85000, 85000, 2, 5, '07:00:00'::TIME, 2, 6, '10:00:00'::TIME));
  routes := array_append(routes, ('Lagos', 'Mamfe', 60000, 60000, 2, 5, '07:00:00'::TIME, 2, 6, '10:00:00'::TIME));

  -- ABUJA (Tue=2, Fri=5 at 08:00) | Cam (Tue=2, Sat=6 at 18:00)
  routes := array_append(routes, ('Abuja', 'Yaoundé', 100000, 100000, 2, 5, '08:00:00'::TIME, 2, 6, '18:00:00'::TIME));
  routes := array_append(routes, ('Abuja', 'Douala', 90000, 90000, 2, 5, '08:00:00'::TIME, 2, 6, '18:00:00'::TIME));
  routes := array_append(routes, ('Abuja', 'Buea', 90000, 90000, 2, 5, '08:00:00'::TIME, 2, 6, '18:00:00'::TIME));
  routes := array_append(routes, ('Abuja', 'Kumba', 85000, 85000, 2, 5, '08:00:00'::TIME, 2, 6, '18:00:00'::TIME));
  routes := array_append(routes, ('Abuja', 'Mamfe', 65000, 65000, 2, 5, '08:00:00'::TIME, 2, 6, '18:00:00'::TIME));

  -- ABAKALIKI (Wed=3, Sat=6 at 03:00) | Cam (Tue=2, Sat=6 at 22:00)
  routes := array_append(routes, ('Abakaliki', 'Yaoundé', 65000, 70000, 3, 6, '03:00:00'::TIME, 2, 6, '22:00:00'::TIME));
  routes := array_append(routes, ('Abakaliki', 'Douala', 55000, 60000, 3, 6, '03:00:00'::TIME, 2, 6, '22:00:00'::TIME));
  routes := array_append(routes, ('Abakaliki', 'Buea', 55000, 60000, 3, 6, '03:00:00'::TIME, 2, 6, '22:00:00'::TIME));
  routes := array_append(routes, ('Abakaliki', 'Kumba', 50000, 55000, 3, 6, '03:00:00'::TIME, 2, 6, '22:00:00'::TIME));
  
  -- ENUGU (Tue=2, Fri=5 at 18:00) | Cam (Tue=2, Sat=6 at 10:00)
  routes := array_append(routes, ('Enugu', 'Yaoundé', 65000, 70000, 2, 5, '18:00:00'::TIME, 2, 6, '10:00:00'::TIME));
  routes := array_append(routes, ('Enugu', 'Douala', 55000, 60000, 2, 5, '18:00:00'::TIME, 2, 6, '10:00:00'::TIME));
  routes := array_append(routes, ('Enugu', 'Buea', 55000, 60000, 2, 5, '18:00:00'::TIME, 2, 6, '10:00:00'::TIME));
  routes := array_append(routes, ('Enugu', 'Kumba', 50000, 55000, 2, 5, '18:00:00'::TIME, 2, 6, '10:00:00'::TIME));

  -- ONITSHA (Tue=2, Fri=5 at 16:00) | Cam (Tue=2, Sat=6 at 18:00)
  routes := array_append(routes, ('Onitsha', 'Yaoundé', 65000, 70000, 2, 5, '16:00:00'::TIME, 2, 6, '18:00:00'::TIME));
  routes := array_append(routes, ('Onitsha', 'Douala', 55000, 60000, 2, 5, '16:00:00'::TIME, 2, 6, '18:00:00'::TIME));
  routes := array_append(routes, ('Onitsha', 'Buea', 55000, 60000, 2, 5, '16:00:00'::TIME, 2, 6, '18:00:00'::TIME));
  routes := array_append(routes, ('Onitsha', 'Kumba', 50000, 55000, 2, 5, '16:00:00'::TIME, 2, 6, '18:00:00'::TIME));

  -- IKOM (Wed=3, Sat=6 at 07:00) | Cam (Tue=2, Sat=6 at 10:00)
  routes := array_append(routes, ('Ikom', 'Yaoundé', 60000, 60000, 3, 6, '07:00:00'::TIME, 2, 6, '10:00:00'::TIME));
  routes := array_append(routes, ('Ikom', 'Douala', 50000, 50000, 3, 6, '07:00:00'::TIME, 2, 6, '10:00:00'::TIME));
  routes := array_append(routes, ('Ikom', 'Buea', 50000, 50000, 3, 6, '07:00:00'::TIME, 2, 6, '10:00:00'::TIME));
  routes := array_append(routes, ('Ikom', 'Kumba', 40000, 40000, 3, 6, '07:00:00'::TIME, 2, 6, '10:00:00'::TIME));

  -- Loop through the next 28 days
  FOR i IN 0..28 LOOP
    d := CURRENT_DATE + i;
    dow := EXTRACT(DOW FROM d);

    -- Loop through all mapped routes
    FOREACH r IN ARRAY routes LOOP
    
      -- Rotate buses for realism
      IF bus_uuid = '11111111-1111-1111-1111-111111111111'::UUID THEN bus_uuid := '22222222-2222-2222-2222-222222222222'::UUID;
      ELSIF bus_uuid = '22222222-2222-2222-2222-222222222222'::UUID THEN bus_uuid := '33333333-3333-3333-3333-333333333333'::UUID;
      ELSIF bus_uuid = '33333333-3333-3333-3333-333333333333'::UUID THEN bus_uuid := '44444444-4444-4444-4444-444444444444'::UUID;
      ELSE bus_uuid := '11111111-1111-1111-1111-111111111111'::UUID; END IF;

      -- Check if today matches Nigerian departure days
      IF dow = r.nig_dow1 OR dow = r.nig_dow2 THEN
        INSERT INTO public.bus_schedules (bus_id, origin, destination, departure_time, arrival_time, base_fare_fcfa, base_fare_fcfa_non_nigerian, available_seats, status)
        VALUES (
          bus_uuid, r.nig_city, r.cam_city, 
          (d + r.nig_time)::timestamp AT TIME ZONE 'UTC', 
          (d + r.nig_time + INTERVAL '12 hours')::timestamp AT TIME ZONE 'UTC', 
          r.nig_fare, r.non_nig_fare, 48, 'scheduled'
        );
      END IF;
      
      -- Check if today matches Cameroon departure days
      IF dow = r.cam_dow1 OR dow = r.cam_dow2 THEN
        INSERT INTO public.bus_schedules (bus_id, origin, destination, departure_time, arrival_time, base_fare_fcfa, base_fare_fcfa_non_nigerian, available_seats, status)
        VALUES (
          bus_uuid, r.cam_city, r.nig_city, 
          (d + r.cam_time)::timestamp AT TIME ZONE 'UTC', 
          (d + r.cam_time + INTERVAL '12 hours')::timestamp AT TIME ZONE 'UTC', 
          r.nig_fare, r.non_nig_fare, 48, 'scheduled'
        );
      END IF;

    END LOOP;
  END LOOP;
END $$;
