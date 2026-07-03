-- =============================================
-- AFRIQUE-CON PLC — DATABASE MIGRATION
-- Paste this entire file into:
-- Supabase Dashboard > SQL Editor > Run
-- =============================================

-- ─────────────────────────────────────────────
-- STEP 1: Create missing PROFILES table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  telegram_id TEXT,
  full_name TEXT,
  country TEXT,
  auth_provider TEXT,
  user_type TEXT DEFAULT 'passenger',
  notification_channel TEXT DEFAULT 'telegram',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- STEP 2: Fix PASSENGER_TICKETS table
-- ─────────────────────────────────────────────

-- Drop the UUID foreign key on schedule_id (app now sends text like 'SCHED-20260701-MORN')
ALTER TABLE public.passenger_tickets
  DROP CONSTRAINT IF EXISTS passenger_tickets_schedule_id_fkey;

-- Change schedule_id column from UUID → TEXT
ALTER TABLE public.passenger_tickets
  ALTER COLUMN schedule_id TYPE TEXT USING schedule_id::TEXT;

-- Make email/phone nullable (app doesn't always send these)
ALTER TABLE public.passenger_tickets
  ALTER COLUMN passenger_email DROP NOT NULL;
ALTER TABLE public.passenger_tickets
  ALTER COLUMN passenger_phone DROP NOT NULL;

-- Add missing columns
ALTER TABLE public.passenger_tickets
  ADD COLUMN IF NOT EXISTS discount_fcfa DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.passenger_tickets
  ADD COLUMN IF NOT EXISTS luggage_fee_fcfa DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.passenger_tickets
  ADD COLUMN IF NOT EXISTS total_fcfa DECIMAL(10,2);

-- Backfill total_fcfa from old final_price_fcfa column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='passenger_tickets' AND column_name='final_price_fcfa') THEN
    UPDATE public.passenger_tickets
      SET total_fcfa = final_price_fcfa
      WHERE total_fcfa IS NULL;
  END IF;
END $$;

-- Enable RLS + policies
ALTER TABLE public.passenger_tickets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='passenger_tickets' AND policyname='Users can view own tickets') THEN
    CREATE POLICY "Users can view own tickets" ON public.passenger_tickets FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='passenger_tickets' AND policyname='Users can insert own tickets') THEN
    CREATE POLICY "Users can insert own tickets" ON public.passenger_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- STEP 3: Fix CARGO_BOOKINGS table
-- ─────────────────────────────────────────────

ALTER TABLE public.cargo_bookings
  ADD COLUMN IF NOT EXISTS is_express BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cargo_bookings
  ADD COLUMN IF NOT EXISTS discounts_fcfa DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.cargo_bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cargo_bookings' AND policyname='Users can view own cargo bookings') THEN
    CREATE POLICY "Users can view own cargo bookings" ON public.cargo_bookings FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cargo_bookings' AND policyname='Users can insert own cargo bookings') THEN
    CREATE POLICY "Users can insert own cargo bookings" ON public.cargo_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- STEP 4: Enable RLS on public lookup tables
-- ─────────────────────────────────────────────

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='routes' AND policyname='Routes are public') THEN
    CREATE POLICY "Routes are public" ON public.routes FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE public.bus_schedules ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bus_schedules' AND policyname='Schedules are public') THEN
    CREATE POLICY "Schedules are public" ON public.bus_schedules FOR SELECT USING (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- DONE ✓
-- Your database is now fully compatible with
-- the updated Afrique-con app code.
-- ─────────────────────────────────────────────
