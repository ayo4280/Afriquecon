-- Read-only production security checks for Afrique-con.
-- Run in the production Supabase SQL Editor. These queries do not reveal
-- decrypted secret values.

-- 1) Confirm RLS is enabled on application tables.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'admin_users', 'profiles', 'cargo_bookings', 'passenger_tickets',
    'payments', 'telegram_users', 'telegram_logs', 'bus_schedules', 'routes'
  )
order by c.relname;

-- 2) Review the active policies without reading any row data.
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'admin_users', 'profiles', 'cargo_bookings', 'passenger_tickets',
    'payments', 'telegram_users', 'telegram_logs', 'bus_schedules', 'routes'
  )
order by tablename, policyname;

-- 3) Confirm only expected secret names exist in Vault. Values remain hidden.
select name, description, updated_at
from vault.secrets
where name in (
  'telegram_bot_token', 'telegram_admin_chat_id', 'app_url',
  'brevo_api_key', 'brevo_sender_email'
)
order by name;

-- 4) Review SECURITY DEFINER functions and their fixed search_path.
select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       p.proconfig as settings
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by p.proname;
