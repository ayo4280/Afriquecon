-- =============================================
-- AFRIQUE-CON — TELEGRAM WEBHOOK & TRIGGER SETUP
-- Paste this in: Supabase Dashboard > SQL Editor > Run
-- =============================================

-- 1. Create table to store the username to chat_id mapping
CREATE TABLE IF NOT EXISTS public.telegram_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    chat_id BIGINT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow anon/service_role to read/write, but typical RLS depends on your setup.
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.telegram_users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.telegram_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.telegram_users FOR UPDATE USING (true);


-- 2. Update the notify_telegram function to look up the chat_id from telegram_users
CREATE OR REPLACE FUNCTION public.notify_telegram()
RETURNS trigger AS $$
DECLARE
  bot_token        TEXT := '8956955665:AAFluKJZCs5ZwRTLqjKjKP3NO_sjpaR-G5M';
  admin_chat       TEXT := '8342562711';
  msg              TEXT;
  api_url          TEXT;
  new_row          JSONB;
  raw_telegram_id  TEXT;
  resolved_chat_id BIGINT;
BEGIN
  api_url := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
  new_row := to_jsonb(NEW);

  -- We only want to trigger this when a booking becomes PAID
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN

    -- ── Passenger Ticket Notification ──────────────────────────────────────────
    IF TG_TABLE_NAME = 'passenger_tickets' THEN
      msg := '🎫 *New Ticket Booked!*' || E'\n' ||
             '━━━━━━━━━━━━━━━━━━━' || E'\n' ||
             '👤 Passenger: *' || COALESCE(new_row->>'passenger_name', 'Unknown') || '*' || E'\n' ||
             '💺 Seat: ' || COALESCE(new_row->>'seat_number', 'N/A') || E'\n' ||
             '🎟 Type: ' || COALESCE(new_row->>'ticket_type', 'standard') || E'\n' ||
             '💰 Amount: *' || COALESCE(new_row->>'total_fcfa', '0') || ' FCFA*' || E'\n' ||
             '📋 Ticket ID: `' || COALESCE(new_row->>'ticket_id', 'N/A') || '`' || E'\n' ||
             '━━━━━━━━━━━━━━━━━━━' || E'\n' ||
             '📅 ' || TO_CHAR(NOW(), 'DD Mon YYYY HH24:MI');

      raw_telegram_id := TRIM(new_row->>'passenger_telegram_id');

    -- ── Cargo Booking Notification ──────────────────────────────────────────────
    ELSIF TG_TABLE_NAME = 'cargo_bookings' THEN
      msg := '📦 *New Cargo Shipment!*' || E'\n' ||
             '━━━━━━━━━━━━━━━━━━━' || E'\n' ||
             '👤 Sender: *' || COALESCE(new_row->>'customer_name', 'Unknown') || '*' || E'\n' ||
             '📍 Route: ' || COALESCE(new_row->>'origin', '?') || ' → ' || COALESCE(new_row->>'destination', '?') || E'\n' ||
             '⚖️ Weight: ' || COALESCE(new_row->>'weight_kg', '0') || ' kg' || E'\n' ||
             '💰 Amount: *' || COALESCE(new_row->>'total_fcfa', '0') || ' FCFA*' || E'\n' ||
             '📋 Booking ID: `' || COALESCE(new_row->>'booking_id', 'N/A') || '`' || E'\n' ||
             '━━━━━━━━━━━━━━━━━━━' || E'\n' ||
             '📅 ' || TO_CHAR(NOW(), 'DD Mon YYYY HH24:MI');

      raw_telegram_id := TRIM(new_row->>'customer_telegram_id');
    END IF;

    -- ── Always notify admin ─────────────────────────────────────────────────────
    PERFORM net.http_post(
      url     := api_url,
      body    := json_build_object(
                   'chat_id',    admin_chat,
                   'text',       msg,
                   'parse_mode', 'Markdown'
                 )::jsonb,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );

    -- ── Notify user if Telegram ID provided ─────────────────────────────────────
    IF raw_telegram_id IS NOT NULL AND raw_telegram_id <> '' THEN
      -- Strip any '@' provided by the user
      raw_telegram_id := LTRIM(raw_telegram_id, '@');
      
      -- Look up the numeric chat_id from telegram_users
      SELECT chat_id INTO resolved_chat_id 
      FROM public.telegram_users 
      WHERE username = raw_telegram_id 
      LIMIT 1;

      -- Send message if mapping found
      IF resolved_chat_id IS NOT NULL THEN
        PERFORM net.http_post(
          url     := api_url,
          body    := json_build_object(
                       'chat_id',    resolved_chat_id,
                       'text',       '🎉 *Your booking is confirmed!*' || E'\n\n' || msg,
                       'parse_mode', 'Markdown'
                     )::jsonb,
          headers := '{"Content-Type": "application/json"}'::jsonb
        );
      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
