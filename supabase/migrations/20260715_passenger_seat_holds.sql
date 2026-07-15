-- Fifteen-minute passenger seat holds.
-- Apply after the security and payment webhook migrations.

ALTER TABLE public.passenger_tickets
  ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz;

-- Existing pending tickets get a short grace period after this migration;
-- verified tickets are never released by the hold cleanup.
UPDATE public.passenger_tickets
SET reservation_expires_at = now() + interval '15 minutes'
WHERE payment_status = 'pending'
  AND reservation_expires_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS passenger_tickets_schedule_seat_unique
  ON public.passenger_tickets (schedule_id, seat_number);

CREATE INDEX IF NOT EXISTS passenger_tickets_pending_hold_idx
  ON public.passenger_tickets (reservation_expires_at)
  WHERE payment_status = 'pending';

-- Tickets are now created only by the authenticated reservation Edge Function,
-- which validates availability and computes pricing from the schedule.
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.passenger_tickets;
