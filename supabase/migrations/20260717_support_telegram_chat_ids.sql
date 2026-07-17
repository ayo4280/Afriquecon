-- Accept both Telegram numeric chat IDs and usernames for customer notifications.
-- A user must still have started @Afriquecon_bot before Telegram permits a
-- private message. Numeric chat IDs are delivered to directly; usernames are
-- resolved from the service-managed public.telegram_users mapping.

CREATE OR REPLACE FUNCTION public.resolve_telegram_chat_id(identifier text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned_identifier text;
  resolved_chat_id bigint;
BEGIN
  cleaned_identifier := nullif(trim(identifier), '');
  IF cleaned_identifier IS NULL THEN
    RETURN NULL;
  END IF;

  IF cleaned_identifier ~ '^-?[0-9]+$' THEN
    BEGIN
      RETURN cleaned_identifier::bigint;
    EXCEPTION WHEN numeric_value_out_of_range THEN
      RETURN NULL;
    END;
  END IF;

  SELECT chat_id
  INTO resolved_chat_id
  FROM public.telegram_users
  WHERE lower(username) = lower(ltrim(cleaned_identifier, '@'))
  LIMIT 1;

  RETURN resolved_chat_id;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_telegram_chat_id(text) FROM PUBLIC;

-- The existing paid-booking trigger handles exact username matches. This
-- companion trigger covers numeric chat IDs and username case differences
-- without duplicating notifications for exact matches.
CREATE OR REPLACE FUNCTION public.notify_customer_telegram_by_identifier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  raw_identifier text;
  mapped_username text;
  customer_chat_id bigint;
  bot_token text;
  api_url text;
  message text;
BEGIN
  IF NEW.payment_status IS DISTINCT FROM 'paid'
     OR OLD.payment_status = 'paid' THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'cargo_bookings' THEN
    raw_identifier := NEW.customer_telegram_id;
    message := 'Your cargo booking is confirmed.' || E'\n\n' ||
      'Booking ID: ' || coalesce(NEW.booking_id, 'N/A') || E'\n' ||
      'Route: ' || coalesce(NEW.origin, '?') || ' -> ' || coalesce(NEW.destination, '?') || E'\n' ||
      'Amount: ' || coalesce(NEW.total_fcfa::text, '0') || ' FCFA';
  ELSIF TG_TABLE_NAME = 'passenger_tickets' THEN
    raw_identifier := NEW.passenger_telegram_id;
    message := 'Your passenger ticket is confirmed.' || E'\n\n' ||
      'Ticket ID: ' || coalesce(NEW.ticket_id, 'N/A') || E'\n' ||
      'Seat: ' || coalesce(NEW.seat_number, 'N/A') || E'\n' ||
      'Amount: ' || coalesce(NEW.total_fcfa::text, '0') || ' FCFA';
  ELSE
    RETURN NEW;
  END IF;

  raw_identifier := nullif(trim(raw_identifier), '');
  IF raw_identifier IS NULL THEN
    RETURN NEW;
  END IF;

  IF raw_identifier !~ '^-?[0-9]+$' THEN
    SELECT username
    INTO mapped_username
    FROM public.telegram_users
    WHERE lower(username) = lower(ltrim(raw_identifier, '@'))
    LIMIT 1;

    IF mapped_username = ltrim(raw_identifier, '@') THEN
      RETURN NEW;
    END IF;
  END IF;

  customer_chat_id := public.resolve_telegram_chat_id(raw_identifier);
  IF customer_chat_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret
  INTO bot_token
  FROM vault.decrypted_secrets
  WHERE name = 'telegram_bot_token'
  LIMIT 1;
  IF bot_token IS NULL THEN
    RETURN NEW;
  END IF;

  api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
  PERFORM net.http_post(
    url := api_url,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object('chat_id', customer_chat_id, 'text', message)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_customer_telegram_identifier_cargo ON public.cargo_bookings;
CREATE TRIGGER trg_notify_customer_telegram_identifier_cargo
  AFTER UPDATE ON public.cargo_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_customer_telegram_by_identifier();

DROP TRIGGER IF EXISTS trg_notify_customer_telegram_identifier_ticket ON public.passenger_tickets;
CREATE TRIGGER trg_notify_customer_telegram_identifier_ticket
  AFTER UPDATE ON public.passenger_tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_customer_telegram_by_identifier();

-- Tracking/status updates now also work when a numeric chat ID was supplied.
CREATE OR REPLACE FUNCTION public.notify_cargo_status_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  shipment record;
  bot_token text;
  admin_chat_id text;
  customer_chat_id bigint;
  api_url text;
  message text;
BEGIN
  SELECT booking_id, origin, destination, customer_telegram_id
  INTO shipment
  FROM public.cargo_bookings
  WHERE id = NEW.booking_id;
  IF shipment IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO bot_token
  FROM vault.decrypted_secrets
  WHERE name = 'telegram_bot_token'
  LIMIT 1;
  IF bot_token IS NULL THEN
    RETURN NEW;
  END IF;

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

  SELECT decrypted_secret INTO admin_chat_id
  FROM vault.decrypted_secrets
  WHERE name = 'telegram_admin_chat_id'
  LIMIT 1;
  IF admin_chat_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := api_url,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('chat_id', admin_chat_id, 'text', message)
    );
  END IF;

  RETURN NEW;
END;
$$;
