-- =============================================
-- UPDATE ADMIN RLS POLICIES
-- Adds ayodelesodiya@gmail.com as admin
-- Run this in: Supabase Dashboard > SQL Editor > Run
-- =============================================

-- ── DROP old policies ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can view all tickets"    ON public.passenger_tickets;
DROP POLICY IF EXISTS "Admin can view all cargo"      ON public.cargo_bookings;
DROP POLICY IF EXISTS "Admin can view all profiles"   ON public.profiles;
DROP POLICY IF EXISTS "Admin can update cargo"        ON public.cargo_bookings;
DROP POLICY IF EXISTS "Admin can insert cargo logs"   ON public.cargo_status_log;
DROP POLICY IF EXISTS "Admin can view cargo logs"     ON public.cargo_status_log;
DROP POLICY IF EXISTS "Admin can insert schedules"    ON public.bus_schedules;
DROP POLICY IF EXISTS "Admin can update schedules"    ON public.bus_schedules;

-- ── RECREATE with updated admin email list ──────────────────────────────────────

-- 1. Admin can view ALL passenger tickets
CREATE POLICY "Admin can view all tickets"
  ON public.passenger_tickets FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );

-- 2. Admin can view ALL cargo bookings
CREATE POLICY "Admin can view all cargo"
  ON public.cargo_bookings FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );

-- 3. Admin can view ALL profiles
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );

-- 4. Admin can UPDATE cargo bookings
CREATE POLICY "Admin can update cargo"
  ON public.cargo_bookings FOR UPDATE
  USING (
    auth.jwt() ->> 'email' IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );

-- 5. Admin can INSERT into cargo_status_log
CREATE POLICY "Admin can insert cargo logs"
  ON public.cargo_status_log FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );

-- 6. Admin can SELECT from cargo_status_log
CREATE POLICY "Admin can view cargo logs"
  ON public.cargo_status_log FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );

-- 7. Admin can INSERT into bus_schedules
CREATE POLICY "Admin can insert schedules"
  ON public.bus_schedules FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );

-- 8. Admin can UPDATE bus_schedules
CREATE POLICY "Admin can update schedules"
  ON public.bus_schedules FOR UPDATE
  USING (
    auth.jwt() ->> 'email' IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );

-- ✅ Done! ayodelesodiya@gmail.com now has full admin database access.
