-- =============================================
-- AFRIQUE-CON PLC - DATABASE SCHEMA
-- Apply this in: Supabase Dashboard > SQL Editor
-- =============================================

-- PROFILES (extends auth.users - use this instead of a 'users' table)
-- NOTE: 'users' table conflicts with Supabase's internal auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  telegram_id TEXT,
  full_name TEXT,
  country TEXT,           -- 'NG' or 'CM'
  auth_provider TEXT,     -- 'email', 'google'
  user_type TEXT DEFAULT 'passenger',
  notification_channel TEXT DEFAULT 'telegram',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- ROUTES (Master Data - public read)
-- =============================================
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  origin_code TEXT,
  destination TEXT NOT NULL,
  destination_code TEXT,
  base_rate_fcfa DECIMAL(10,2) NOT NULL,
  estimated_hours INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Routes are public" ON public.routes FOR SELECT USING (true);

-- =============================================
-- BUS FLEET
-- =============================================
CREATE TABLE IF NOT EXISTS public.buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number TEXT UNIQUE NOT NULL,
  registration_plate TEXT UNIQUE NOT NULL,
  capacity INTEGER DEFAULT 48,
  condition TEXT DEFAULT 'operational',
  features TEXT[] DEFAULT '{"wifi","ac","reclining_seats"}',
  last_maintenance TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- BUS SCHEDULES
-- =============================================
CREATE TABLE IF NOT EXISTS public.bus_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES public.buses(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP NOT NULL,
  base_fare_fcfa DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'scheduled',
  available_seats INTEGER DEFAULT 48,
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.bus_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schedules are public" ON public.bus_schedules FOR SELECT USING (true);

-- =============================================
-- PASSENGER TICKETS
-- schedule_id is TEXT to support mock schedule IDs
-- =============================================
CREATE TABLE IF NOT EXISTS public.passenger_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT UNIQUE NOT NULL,
  schedule_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  passenger_name TEXT NOT NULL,
  passenger_email TEXT,
  passenger_phone TEXT,
  passenger_telegram_id TEXT,
  id_type TEXT,
  id_number TEXT,
  seat_number TEXT NOT NULL,
  ticket_type TEXT,
  base_fare_fcfa DECIMAL(10,2) NOT NULL,
  discount_fcfa DECIMAL(10,2) DEFAULT 0,
  luggage_fee_fcfa DECIMAL(10,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  total_fcfa DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  ticket_status TEXT DEFAULT 'confirmed',
  check_in_time TIMESTAMP,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_2h_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.passenger_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tickets"   ON public.passenger_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON public.passenger_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- CARGO BOOKINGS
-- =============================================
CREATE TABLE IF NOT EXISTS public.cargo_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  quote_id TEXT,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  weight_kg DECIMAL(8,2) NOT NULL,
  cargo_type TEXT,
  is_express BOOLEAN DEFAULT FALSE,
  base_rate_fcfa DECIMAL(10,2) NOT NULL,
  surcharges_fcfa DECIMAL(10,2) DEFAULT 0,
  discounts_fcfa DECIMAL(10,2) DEFAULT 0,
  total_fcfa DECIMAL(10,2) NOT NULL,
  currency_used TEXT DEFAULT 'FCFA',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_telegram_id TEXT,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  booking_date TIMESTAMP DEFAULT NOW(),
  scheduled_pickup TIMESTAMP,
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE public.cargo_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cargo bookings"   ON public.cargo_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cargo bookings" ON public.cargo_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- CARGO STATUS HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS public.cargo_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.cargo_bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  telegram_sent BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW(),
  updated_by TEXT
);

-- =============================================
-- SEAT INVENTORY
-- =============================================
CREATE TABLE IF NOT EXISTS public.seat_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.bus_schedules(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  ticket_id UUID REFERENCES public.passenger_tickets(id),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TELEGRAM MESSAGE LOG
-- =============================================
CREATE TABLE IF NOT EXISTS public.telegram_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  telegram_id TEXT NOT NULL,
  message_type TEXT,
  reference_id TEXT,
  message_text TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  delivery_confirmed BOOLEAN DEFAULT FALSE,
  response_received BOOLEAN DEFAULT FALSE
);

-- =============================================
-- ADMIN USERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  branch TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

