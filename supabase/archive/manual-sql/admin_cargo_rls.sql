-- =============================================
-- ADMIN RLS FIX FOR CARGO STATUS UPDATES
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Allow Admin to UPDATE cargo_bookings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cargo_bookings' AND policyname='Admin can update cargo') THEN
    CREATE POLICY "Admin can update cargo"
      ON public.cargo_bookings FOR UPDATE
      USING (auth.jwt() ->> 'email' IN ('testuser3@afrique-con.com', 'admin@afrique-con.com', 'ayodelesodiya@gmail.com'));
  END IF;
END $$;

-- 2. Allow Admin to INSERT into cargo_status_log
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cargo_status_log' AND policyname='Admin can insert cargo logs') THEN
    CREATE POLICY "Admin can insert cargo logs"
      ON public.cargo_status_log FOR INSERT
      WITH CHECK (auth.jwt() ->> 'email' IN ('testuser3@afrique-con.com', 'admin@afrique-con.com', 'ayodelesodiya@gmail.com'));
  END IF;
END $$;

-- 3. Allow Admin to SELECT from cargo_status_log (just in case they need to view them later)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cargo_status_log' AND policyname='Admin can view cargo logs') THEN
    CREATE POLICY "Admin can view cargo logs"
      ON public.cargo_status_log FOR SELECT
      USING (auth.jwt() ->> 'email' IN ('testuser3@afrique-con.com', 'admin@afrique-con.com', 'ayodelesodiya@gmail.com'));
  END IF;
END $$;
