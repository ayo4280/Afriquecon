-- Allow super admins to permanently delete passenger tickets, mirroring the
-- existing "Super admins can delete cargo bookings" policy on cargo_bookings.
-- passenger_tickets previously had no DELETE policy at all, so RLS silently
-- blocked every delete attempt regardless of role.

DROP POLICY IF EXISTS "Super admins can delete passenger tickets" ON public.passenger_tickets;
CREATE POLICY "Super admins can delete passenger tickets"
  ON public.passenger_tickets FOR DELETE
  USING (public.has_admin_role(ARRAY['super_admin']));
