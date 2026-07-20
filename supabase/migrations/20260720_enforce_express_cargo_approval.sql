-- Express cargo is currently limited to 50 kg and must receive a manually
-- negotiated price before a client can pay.

ALTER TABLE public.cargo_bookings
  DROP CONSTRAINT IF EXISTS cargo_bookings_express_weight_limit;

ALTER TABLE public.cargo_bookings
  ADD CONSTRAINT cargo_bookings_express_weight_limit
  CHECK (coalesce(is_express, false) = false OR weight_kg <= 50)
  NOT VALID;
