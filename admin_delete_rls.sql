-- =============================================
-- ADMIN DELETE RLS POLICIES
-- Run this in Supabase SQL Editor to let the
-- super admin users DELETE cargo bookings and schedules
-- =============================================

-- 1. Enable DELETE for cargo_bookings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cargo_bookings' AND policyname='Admin can delete cargo bookings') THEN
    CREATE POLICY "Admin can delete cargo bookings"
      ON public.cargo_bookings FOR DELETE
      USING (
        auth.jwt() ->> 'email' IN ('testuser3@afrique-con.com', 'admin@afrique-con.com', 'ayodelesodiya@gmail.com')
      );
  END IF;
END $$;

-- 2. Enable DELETE for bus_schedules
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bus_schedules' AND policyname='Admin can delete bus schedules') THEN
    CREATE POLICY "Admin can delete bus schedules"
      ON public.bus_schedules FOR DELETE
      USING (
        auth.jwt() ->> 'email' IN ('testuser3@afrique-con.com', 'admin@afrique-con.com', 'ayodelesodiya@gmail.com')
      );
  END IF;
END $$;
