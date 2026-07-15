-- Afrique-con security hardening migration
-- Apply this once through the Supabase SQL editor or Supabase CLI.
-- Before applying, ensure the first super administrator has an active row in
-- public.admin_users. No email addresses are hard-coded in this migration.

CREATE OR REPLACE FUNCTION public.current_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.admin_users
  WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    AND active = true
    AND role IN ('agent', 'manager', 'super_admin')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_admin_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.current_admin_role() = ANY(allowed_roles), false);
$$;

REVOKE ALL ON FUNCTION public.current_admin_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_admin_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_role(text[]) TO authenticated;

-- Remove the previous email-list policies. User-owned policies remain intact.
DROP POLICY IF EXISTS "Admin can view all tickets" ON public.passenger_tickets;
DROP POLICY IF EXISTS "Admin can update tickets" ON public.passenger_tickets;
DROP POLICY IF EXISTS "Admin can view all cargo" ON public.cargo_bookings;
DROP POLICY IF EXISTS "Admin can update cargo" ON public.cargo_bookings;
DROP POLICY IF EXISTS "Admin can delete cargo bookings" ON public.cargo_bookings;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can insert cargo logs" ON public.cargo_status_log;
DROP POLICY IF EXISTS "Admin can view cargo logs" ON public.cargo_status_log;
DROP POLICY IF EXISTS "Admin can insert schedules" ON public.bus_schedules;
DROP POLICY IF EXISTS "Admin can update schedules" ON public.bus_schedules;
DROP POLICY IF EXISTS "Admin can delete bus schedules" ON public.bus_schedules;
DROP POLICY IF EXISTS "Admins can update routes" ON public.routes;
DROP POLICY IF EXISTS "Admins can insert routes" ON public.routes;
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can update admin_users" ON public.admin_users;

CREATE POLICY "Staff can view passenger tickets"
  ON public.passenger_tickets FOR SELECT
  USING (public.has_admin_role(ARRAY['agent', 'manager', 'super_admin']));

CREATE POLICY "Staff can update passenger tickets"
  ON public.passenger_tickets FOR UPDATE
  USING (public.has_admin_role(ARRAY['agent', 'manager', 'super_admin']))
  WITH CHECK (public.has_admin_role(ARRAY['agent', 'manager', 'super_admin']));

CREATE POLICY "Staff can view cargo bookings"
  ON public.cargo_bookings FOR SELECT
  USING (public.has_admin_role(ARRAY['agent', 'manager', 'super_admin']));

CREATE POLICY "Staff can update cargo bookings"
  ON public.cargo_bookings FOR UPDATE
  USING (public.has_admin_role(ARRAY['agent', 'manager', 'super_admin']))
  WITH CHECK (public.has_admin_role(ARRAY['agent', 'manager', 'super_admin']));

CREATE POLICY "Super admins can delete cargo bookings"
  ON public.cargo_bookings FOR DELETE
  USING (public.has_admin_role(ARRAY['super_admin']));

CREATE POLICY "Staff can view profiles"
  ON public.profiles FOR SELECT
  USING (public.has_admin_role(ARRAY['agent', 'manager', 'super_admin']));

CREATE POLICY "Staff can insert cargo status logs"
  ON public.cargo_status_log FOR INSERT
  WITH CHECK (public.has_admin_role(ARRAY['agent', 'manager', 'super_admin']));

CREATE POLICY "Staff can view cargo status logs"
  ON public.cargo_status_log FOR SELECT
  USING (public.has_admin_role(ARRAY['agent', 'manager', 'super_admin']));

CREATE POLICY "Managers can insert schedules"
  ON public.bus_schedules FOR INSERT
  WITH CHECK (public.has_admin_role(ARRAY['manager', 'super_admin']));

CREATE POLICY "Managers can update schedules"
  ON public.bus_schedules FOR UPDATE
  USING (public.has_admin_role(ARRAY['manager', 'super_admin']))
  WITH CHECK (public.has_admin_role(ARRAY['manager', 'super_admin']));

CREATE POLICY "Super admins can delete schedules"
  ON public.bus_schedules FOR DELETE
  USING (public.has_admin_role(ARRAY['super_admin']));

CREATE POLICY "Super admins can update routes"
  ON public.routes FOR UPDATE
  USING (public.has_admin_role(ARRAY['super_admin']))
  WITH CHECK (public.has_admin_role(ARRAY['super_admin']));

CREATE POLICY "Super admins can insert routes"
  ON public.routes FOR INSERT
  WITH CHECK (public.has_admin_role(ARRAY['super_admin']));

CREATE POLICY "Super admins can view staff accounts"
  ON public.admin_users FOR SELECT
  USING (public.has_admin_role(ARRAY['super_admin']));

CREATE POLICY "Super admins can add staff accounts"
  ON public.admin_users FOR INSERT
  WITH CHECK (public.has_admin_role(ARRAY['super_admin']));

CREATE POLICY "Super admins can update staff accounts"
  ON public.admin_users FOR UPDATE
  USING (public.has_admin_role(ARRAY['super_admin']))
  WITH CHECK (public.has_admin_role(ARRAY['super_admin']));

-- Telegram username-to-chat mappings are written only by the service-role
-- webhook. They must never be publicly readable or writable.
DO $$
BEGIN
  IF to_regclass('public.telegram_users') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.telegram_users;
    DROP POLICY IF EXISTS "Enable insert access for all users" ON public.telegram_users;
    DROP POLICY IF EXISTS "Enable update access for all users" ON public.telegram_users;
  END IF;
END $$;
