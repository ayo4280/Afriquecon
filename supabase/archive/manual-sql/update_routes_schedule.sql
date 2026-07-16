-- =============================================
-- AFRIQUE-CON PLC — UPDATE ROUTES SCHEDULES
-- Paste this entire file into:
-- Supabase Dashboard > SQL Editor > Run
-- =============================================

-- 1. Add new columns to routes table if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='routes' AND column_name='departure_days') THEN
    ALTER TABLE public.routes ADD COLUMN departure_days TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='routes' AND column_name='departure_time') THEN
    ALTER TABLE public.routes ADD COLUMN departure_time TEXT;
  END IF;
END $$;

-- 2. Update existing routes with the schedule data from the PDF

-- LAGOS ROUTES
UPDATE public.routes SET departure_days = 'Tuesdays and Fridays', departure_time = '7am' WHERE origin = 'Lagos' AND destination = 'Yaoundé';
UPDATE public.routes SET departure_days = 'Tuesdays and Saturdays', departure_time = '10am' WHERE origin = 'Yaoundé' AND destination = 'Lagos';

UPDATE public.routes SET departure_days = 'Tuesdays and Fridays', departure_time = '7am' WHERE origin = 'Lagos' AND destination = 'Douala';
UPDATE public.routes SET departure_days = 'Tuesdays and Saturdays', departure_time = '6pm' WHERE origin = 'Douala' AND destination = 'Lagos';

UPDATE public.routes SET departure_days = 'Tuesdays and Fridays', departure_time = '7am' WHERE origin = 'Lagos' AND destination = 'Buea';
UPDATE public.routes SET departure_days = 'Tuesdays and Saturdays', departure_time = '10pm' WHERE origin = 'Buea' AND destination = 'Lagos';

UPDATE public.routes SET departure_days = 'Tuesdays and Fridays', departure_time = '7am' WHERE origin = 'Lagos' AND destination = 'Kumba';
UPDATE public.routes SET departure_days = 'Tuesdays and Saturdays', departure_time = NULL WHERE origin = 'Kumba' AND destination = 'Lagos';

UPDATE public.routes SET departure_days = 'Tuesdays and Fridays', departure_time = '7am' WHERE origin = 'Lagos' AND destination = 'Mamfe';
UPDATE public.routes SET departure_days = 'Tuesdays and Saturdays', departure_time = NULL WHERE origin = 'Mamfe' AND destination = 'Lagos';

-- ABUJA ROUTES
UPDATE public.routes SET departure_days = 'Tuesdays and Fridays', departure_time = '8am' WHERE origin = 'Abuja' AND destination IN ('Yaoundé', 'Douala', 'Buea', 'Kumba', 'Mamfe');
UPDATE public.routes SET departure_days = 'Tuesdays and Saturdays', departure_time = NULL WHERE destination = 'Abuja' AND origin IN ('Yaoundé', 'Douala', 'Buea', 'Kumba', 'Mamfe');

-- ABAKALIKI ROUTES
UPDATE public.routes SET departure_days = 'Wednesdays and Saturdays', departure_time = '3am' WHERE origin = 'Abakaliki' AND destination IN ('Yaoundé', 'Douala', 'Buea', 'Kumba', 'Mamfe');
UPDATE public.routes SET departure_days = 'Wednesdays and Sundays', departure_time = NULL WHERE destination = 'Abakaliki' AND origin IN ('Yaoundé', 'Douala', 'Buea', 'Kumba', 'Mamfe');

-- ENUGU ROUTES
UPDATE public.routes SET departure_days = 'Tuesdays and Fridays', departure_time = '6pm' WHERE origin = 'Enugu' AND destination IN ('Yaoundé', 'Douala', 'Buea', 'Kumba', 'Mamfe');
UPDATE public.routes SET departure_days = 'Tuesdays and Saturdays', departure_time = NULL WHERE destination = 'Enugu' AND origin IN ('Yaoundé', 'Douala', 'Buea', 'Kumba', 'Mamfe');

-- ONITSHA ROUTES
UPDATE public.routes SET departure_days = 'Tuesdays and Fridays', departure_time = '4pm' WHERE origin = 'Onitsha' AND destination IN ('Yaoundé', 'Douala', 'Buea', 'Kumba', 'Mamfe');
UPDATE public.routes SET departure_days = 'Tuesdays and Saturdays', departure_time = NULL WHERE destination = 'Onitsha' AND origin IN ('Yaoundé', 'Douala', 'Buea', 'Kumba', 'Mamfe');

-- IKOM ROUTES
UPDATE public.routes SET departure_days = 'Wednesdays and Saturdays', departure_time = '7am' WHERE origin = 'Ikom' AND destination IN ('Yaoundé', 'Douala', 'Buea', 'Kumba', 'Mamfe');
UPDATE public.routes SET departure_days = 'Wednesdays and Sundays', departure_time = NULL WHERE destination = 'Ikom' AND origin IN ('Yaoundé', 'Douala', 'Buea', 'Kumba', 'Mamfe');
