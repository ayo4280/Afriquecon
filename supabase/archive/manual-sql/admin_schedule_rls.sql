-- =============================================
-- ADMIN RLS FIX FOR BUS SCHEDULES
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Allow Admin to INSERT into bus_schedules
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bus_schedules' AND policyname='Admin can insert schedules') THEN
    CREATE POLICY "Admin can insert schedules"
      ON public.bus_schedules FOR INSERT
      WITH CHECK (auth.jwt() ->> 'email' IN ('testuser3@afrique-con.com', 'admin@afrique-con.com', 'ayodelesodiya@gmail.com'));
  END IF;
END $$;

-- 2. Allow Admin to UPDATE bus_schedules (optional but useful)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bus_schedules' AND policyname='Admin can update schedules') THEN
    CREATE POLICY "Admin can update schedules"
      ON public.bus_schedules FOR UPDATE
      USING (auth.jwt() ->> 'email' IN ('testuser3@afrique-con.com', 'admin@afrique-con.com', 'ayodelesodiya@gmail.com'));
  END IF;
END $$;
