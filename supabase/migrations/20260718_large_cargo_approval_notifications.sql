-- Large cargo (100 kg+) requires a negotiated quote before payment.
-- Telegram is used for immediate alerts; Brevo email is used as a record for
-- the customer when a manager confirms the negotiated price.
--
-- Required Vault secrets:
--   telegram_bot_token, telegram_admin_chat_id, brevo_api_key
-- Optional Vault secrets:
--   app_url (defaults to the current production URL)
--   brevo_sender_email (defaults to the verified legacy sender)

CREATE EXTENSION IF NOT EXISTS pg_net;

ALTER TABLE public.cargo_bookings
  ADD COLUMN IF NOT EXISTS approval_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by text;

CREATE OR REPLACE FUNCTION public.notify_management_large_cargo_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  bot_token text;
  admin_chat_id text;
  app_url text;
  api_url text;
  message text;
BEGIN
  IF NEW.weight_kg < 100 OR coalesce(NEW.total_fcfa, 0) > 0 THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO bot_token
  FROM vault.decrypted_secrets WHERE name = 'telegram_bot_token' LIMIT 1;
  SELECT decrypted_secret INTO admin_chat_id
  FROM vault.decrypted_secrets WHERE name = 'telegram_admin_chat_id' LIMIT 1;
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
    body := jsonb_build_object('chat_id', admin_chat_id, 'text', message)
  );

  UPDATE public.cargo_bookings
  SET approval_requested_at = coalesce(approval_requested_at, now())
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_management_large_cargo_request ON public.cargo_bookings;
CREATE TRIGGER trg_notify_management_large_cargo_request
  AFTER INSERT ON public.cargo_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_management_large_cargo_request();

CREATE OR REPLACE FUNCTION public.notify_customer_large_cargo_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  bot_token text;
  customer_chat_id bigint;
  api_url text;
  telegram_message text;
  brevo_api_key text;
  sender_email text;
  email_subject text;
  email_html text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'confirmed'
     OR coalesce(NEW.total_fcfa, 0) <= 0
     OR coalesce(OLD.total_fcfa, 0) > 0 THEN
    RETURN NEW;
  END IF;

  UPDATE public.cargo_bookings
  SET approved_at = coalesce(approved_at, now()), approved_by = coalesce(approved_by, current_setting('request.jwt.claim.email', true))
  WHERE id = NEW.id;

  telegram_message := 'Your Afriquecon cargo quote has been approved.' || E'\n\n' ||
    'Booking: ' || NEW.booking_id || E'\n' ||
    'Route: ' || NEW.origin || ' -> ' || NEW.destination || E'\n' ||
    'Negotiated price: ' || NEW.total_fcfa || ' FCFA' || E'\n\n' ||
    'Our team will contact you to complete payment.';

  SELECT decrypted_secret INTO bot_token
  FROM vault.decrypted_secrets WHERE name = 'telegram_bot_token' LIMIT 1;
  customer_chat_id := public.resolve_telegram_chat_id(NEW.customer_telegram_id);
  IF bot_token IS NOT NULL AND customer_chat_id IS NOT NULL THEN
    api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
    PERFORM net.http_post(
      url := api_url,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('chat_id', customer_chat_id, 'text', telegram_message)
    );
  END IF;

  SELECT decrypted_secret INTO brevo_api_key
  FROM vault.decrypted_secrets WHERE name = 'brevo_api_key' LIMIT 1;
  SELECT decrypted_secret INTO sender_email
  FROM vault.decrypted_secrets WHERE name = 'brevo_sender_email' LIMIT 1;
  IF brevo_api_key IS NOT NULL AND nullif(NEW.customer_email, '') IS NOT NULL THEN
    sender_email := coalesce(nullif(sender_email, ''), 'asodiya99@gmail.com');
    email_subject := 'Afriquecon: Your cargo quote is approved (' || NEW.booking_id || ')';
    email_html := '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">' ||
      '<h2>Your cargo quote is approved</h2>' ||
      '<p>Hello <strong>' || coalesce(NEW.customer_name, 'Customer') || '</strong>,</p>' ||
      '<p>Your negotiated Afriquecon cargo quote is ready.</p>' ||
      '<p><strong>Booking:</strong> ' || NEW.booking_id || '<br>' ||
      '<strong>Route:</strong> ' || NEW.origin || ' to ' || NEW.destination || '<br>' ||
      '<strong>Weight:</strong> ' || NEW.weight_kg || ' kg<br>' ||
      '<strong>Negotiated price:</strong> ' || NEW.total_fcfa || ' FCFA</p>' ||
      '<p>Our team will contact you to complete payment.</p></div>';
    PERFORM net.http_post(
      url := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object('api-key', brevo_api_key, 'accept', 'application/json', 'content-type', 'application/json'),
      body := jsonb_build_object(
        'sender', jsonb_build_object('name', 'Afriquecon', 'email', sender_email),
        'to', jsonb_build_array(jsonb_build_object('email', NEW.customer_email)),
        'subject', email_subject,
        'htmlContent', email_html
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_customer_large_cargo_approved ON public.cargo_bookings;
CREATE TRIGGER trg_notify_customer_large_cargo_approved
  AFTER UPDATE OF status, total_fcfa ON public.cargo_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_customer_large_cargo_approved();
