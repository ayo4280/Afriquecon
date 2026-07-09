-- =============================================
-- AFRIQUE-CON — TELEGRAM NOTIFICATION TRIGGERS
-- Paste this in: Supabase Dashboard > SQL Editor > Run
-- =============================================

-- Step 1: Enable pg_net extension (makes HTTP calls from DB)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Create the Telegram notification function
CREATE OR REPLACE FUNCTION public.notify_telegram()
RETURNS trigger AS $$
DECLARE
  bot_token   TEXT := '8956955665:AAFluKJZCs5ZwRTLqjKjKP3NO_sjpaR-G5M';
  admin_chat  TEXT := '8342562711';
  msg         TEXT;
  api_url     TEXT;
  new_row     JSONB;
  user_telegram_id TEXT;
BEGIN
  api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
  new_row := to_jsonb(NEW);

  -- ── Passenger Ticket Notification ──────────────────────────────────────────
  IF TG_TABLE_NAME = 'passenger_tickets' THEN
    msg := '🎫 *New Ticket Booked!*' || E'\n' ||
           '━━━━━━━━━━━━━━━━━━━' || E'\n' ||
           '👤 Passenger: *' || COALESCE(new_row->>'passenger_name', 'Unknown') || '*' || E'\n' ||
           '💺 Seat: ' || COALESCE(new_row->>'seat_number', 'N/A') || E'\n' ||
           '🎟 Type: ' || COALESCE(new_row->>'ticket_type', 'standard') || E'\n' ||
           '💰 Amount: *' || COALESCE(new_row->>'total_fcfa', '0') || ' FCFA*' || E'\n' ||
           '📋 Ticket ID: `' || COALESCE(new_row->>'ticket_id', 'N/A') || '`' || E'\n' ||
           '━━━━━━━━━━━━━━━━━━━' || E'\n' ||
           '📅 ' || TO_CHAR(NOW(), 'DD Mon YYYY HH24:MI');
           
    user_telegram_id := new_row->>'passenger_telegram_id';

  -- ── Cargo Booking Notification ──────────────────────────────────────────────
  ELSIF TG_TABLE_NAME = 'cargo_bookings' THEN
    msg := '📦 *New Cargo Shipment!*' || E'\n' ||
           '━━━━━━━━━━━━━━━━━━━' || E'\n' ||
           '👤 Sender: *' || COALESCE(new_row->>'customer_name', 'Unknown') || '*' || E'\n' ||
           '📍 Route: ' || COALESCE(new_row->>'origin', '?') || ' → ' || COALESCE(new_row->>'destination', '?') || E'\n' ||
           '⚖️ Weight: ' || COALESCE(new_row->>'weight_kg', '0') || ' kg' || E'\n' ||
           '💰 Amount: *' || COALESCE(new_row->>'total_fcfa', '0') || ' FCFA*' || E'\n' ||
           '📋 Booking ID: `' || COALESCE(new_row->>'booking_id', 'N/A') || '`' || E'\n' ||
           '━━━━━━━━━━━━━━━━━━━' || E'\n' ||
           '📅 ' || TO_CHAR(NOW(), 'DD Mon YYYY HH24:MI');
           
    user_telegram_id := new_row->>'customer_telegram_id';
  END IF;

  -- Send to admin chat
  PERFORM net.http_post(
    url     := api_url,
    body    := json_build_object(
                 'chat_id',    admin_chat,
                 'text',       msg,
                 'parse_mode', 'Markdown'
               )::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  -- Send to user chat (if provided)
  IF user_telegram_id IS NOT NULL AND NULLIF(TRIM(user_telegram_id), '') IS NOT NULL THEN
    PERFORM net.http_post(
      url     := api_url,
      body    := json_build_object(
                   'chat_id',    user_telegram_id,
                   'text',       '🎉 *Your booking is confirmed!*' || E'\n\n' || msg,
                   'parse_mode', 'Markdown'
                 )::jsonb,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Attach trigger to passenger_tickets
DROP TRIGGER IF EXISTS trg_notify_telegram_ticket ON public.passenger_tickets;
CREATE TRIGGER trg_notify_telegram_ticket
  AFTER INSERT ON public.passenger_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_telegram();

-- Step 4: Attach trigger to cargo_bookings
DROP TRIGGER IF EXISTS trg_notify_telegram_cargo ON public.cargo_bookings;
CREATE TRIGGER trg_notify_telegram_cargo
  AFTER INSERT ON public.cargo_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_telegram();

-- ✅ Done! Every new booking now sends a Telegram message to the admin.
