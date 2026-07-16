-- =============================================
-- AFRIQUE-CON PLC — AGENCIES/BRANCHES
-- Paste this entire file into:
-- Supabase Dashboard > SQL Editor > Run
-- =============================================

-- 1. Create the agencies table
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Optional: Add Row Level Security (RLS)
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on agencies" ON public.agencies;

CREATE POLICY "Allow public read access on agencies"
ON public.agencies
FOR SELECT
TO public
USING (true);

-- 3. Insert the data
INSERT INTO public.agencies (country, city, name, address, phone, email) VALUES
-- Registered Address
('Cameroon', 'Limbe/Buea', 'Registered Address', 'Middle Farms Limbe, P.B 144 Buea, Cameroon', '+237 653237030', 'afriquecon@afriquecon.com'),

-- Cameroon Agencies
('Cameroon', 'Yaounde', 'Yaounde Branch', 'Opposite Mansel Hotel, Quartier Fouda, Rte de Ngousso', '+237 678197361', NULL),
('Cameroon', 'Buea', 'Buea Branch', 'Before WDC mile 17', '+678197346', NULL),
('Cameroon', 'Douala', 'Douala Branch (Bessengue)', 'Carrefour Bessengue beside Tontana Hotel', '+678197346', NULL),
('Cameroon', 'Douala', 'Douala Branch (Camp Yabasi)', 'Opposite small Total, Camp Yabasi, Beside Unity Hall (seamans office)', '+237 678197360', NULL),
('Cameroon', 'Mamfe', 'Mamfe Branch', '?', '?', NULL),

-- Nigeria Agencies
('Nigeria', 'Abuja', 'Abuja Branch', 'EBOTRANS JABI UPSTAIRS OPPOSITE FCMB', '+2348104292492', NULL),
('Nigeria', 'Lagos', 'Lagos Branch', '118 TOTAL FILLING STATION MAZA MAZA BY OLD OJO ROAD', '+2349029072330', NULL),
('Nigeria', 'Ikom', 'Ikom Branch', 'Peace Mass Transit', '+234 7061187679', 'support@afriquecon.com'),
('Nigeria', 'Abakaliki', 'Abakaliki Branch', 'GUO Transport', '07075604636', NULL),
('Nigeria', 'Enugu', 'Enugu Branch', '?', '?', NULL),
('Nigeria', 'Onitsha', 'Onitsha Branch', 'Lagos park obgaru terminal-old Chisco park beside relivee market', '+2347045337032 / +2348063644723', NULL);

-- Note: The General Contact email (support@afriquecon.com) is applicable globally, 
-- and is already included in the Ikom branch or can be hardcoded in the frontend.
