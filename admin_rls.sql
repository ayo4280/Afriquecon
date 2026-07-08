-- =============================================
-- ADMIN RLS POLICIES
-- Run this in Supabase SQL Editor to let the
-- admin user see ALL tickets and cargo bookings
-- =============================================

-- Admin can view ALL passenger tickets
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='passenger_tickets' AND policyname='Admin can view all tickets') THEN
    CREATE POLICY "Admin can view all tickets"
      ON public.passenger_tickets FOR SELECT
      USING (
        auth.jwt() ->> 'email' IN ('testuser3@afrique-con.com', 'admin@afrique-con.com', 'ayodelesodiya@gmail.com')
      );
  END IF;
END $$;

-- Admin can view ALL cargo bookings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cargo_bookings' AND policyname='Admin can view all cargo') THEN
    CREATE POLICY "Admin can view all cargo"
      ON public.cargo_bookings FOR SELECT
      USING (
        auth.jwt() ->> 'email' IN ('testuser3@afrique-con.com', 'admin@afrique-con.com', 'ayodelesodiya@gmail.com')
      );
  END IF;
END $$;

-- Admin can view ALL profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Admin can view all profiles') THEN
    CREATE POLICY "Admin can view all profiles"
      ON public.profiles FOR SELECT
      USING (
        auth.jwt() ->> 'email' IN ('testuser3@afrique-con.com', 'admin@afrique-con.com', 'ayodelesodiya@gmail.com')
      );
  END IF;
END $$;
