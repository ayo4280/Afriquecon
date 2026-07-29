-- Audit trail for staff ticket verification scans.
CREATE TABLE IF NOT EXISTS public.ticket_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id text NOT NULL,
  scanned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  result text NOT NULL CHECK (result IN ('valid', 'invalid')),
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_scan_logs_ticket_id_idx
  ON public.ticket_scan_logs (ticket_id, created_at DESC);

ALTER TABLE public.ticket_scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view ticket scan logs" ON public.ticket_scan_logs;
CREATE POLICY "Staff can view ticket scan logs"
  ON public.ticket_scan_logs FOR SELECT
  USING (public.has_admin_role(ARRAY['agent', 'manager', 'super_admin']));

DROP POLICY IF EXISTS "Staff can insert ticket scan logs" ON public.ticket_scan_logs;
CREATE POLICY "Staff can insert ticket scan logs"
  ON public.ticket_scan_logs FOR INSERT
  WITH CHECK (public.has_admin_role(ARRAY['agent', 'manager', 'super_admin']));

REVOKE ALL ON TABLE public.ticket_scan_logs FROM anon;
GRANT SELECT, INSERT ON TABLE public.ticket_scan_logs TO authenticated;
