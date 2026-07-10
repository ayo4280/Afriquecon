-- ============================================================
-- Brevo Email Notification — Test Script
-- Run this in the Supabase SQL Editor to trigger a test email.
-- It temporarily inserts a fake row and updates it to 'paid'
-- to fire the trigger, then cleans up after itself.
-- ============================================================

DO $$
DECLARE
  v_user_id     UUID;
  v_ticket_id   TEXT := 'TEST-' || to_char(now(), 'YYYYMMDDHH24MISS');
BEGIN

  -- ── 1. Get the real user_id for ayodelesodiya@gmail.com ───────────────────
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ayodelesodiya@gmail.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User ayodelesodiya@gmail.com not found in auth.users. Make sure this account exists.';
  END IF;

  -- ── 2. Insert a fake passenger ticket with status 'pending' ───────────────
  INSERT INTO public.passenger_tickets (
    ticket_id,
    user_id,
    passenger_name,
    passenger_telegram_id,
    seat_number,
    ticket_type,
    base_fare_fcfa,
    total_fcfa,
    final_price_fcfa,
    payment_status
  ) VALUES (
    v_ticket_id,
    v_user_id,
    'Test Passenger',
    '@your_telegram_username', -- REPLACE THIS WITH YOUR USERNAME IF YOU WANT TO TEST CUSTOMER ALERT
    '12A',
    'Economy',
    15000,
    15000,
    15000,
    'pending'
  );

  -- ── 3. Update to 'paid' — this fires the trigger & sends the email ─────────
  UPDATE public.passenger_tickets
  SET payment_status = 'paid'
  WHERE ticket_id = v_ticket_id;

  RAISE NOTICE 'Test trigger fired for ticket: %', v_ticket_id;
  RAISE NOTICE 'Check the inbox of the user with id: %', v_user_id;

  -- ── 4. Clean up — remove the fake row ─────────────────────────────────────
  DELETE FROM public.passenger_tickets WHERE ticket_id = v_ticket_id;

  RAISE NOTICE 'Cleanup complete. Fake ticket deleted.';

END $$;

-- ── 5. Check if the HTTP request was queued by pg_net ──────────────────────
-- Run this separately after the block above to see the request status:
-- SELECT id, status, response FROM net._http_response ORDER BY created DESC LIMIT 5;
