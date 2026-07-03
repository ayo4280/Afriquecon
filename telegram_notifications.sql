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
  bot_token   TEXT := '8811953720:AAHb-PsCxdh4I2vpaL6tVw7_qbQrcKnjW9Y';
  admin_chat  TEXT := '8342562711';
  msg         TEXT;
  api_url     TEXT;
BEGIN
  api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';

  -- ── Passenger Ticket Notification ──────────────────────────────────────────
  IF TG_TABLE_NAME = 'passenger_tickets' THEN
    msg := '🎫 *New Ticket Booked!*' || E'\n' ||
           '━━━━━━━━━━━━━━━━━━━' || E'\n' ||
           '👤 Passenger: *' || COALESCE(NEW.passenger_name, 'Unknown') || '*' || E'\n' ||
           '💺 Seat: ' || COALESCE(NEW.seat_number, 'N/A') || E'\n' ||
           '🎟 Type: ' || COALESCE(NEW.ticket_type, 'standard') || E'\n' ||
           '💰 Amount: *' || COALESCE(NEW.total_fcfa::TEXT, '0') || ' FCFA*' || E'\n' ||
           '📋 Ticket ID: `' || COALESCE(NEW.ticket_id, 'N/A') || '`' || E'\n' ||
           '━━━━━━━━━━━━━━━━━━━' || E'\n' ||
           '📅 ' || TO_CHAR(NOW(), 'DD Mon YYYY HH24:MI');

  -- ── Cargo Booking Notification ──────────────────────────────────────────────
  ELSIF TG_TABLE_NAME = 'cargo_bookings' THEN
    msg := '📦 *New Cargo Shipment!*' || E'\n' ||
           '━━━━━━━━━━━━━━━━━━━' || E'\n' ||
           '👤 Sender: *' || COALESCE(NEW.customer_name, 'Unknown') || '*' || E'\n' ||
           '📍 Route: ' || COALESCE(NEW.origin, '?') || ' → ' || COALESCE(NEW.destination, '?') || E'\n' ||
           '⚖️ Weight: ' || COALESCE(NEW.weight_kg::TEXT, '0') || ' kg' || E'\n' ||
           '💰 Amount: *' || COALESCE(NEW.total_fcfa::TEXT, '0') || ' FCFA*' || E'\n' ||
           '📋 Booking ID: `' || COALESCE(NEW.booking_id, 'N/A') || '`' || E'\n' ||
           '━━━━━━━━━━━━━━━━━━━' || E'\n' ||
           '📅 ' || TO_CHAR(NOW(), 'DD Mon YYYY HH24:MI');
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
