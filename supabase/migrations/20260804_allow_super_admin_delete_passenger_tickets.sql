-- Allow only active super administrators to permanently remove an individual
-- passenger ticket from the admin dashboard. The UI action is protected by
-- this policy, so direct API calls cannot bypass the role check.

DROP POLICY IF EXISTS "Super admins can delete passenger tickets"
  ON public.passenger_tickets;

CREATE POLICY "Super admins can delete passenger tickets"
  ON public.passenger_tickets FOR DELETE
  USING (public.has_admin_role(ARRAY['super_admin']));

GRANT DELETE ON TABLE public.passenger_tickets TO authenticated;
