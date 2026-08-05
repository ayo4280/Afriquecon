-- Re-enable payment transition notifications for cargo and passenger bookings.
ALTER TABLE public.cargo_bookings
  ENABLE TRIGGER trg_notify_telegram_cargo;

ALTER TABLE public.passenger_tickets
  ENABLE TRIGGER trg_notify_telegram_ticket;
