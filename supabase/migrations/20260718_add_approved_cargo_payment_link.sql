-- A manager-approved large cargo quote is paid using the original booking and
-- original payment reference. This replaces the approval notification with a
-- secure profile payment link; the route itself verifies the signed-in owner.

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
  app_url text;
  payment_url text;
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

  SELECT decrypted_secret INTO app_url FROM vault.decrypted_secrets WHERE name = 'app_url' LIMIT 1;
  app_url := coalesce(nullif(rtrim(app_url, '/'), ''), 'https://afriquecon.vercel.app');
  payment_url := app_url || '/cargo/pay/' || NEW.booking_id;
  telegram_message := 'Your Afriquecon cargo quote has been approved.' || E'\n\n' ||
    'Booking: ' || NEW.booking_id || E'\n' ||
    'Route: ' || NEW.origin || ' -> ' || NEW.destination || E'\n' ||
    'Negotiated price: ' || NEW.total_fcfa || ' FCFA' || E'\n\n' ||
    'Pay securely here: ' || payment_url;

  SELECT decrypted_secret INTO bot_token FROM vault.decrypted_secrets WHERE name = 'telegram_bot_token' LIMIT 1;
  customer_chat_id := public.resolve_telegram_chat_id(NEW.customer_telegram_id);
  IF bot_token IS NOT NULL AND customer_chat_id IS NOT NULL THEN
    api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
    PERFORM net.http_post(url := api_url, headers := '{"Content-Type":"application/json"}'::jsonb, body := jsonb_build_object('chat_id', customer_chat_id, 'text', telegram_message));
  END IF;

  SELECT decrypted_secret INTO brevo_api_key FROM vault.decrypted_secrets WHERE name = 'brevo_api_key' LIMIT 1;
  SELECT decrypted_secret INTO sender_email FROM vault.decrypted_secrets WHERE name = 'brevo_sender_email' LIMIT 1;
  IF brevo_api_key IS NOT NULL AND nullif(NEW.customer_email, '') IS NOT NULL THEN
    sender_email := coalesce(nullif(sender_email, ''), 'asodiya99@gmail.com');
    email_subject := 'Afriquecon: Pay your approved cargo quote (' || NEW.booking_id || ')';
    email_html := '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>Your cargo quote is approved</h2><p>Your negotiated price is <strong>' || NEW.total_fcfa || ' FCFA</strong>.</p><p><a href="' || payment_url || '">Pay your approved quote securely</a></p></div>';
    PERFORM net.http_post(url := 'https://api.brevo.com/v3/smtp/email', headers := jsonb_build_object('api-key', brevo_api_key, 'accept', 'application/json', 'content-type', 'application/json'), body := jsonb_build_object('sender', jsonb_build_object('name', 'Afriquecon', 'email', sender_email), 'to', jsonb_build_array(jsonb_build_object('email', NEW.customer_email)), 'subject', email_subject, 'htmlContent', email_html));
  END IF;
  RETURN NEW;
END;
$$;
