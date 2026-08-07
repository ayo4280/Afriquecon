-- Fix Telegram admin notifications so all configured management chat IDs
-- (not a single hardcoded one) receive an alert whenever a cargo or
-- passenger payment is confirmed.
--
-- Vault secret `telegram_admin_chat_id` must hold every admin's numeric
-- Telegram chat ID, separated by commas or semicolons, e.g.
--   111111111,222222222,333333333

-- 1. Shared fan-out helper: sends one Telegram message per configured admin.
CREATE OR REPLACE FUNCTION public.notify_telegram_admins(
  p_api_url text,
  p_message text,
  p_parse_mode text DEFAULT NULL,
  p_timeout_ms integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  raw_ids text;
  chat_id text;
  body jsonb;
BEGIN
  SELECT decrypted_secret INTO raw_ids
  FROM vault.decrypted_secrets
  WHERE name = 'telegram_admin_chat_id'
  LIMIT 1;

  IF raw_ids IS NULL OR btrim(raw_ids) = '' THEN
    RETURN;
  END IF;

  FOREACH chat_id IN ARRAY regexp_split_to_array(raw_ids, '\s*[,;]\s*')
  LOOP
    chat_id := btrim(chat_id);
    CONTINUE WHEN chat_id = '' OR chat_id !~ '^-?[0-9]+$';

    body := jsonb_build_object('chat_id', chat_id, 'text', p_message);
    IF p_parse_mode IS NOT NULL THEN
      body := body || jsonb_build_object('parse_mode', p_parse_mode);
    END IF;

    PERFORM net.http_post(
      url := p_api_url,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := body,
      timeout_milliseconds := coalesce(p_timeout_ms, 5000)
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_telegram_admins(text, text, text, integer) FROM PUBLIC;

-- 2. Consolidated payment-paid notifier: replaces the old hardcoded-admin
-- version and any half-finished duplicate trigger path.
CREATE OR REPLACE FUNCTION public.notify_telegram()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  bot_token text;
  api_url text;
  msg text;
  new_row jsonb;
  raw_telegram_id text;
  customer_chat_id bigint;
BEGIN
  IF NEW.payment_status IS DISTINCT FROM 'paid'
     OR OLD.payment_status IS NOT DISTINCT FROM 'paid' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO bot_token
  FROM vault.decrypted_secrets
  WHERE name = 'telegram_bot_token'
  LIMIT 1;
  IF bot_token IS NULL OR btrim(bot_token) = '' THEN
    RETURN NEW;
  END IF;

  api_url := 'https://api.telegram.org/bot' || btrim(bot_token) || '/sendMessage';
  new_row := to_jsonb(NEW);

  IF TG_TABLE_NAME = 'passenger_tickets' THEN
    msg := 'New Ticket Booked!' || E'\n' ||
      'Passenger: ' || coalesce(new_row->>'passenger_name', 'Unknown') || E'\n' ||
      'Seat: ' || coalesce(new_row->>'seat_number', 'N/A') || E'\n' ||
      'Type: ' || coalesce(new_row->>'ticket_type', 'standard') || E'\n' ||
      'Amount: ' || coalesce(new_row->>'total_fcfa', '0') || ' FCFA' || E'\n' ||
      'Ticket ID: ' || coalesce(new_row->>'ticket_id', 'N/A');
    raw_telegram_id := new_row->>'passenger_telegram_id';
  ELSIF TG_TABLE_NAME = 'cargo_bookings' THEN
    msg := 'New Cargo Shipment!' || E'\n' ||
      'Sender: ' || coalesce(new_row->>'customer_name', 'Unknown') || E'\n' ||
      'Route: ' || coalesce(new_row->>'origin', '?') || ' -> ' || coalesce(new_row->>'destination', '?') || E'\n' ||
      'Weight: ' || coalesce(new_row->>'weight_kg', '0') || ' kg' || E'\n' ||
      'Amount: ' || coalesce(new_row->>'total_fcfa', '0') || ' FCFA' || E'\n' ||
      'Booking ID: ' || coalesce(new_row->>'booking_id', 'N/A');
    raw_telegram_id := new_row->>'customer_telegram_id';
  ELSE
    RETURN NEW;
  END IF;

  -- Every configured admin gets this, regardless of customer contact info.
  PERFORM public.notify_telegram_admins(api_url, msg, 'Markdown');

  customer_chat_id := public.resolve_telegram_chat_id(raw_telegram_id);
  IF customer_chat_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := api_url,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object(
        'chat_id', customer_chat_id,
        'text', 'Your booking is confirmed.' || E'\n\n' || msg,
        'parse_mode', 'Markdown'
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_telegram failed: %', sqlerrm;
  RETURN NEW;
END;
$$;

-- 3. Remove a competing, incomplete duplicate path if one was ever created
-- (a same-purpose trigger left half-finished on a previous attempt) so
-- admins get exactly one alert per payment, not zero or two.
DROP FUNCTION IF EXISTS public.notify_admin_payment_telegram() CASCADE;

-- 4. Attach the fixed function fresh, regardless of prior enabled/disabled
-- trigger state.
DROP TRIGGER IF EXISTS trg_notify_telegram_cargo ON public.cargo_bookings;
CREATE TRIGGER trg_notify_telegram_cargo
  AFTER UPDATE OF payment_status ON public.cargo_bookings
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid')
  EXECUTE FUNCTION public.notify_telegram();

DROP TRIGGER IF EXISTS trg_notify_telegram_ticket ON public.passenger_tickets;
CREATE TRIGGER trg_notify_telegram_ticket
  AFTER UPDATE OF payment_status ON public.passenger_tickets
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid')
  EXECUTE FUNCTION public.notify_telegram();
