-- =============================================
-- AFRIQUE-CON — BREVO EMAIL NOTIFICATION TRIGGERS
-- Paste this in: Supabase Dashboard > SQL Editor > Run
-- =============================================
-- ⚠️  IMPORTANT INSTRUCTIONS FOR BREVO (Sendinblue):
-- 1. Create a free account at https://www.brevo.com
-- 2. Go to your Profile > SMTP & API > Generate a new API Key
-- 3. Replace 'YOUR_BREVO_API_KEY' below with your actual API key
-- 4. Replace 'your-email@gmail.com' with the email address you registered on Brevo with
-- =============================================

-- Ensure pg_net is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Ensure final_price_fcfa column exists (fixes silent INSERT failures)
ALTER TABLE public.passenger_tickets ADD COLUMN IF NOT EXISTS final_price_fcfa DECIMAL(10,2);

-- Step 1: Create the Brevo email notification function
CREATE OR REPLACE FUNCTION public.notify_email_brevo()
RETURNS trigger AS $$
DECLARE
  brevo_api_key  TEXT := '<YOUR_BREVO_API_KEY>'; -- Replace with your actual Brevo API Key
  api_url        TEXT := 'https://api.brevo.com/v3/smtp/email';
  sender_email   TEXT := 'your-email@gmail.com'; -- MUST be your Brevo registered email
  sender_name    TEXT := 'Afrique-con';
  customer_email TEXT;
  email_subject  TEXT;
  email_html     TEXT;
BEGIN
  -- We only want to trigger this when a booking becomes PAID
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN

    -- ── Passenger Ticket Notification ──────────────────────────────────────────
    IF TG_TABLE_NAME = 'passenger_tickets' THEN
      -- Fetch user email from auth.users (since passenger_tickets only has user_id)
      SELECT email INTO customer_email FROM auth.users WHERE id = NEW.user_id;
      
      IF customer_email IS NULL THEN
        RETURN NEW;
      END IF;

      email_subject := 'Afrique-con: Your Ticket is Confirmed! (TKT: ' || NEW.ticket_id || ')';
      email_html := '
        <div style="font-family: sans-serif; max-w-lg; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Ticket Confirmed! 🎫</h2>
          <p>Hello <strong>' || COALESCE(NEW.passenger_name, 'Passenger') || '</strong>,</p>
          <p>Your payment of <strong>' || NEW.total_fcfa || ' FCFA</strong> was successful. Here are your ticket details:</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Ticket ID:</strong> ' || NEW.ticket_id || '</p>
            <p><strong>Seat:</strong> ' || NEW.seat_number || '</p>
            <p><strong>Type:</strong> ' || NEW.ticket_type || '</p>
          </div>
          <p>Thank you for traveling with Afrique-con PLC!</p>
        </div>
      ';

    -- ── Cargo Booking Notification ──────────────────────────────────────────────
    ELSIF TG_TABLE_NAME = 'cargo_bookings' THEN
      customer_email := NEW.customer_email;
      
      IF customer_email IS NULL THEN
        RETURN NEW;
      END IF;

      email_subject := 'Afrique-con: Cargo Shipment Booked! (ID: ' || NEW.booking_id || ')';
      email_html := '
        <div style="font-family: sans-serif; max-w-lg; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Shipment Confirmed! 📦</h2>
          <p>Hello <strong>' || COALESCE(NEW.customer_name, 'Sender') || '</strong>,</p>
          <p>Your payment of <strong>' || NEW.total_fcfa || ' FCFA</strong> was successful. Your cargo is now being processed.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tracking ID:</strong> ' || NEW.booking_id || '</p>
            <p><strong>Route:</strong> ' || NEW.origin || ' to ' || NEW.destination || '</p>
            <p><strong>Weight:</strong> ' || NEW.weight_kg || ' kg</p>
            <p><strong>Recipient:</strong> ' || NEW.recipient_name || '</p>
          </div>
          <p>You can track your shipment on our website using your Tracking ID.</p>
          <p>Thank you for choosing Afrique-con PLC!</p>
        </div>
      ';
    END IF;

    -- Send HTTP POST to Brevo API
    IF customer_email IS NOT NULL THEN
      PERFORM net.http_post(
        url     := api_url,
        headers := jsonb_build_object(
                     'api-key', brevo_api_key,
                     'accept', 'application/json',
                     'content-type', 'application/json'
                   ),
        body    := jsonb_build_object(
                     'sender', jsonb_build_object('name', sender_name, 'email', sender_email),
                     'to', jsonb_build_array(jsonb_build_object('email', customer_email)),
                     'subject', email_subject,
                     'htmlContent', email_html
                   )
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Clean up old Resend triggers if they exist
DROP TRIGGER IF EXISTS trg_notify_email_ticket ON public.passenger_tickets;
DROP TRIGGER IF EXISTS trg_notify_email_cargo ON public.cargo_bookings;
DROP FUNCTION IF EXISTS public.notify_email_resend();

-- Step 3: Attach Brevo trigger to passenger_tickets on UPDATE
CREATE TRIGGER trg_notify_email_ticket
  AFTER UPDATE ON public.passenger_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_email_brevo();

-- Step 4: Attach Brevo trigger to cargo_bookings on UPDATE
CREATE TRIGGER trg_notify_email_cargo
  AFTER UPDATE ON public.cargo_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_email_brevo();

-- ✅ Done! Emails will now be sent automatically via Brevo whenever a booking is marked as 'paid'
