-- =============================================
-- AFRIQUE-CON PLC - Admin Settings RLS Policies
-- Run this in: Supabase Dashboard > SQL Editor
-- Allows authenticated admin users to update routes and admin_users
-- =============================================

-- ── ROUTES table: allow admins to INSERT / UPDATE / DELETE ──────────────────
-- First, enable RLS (it may already be enabled)
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- Admin full access on routes (select already exists as public)
CREATE POLICY "Admins can update routes"
  ON public.routes
  FOR UPDATE
  USING (
    auth.email() IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );

CREATE POLICY "Admins can insert routes"
  ON public.routes
  FOR INSERT
  WITH CHECK (
    auth.email() IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );

-- ── ADMIN_USERS table: allow admins to SELECT / INSERT / UPDATE ─────────────
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin_users"
  ON public.admin_users
  FOR SELECT
  USING (
    auth.email() IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );

CREATE POLICY "Admins can insert admin_users"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (
    auth.email() IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );

CREATE POLICY "Admins can update admin_users"
  ON public.admin_users
  FOR UPDATE
  USING (
    auth.email() IN (
      'testuser3@afrique-con.com',
      'admin@afrique-con.com',
      'ayodelesodiya@gmail.com'
    )
  );
