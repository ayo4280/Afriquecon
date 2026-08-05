-- Ensure paid cargo and passenger transitions notify every configured admin.
-- IS DISTINCT FROM is intentional: it treats NULL -> paid as a real transition.

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
  WHERE name = 'telegram_bot_token'
  LIMIT 1;

  IF bot_token IS NULL THEN
    RETURN NEW;
  END IF;

  api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
  new_row := to_jsonb(NEW);

  IF NEW.payment_status = 'paid'
     AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
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

ALTER FUNCTION public.notify_telegram() OWNER TO postgres;
