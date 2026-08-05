-- Send management Telegram notifications to every configured administrator.
-- Store comma-, semicolon-, or newline-separated numeric chat IDs in the
-- Vault secret `telegram_admin_chat_id`.

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_telegram_admins(
  p_api_url text,
  p_message text,
  p_parse_mode text DEFAULT NULL,
  p_timeout_milliseconds integer DEFAULT 15000
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  configured_ids text;
  chat_id text;
  payload jsonb;
BEGIN
  SELECT decrypted_secret INTO configured_ids
  FROM vault.decrypted_secrets
  WHERE name = 'telegram_admin_chat_id'
  LIMIT 1;

  IF configured_ids IS NULL OR nullif(trim(configured_ids), '') IS NULL THEN
    RETURN;
  END IF;

  FOREACH chat_id IN ARRAY regexp_split_to_array(configured_ids, '[,;[:space:]]+') LOOP
    chat_id := trim(chat_id);
    IF chat_id ~ '^-?[0-9]+$' THEN
      payload := jsonb_build_object('chat_id', chat_id, 'text', p_message);
      IF p_parse_mode IS NOT NULL AND p_parse_mode <> '' THEN
        payload := payload || jsonb_build_object('parse_mode', p_parse_mode);
      END IF;
      PERFORM net.http_post(
        url := p_api_url,
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := payload,
        timeout_milliseconds := p_timeout_milliseconds
      );
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_telegram_admins(text, text, text, integer) FROM PUBLIC;

-- Cargo status updates: preserve customer delivery and fan out the admin copy.
CREATE OR REPLACE FUNCTION public.notify_cargo_status_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  shipment record;
  bot_token text;
  customer_chat_id bigint;
  api_url text;
  message text;
BEGIN
  SELECT booking_id, origin, destination, customer_telegram_id
  INTO shipment
  FROM public.cargo_bookings
  WHERE id = NEW.booking_id;
  IF shipment IS NULL THEN RETURN NEW; END IF;

  SELECT decrypted_secret INTO bot_token
  FROM vault.decrypted_secrets WHERE name = 'telegram_bot_token' LIMIT 1;
  IF bot_token IS NULL THEN RETURN NEW; END IF;

  api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
  message := 'Shipment update' || E'\n\n' ||
    'Tracking ID: ' || shipment.booking_id || E'\n' ||
    'Route: ' || shipment.origin || ' -> ' || shipment.destination || E'\n' ||
    'Status: ' || replace(initcap(replace(NEW.status, '_', ' ')), '_', ' ') ||
    CASE WHEN NEW.location IS NOT NULL AND NEW.location <> '' THEN E'\nLocation: ' || NEW.location ELSE '' END ||
    CASE WHEN NEW.notes IS NOT NULL AND NEW.notes <> '' THEN E'\nDetails: ' || NEW.notes ELSE '' END;

  customer_chat_id := public.resolve_telegram_chat_id(shipment.customer_telegram_id);
  IF customer_chat_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := api_url,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('chat_id', customer_chat_id, 'text', message)
    );
  END IF;

  PERFORM public.notify_telegram_admins(api_url, message);
  RETURN NEW;
END;
$$;

-- Large/express approval requests: fan out before payment is possible.
CREATE OR REPLACE FUNCTION public.notify_management_large_cargo_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  bot_token text;
  admin_chat_ids text;
  app_url text;
  api_url text;
  message text;
BEGIN
  IF (NOT coalesce(NEW.is_express, false) AND NEW.weight_kg < 100)
     OR (NOT coalesce(NEW.is_express, false) AND coalesce(NEW.total_fcfa, 0) > 0) THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO bot_token
  FROM vault.decrypted_secrets WHERE name = 'telegram_bot_token' LIMIT 1;
  SELECT decrypted_secret INTO admin_chat_ids
  FROM vault.decrypted_secrets WHERE name = 'telegram_admin_chat_id' LIMIT 1;
  SELECT decrypted_secret INTO app_url
  FROM vault.decrypted_secrets WHERE name = 'app_url' LIMIT 1;

  IF bot_token IS NULL OR admin_chat_ids IS NULL THEN RETURN NEW; END IF;

  app_url := coalesce(nullif(rtrim(app_url, '/'), ''), 'https://www.afriquecon.com');
  api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
  message := CASE WHEN coalesce(NEW.is_express, false)
      THEN 'Express cargo approval required'
      ELSE 'Large cargo approval required' END || E'\n\n' ||
    'Booking: ' || NEW.booking_id || E'\n' ||
    'Route: ' || NEW.origin || ' -> ' || NEW.destination || E'\n' ||
    'Weight: ' || NEW.weight_kg || ' kg' || E'\n' ||
    CASE WHEN coalesce(NEW.is_express, false) THEN 'Service: Express' || E'\n' ELSE '' END ||
    'Customer: ' || NEW.customer_name || E'\n' ||
    'Phone: ' || NEW.customer_phone || E'\n\n' ||
    'Open the dashboard to set the negotiated price and confirm: ' || app_url || '/admin';

  PERFORM public.notify_telegram_admins(api_url, message, NULL, 15000);

  UPDATE public.cargo_bookings
  SET approval_requested_at = coalesce(approval_requested_at, now())
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Legacy paid-booking trigger: keep its existing customer behavior while
-- replacing its hard-coded single administrator with the Vault fan-out.
CREATE OR REPLACE FUNCTION public.notify_telegram()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  bot_token text;
  msg text;
  api_url text;
  new_row jsonb;
  raw_telegram_id text;
  resolved_chat_id bigint;
BEGIN
  SELECT decrypted_secret INTO bot_token
  FROM vault.decrypted_secrets
  WHERE name = 'telegram_bot_token' LIMIT 1;
  IF bot_token IS NULL THEN RETURN NEW; END IF;

  api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
  new_row := to_jsonb(NEW);

  IF NEW.payment_status = 'paid' AND OLD.payment_status <> 'paid' THEN
    IF TG_TABLE_NAME = 'passenger_tickets' THEN
      msg := 'New Ticket Booked!' || E'\n' ||
        'Passenger: ' || coalesce(new_row->>'passenger_name', 'Unknown') || E'\n' ||
        'Seat: ' || coalesce(new_row->>'seat_number', 'N/A') || E'\n' ||
        'Type: ' || coalesce(new_row->>'ticket_type', 'standard') || E'\n' ||
        'Amount: ' || coalesce(new_row->>'total_fcfa', '0') || ' FCFA' || E'\n' ||
        'Ticket ID: ' || coalesce(new_row->>'ticket_id', 'N/A');
      raw_telegram_id := trim(new_row->>'passenger_telegram_id');
    ELSIF TG_TABLE_NAME = 'cargo_bookings' THEN
      msg := 'New Cargo Shipment!' || E'\n' ||
        'Sender: ' || coalesce(new_row->>'customer_name', 'Unknown') || E'\n' ||
        'Route: ' || coalesce(new_row->>'origin', '?') || ' -> ' || coalesce(new_row->>'destination', '?') || E'\n' ||
        'Weight: ' || coalesce(new_row->>'weight_kg', '0') || ' kg' || E'\n' ||
        'Amount: ' || coalesce(new_row->>'total_fcfa', '0') || ' FCFA' || E'\n' ||
        'Booking ID: ' || coalesce(new_row->>'booking_id', 'N/A');
      raw_telegram_id := trim(new_row->>'customer_telegram_id');
    ELSE
      RETURN NEW;
    END IF;

    PERFORM public.notify_telegram_admins(api_url, msg, 'Markdown');

    IF raw_telegram_id IS NOT NULL AND raw_telegram_id <> '' THEN
      raw_telegram_id := ltrim(raw_telegram_id, '@');
      SELECT chat_id INTO resolved_chat_id
      FROM public.telegram_users
      WHERE lower(username) = lower(raw_telegram_id)
      LIMIT 1;
      IF resolved_chat_id IS NOT NULL THEN
        PERFORM net.http_post(
          url := api_url,
          body := jsonb_build_object(
            'chat_id', resolved_chat_id,
            'text', 'Your booking is confirmed.' || E'\n\n' || msg,
            'parse_mode', 'Markdown'
          ),
          headers := '{"Content-Type":"application/json"}'::jsonb
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
