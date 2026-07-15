-- Cargo status notifications
-- Requires pg_net, Vault secret `telegram_bot_token`, and (optionally)
-- Vault secret `telegram_admin_chat_id`.

CREATE EXTENSION IF NOT EXISTS pg_net;

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

  IF shipment IS NULL THEN RETURN NEW; END IF;

  SELECT decrypted_secret INTO bot_token
  FROM vault.decrypted_secrets WHERE name = 'telegram_bot_token' LIMIT 1;
  IF bot_token IS NULL THEN RETURN NEW; END IF;

  api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
  message := '📦 *Shipment update*' || E'\n\n' ||
    'Tracking ID: `' || shipment.booking_id || '`' || E'\n' ||
    'Route: ' || shipment.origin || ' → ' || shipment.destination || E'\n' ||
    'Status: *' || replace(initcap(replace(NEW.status, '_', ' ')), '_', ' ') || '*' ||
    CASE WHEN NEW.location IS NOT NULL AND NEW.location <> '' THEN E'\nLocation: ' || NEW.location ELSE '' END ||
    CASE WHEN NEW.notes IS NOT NULL AND NEW.notes <> '' THEN E'\nDetails: ' || NEW.notes ELSE '' END;

  IF shipment.customer_telegram_id IS NOT NULL AND shipment.customer_telegram_id <> '' THEN
    SELECT chat_id INTO customer_chat_id
    FROM public.telegram_users
    WHERE lower(username) = lower(ltrim(shipment.customer_telegram_id, '@'))
    LIMIT 1;

    IF customer_chat_id IS NOT NULL THEN
      PERFORM net.http_post(
        url := api_url,
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := jsonb_build_object('chat_id', customer_chat_id, 'text', message, 'parse_mode', 'Markdown')
      );
    END IF;
  END IF;

  SELECT decrypted_secret INTO admin_chat_id
  FROM vault.decrypted_secrets WHERE name = 'telegram_admin_chat_id' LIMIT 1;
  IF admin_chat_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := api_url,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('chat_id', admin_chat_id, 'text', message, 'parse_mode', 'Markdown')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_cargo_status_update ON public.cargo_status_log;
CREATE TRIGGER trg_notify_cargo_status_update
  AFTER INSERT ON public.cargo_status_log
  FOR EACH ROW EXECUTE FUNCTION public.notify_cargo_status_update();
