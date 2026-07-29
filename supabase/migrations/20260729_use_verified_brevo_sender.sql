-- Use the verified domain sender for payment confirmation emails.
-- The previous function hard-coded the legacy Gmail sender, which caused
-- Brevo to rewrite the From address to a brevosend.com fallback address.

CREATE OR REPLACE FUNCTION public.notify_email_brevo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  brevo_api_key text;
  sender_email text;
  customer_email text;
  email_subject text;
  email_html text;
BEGIN
  IF NEW.payment_status IS DISTINCT FROM 'paid'
     OR OLD.payment_status IS NOT DISTINCT FROM 'paid' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO brevo_api_key
  FROM vault.decrypted_secrets
  WHERE name = 'brevo_api_key'
  LIMIT 1;

  SELECT decrypted_secret INTO sender_email
  FROM vault.decrypted_secrets
  WHERE name = 'brevo_sender_email'
  LIMIT 1;

  sender_email := COALESCE(NULLIF(sender_email, ''), 'noreply@afriquecon.com');

  IF brevo_api_key IS NULL THEN
    RAISE WARNING 'notify_email_brevo: brevo_api_key not found in Vault';
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'passenger_tickets' THEN
    SELECT email INTO customer_email FROM auth.users WHERE id = NEW.user_id;
    IF customer_email IS NULL THEN RETURN NEW; END IF;

    email_subject := 'Afrique-con: Your Ticket is Confirmed! (TKT: ' || NEW.ticket_id || ')';
    email_html := '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
      || '<h2 style="color:#0ea5e9">Ticket Confirmed!</h2>'
      || '<p>Hello <strong>' || COALESCE(NEW.passenger_name, 'Passenger') || '</strong>,</p>'
      || '<p>Your payment of <strong>' || NEW.total_fcfa || ' FCFA</strong> was successful.</p>'
      || '<p><strong>Ticket ID:</strong> ' || NEW.ticket_id || '</p>'
      || '<p>Thank you for traveling with Afrique-con PLC!</p></div>';
  ELSIF TG_TABLE_NAME = 'cargo_bookings' THEN
    customer_email := NEW.customer_email;
    IF customer_email IS NULL THEN RETURN NEW; END IF;

    email_subject := 'Afrique-con: Cargo Shipment Booked! (ID: ' || NEW.booking_id || ')';
    email_html := '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">'
      || '<h2 style="color:#0ea5e9">Shipment Confirmed!</h2>'
      || '<p>Hello <strong>' || COALESCE(NEW.customer_name, 'Sender') || '</strong>,</p>'
      || '<p>Your payment of <strong>' || NEW.total_fcfa || ' FCFA</strong> was successful.</p>'
      || '<p><strong>Tracking ID:</strong> ' || NEW.booking_id || '</p>'
      || '<p><strong>Route:</strong> ' || NEW.origin || ' to ' || NEW.destination || '</p>'
      || '<p><strong>Weight:</strong> ' || NEW.weight_kg || ' kg</p>'
      || '<p>Thank you for choosing Afrique-con PLC!</p></div>';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object(
      'api-key', brevo_api_key,
      'accept', 'application/json',
      'content-type', 'application/json'
    ),
    body := jsonb_build_object(
      'sender', jsonb_build_object('name', 'Afrique-con', 'email', sender_email),
      'to', jsonb_build_array(jsonb_build_object('email', customer_email)),
      'subject', email_subject,
      'htmlContent', email_html
    )
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_email_brevo() IS
  'Sends payment confirmation emails using the verified brevo_sender_email Vault secret.';
