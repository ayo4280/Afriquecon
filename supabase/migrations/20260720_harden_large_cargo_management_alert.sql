-- Large-cargo requests are created from the public booking flow. Telegram can
-- occasionally take longer than pg_net's short default timeout, so use the
-- validated 15-second timeout and parse the Vault chat ID defensively.

CREATE OR REPLACE FUNCTION public.notify_management_large_cargo_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  bot_token text;
  admin_chat_id bigint;
  app_url text;
  api_url text;
  message text;
BEGIN
  IF NEW.weight_kg < 100 OR coalesce(NEW.total_fcfa, 0) > 0 THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO bot_token
  FROM vault.decrypted_secrets WHERE name = 'telegram_bot_token' LIMIT 1;

  BEGIN
    SELECT nullif(trim(decrypted_secret), '')::bigint INTO admin_chat_id
    FROM vault.decrypted_secrets WHERE name = 'telegram_admin_chat_id' LIMIT 1;
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
    RETURN NEW;
  END;

  SELECT decrypted_secret INTO app_url
  FROM vault.decrypted_secrets WHERE name = 'app_url' LIMIT 1;

  IF bot_token IS NULL OR admin_chat_id IS NULL THEN
    RETURN NEW;
  END IF;

  app_url := coalesce(nullif(rtrim(app_url, '/'), ''), 'https://afriquecon.vercel.app');
  api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
  message := 'Large cargo approval required' || E'\n\n' ||
    'Booking: ' || NEW.booking_id || E'\n' ||
    'Route: ' || NEW.origin || ' -> ' || NEW.destination || E'\n' ||
    'Weight: ' || NEW.weight_kg || ' kg' || E'\n' ||
    'Customer: ' || NEW.customer_name || E'\n' ||
    'Phone: ' || NEW.customer_phone || E'\n\n' ||
    'Open the dashboard to set the negotiated price and confirm: ' || app_url || '/admin';

  PERFORM net.http_post(
    url := api_url,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object('chat_id', admin_chat_id, 'text', message),
    timeout_milliseconds := 15000
  );

  UPDATE public.cargo_bookings
  SET approval_requested_at = coalesce(approval_requested_at, now())
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;
