-- =============================================
-- AFRIQUE-CON — RESEND EMAIL NOTIFICATION TRIGGERS
-- Paste this in: Supabase Dashboard > SQL Editor > Run
-- =============================================

-- Ensure pg_net is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 1: Create the Resend email notification function
CREATE OR REPLACE FUNCTION public.notify_email_resend()
RETURNS trigger AS $$
DECLARE
  resend_api_key TEXT := 're_U8VBNVXQ_BEZxNB2bTan1DPeu1c5MUJmK';
  api_url        TEXT := 'https://api.resend.com/emails';
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

    -- Send HTTP POST to Resend API
    IF customer_email IS NOT NULL THEN
      PERFORM net.http_post(
        url     := api_url,
        headers := jsonb_build_object(
                     'Authorization', 'Bearer ' || resend_api_key,
                     'Content-Type', 'application/json'
                   ),
        body    := jsonb_build_object(
                     'from', 'Afrique-con <onboarding@resend.dev>',
                     'to', jsonb_build_array(customer_email),
                     'subject', email_subject,
                     'html', email_html
                   )
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Attach trigger to passenger_tickets on UPDATE
DROP TRIGGER IF EXISTS trg_notify_email_ticket ON public.passenger_tickets;
CREATE TRIGGER trg_notify_email_ticket
  AFTER UPDATE ON public.passenger_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_email_resend();

-- Step 3: Attach trigger to cargo_bookings on UPDATE
DROP TRIGGER IF EXISTS trg_notify_email_cargo ON public.cargo_bookings;
CREATE TRIGGER trg_notify_email_cargo
  AFTER UPDATE ON public.cargo_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_email_resend();

-- ✅ Done! Emails will now be sent automatically whenever a booking is marked as 'paid'
