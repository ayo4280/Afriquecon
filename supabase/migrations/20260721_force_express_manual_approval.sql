-- Enforce the Express service rules in the database, not only in the browser.
-- This protects clients who have an older cached website version.

CREATE OR REPLACE FUNCTION public.enforce_express_cargo_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(NEW.is_express, false) THEN
    IF NEW.weight_kg > 50 THEN
      RAISE EXCEPTION 'Express cargo weight cannot exceed 50kg.';
    END IF;

    NEW.base_rate_fcfa := 0;
    NEW.total_fcfa := 0;
    NEW.status := 'pending';
    NEW.payment_status := 'pending';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_express_cargo_on_insert ON public.cargo_bookings;
CREATE TRIGGER trg_enforce_express_cargo_on_insert
  BEFORE INSERT ON public.cargo_bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_express_cargo_on_insert();
