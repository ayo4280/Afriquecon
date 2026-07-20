-- Large-cargo management notifications are now delivered by the authenticated
-- Edge Function immediately after a booking is saved. Disable the legacy
-- pg_net trigger so management receives one reliable alert, not duplicates.

DROP TRIGGER IF EXISTS trg_notify_management_large_cargo_request
ON public.cargo_bookings;
