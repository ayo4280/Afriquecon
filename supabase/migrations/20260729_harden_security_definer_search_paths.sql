-- Pin the search_path for legacy SECURITY DEFINER functions.
-- This prevents an attacker from influencing unqualified object resolution
-- through a caller-controlled schema/search_path.

ALTER FUNCTION public.decrement_available_seats(uuid, integer)
  SET search_path = public;

ALTER FUNCTION public.handle_new_user()
  SET search_path = public;

-- These notification functions read Supabase Vault's decrypted_secrets view.
ALTER FUNCTION public.notify_email_brevo()
  SET search_path = public, vault;

ALTER FUNCTION public.notify_telegram()
  SET search_path = public, vault;
