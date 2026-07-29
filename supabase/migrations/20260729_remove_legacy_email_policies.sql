-- Remove legacy policies that hard-coded administrator email addresses.
-- The role-based policies created by 20260715_security_hardening.sql are the
-- single source of truth and respect active/inactive admin status.

DROP POLICY IF EXISTS "Admins can update schedules" ON public.bus_schedules;

DROP POLICY IF EXISTS "Admins can update all cargo bookings" ON public.cargo_bookings;
DROP POLICY IF EXISTS "Admins can view all cargo bookings" ON public.cargo_bookings;

DROP POLICY IF EXISTS "Admins can update all tickets" ON public.passenger_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.passenger_tickets;
