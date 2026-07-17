-- Public cargo tracking is exposed only through this narrowly scoped function.
-- It does not grant the anon role direct access to cargo bookings or status logs.

CREATE OR REPLACE FUNCTION public.track_cargo_shipment(p_booking_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cargo_data record;
  logs_data jsonb;
BEGIN
  SELECT
    id,
    booking_id,
    origin,
    destination,
    weight_kg,
    cargo_type,
    status,
    payment_status,
    customer_name,
    recipient_name,
    created_at
  INTO cargo_data
  FROM public.cargo_bookings
  WHERE upper(booking_id) = upper(trim(p_booking_id))
  LIMIT 1;

  IF cargo_data IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', log.id,
        'status', log.status,
        'location', log.location,
        'notes', log.notes,
        'timestamp', log.timestamp
      )
      ORDER BY log.timestamp ASC
    ),
    '[]'::jsonb
  )
  INTO logs_data
  FROM public.cargo_status_log AS log
  WHERE log.booking_id = cargo_data.id;

  RETURN jsonb_build_array(
    jsonb_build_object(
      'booking_id', cargo_data.booking_id,
      'origin', cargo_data.origin,
      'destination', cargo_data.destination,
      'weight_kg', cargo_data.weight_kg,
      'cargo_type', cargo_data.cargo_type,
      'status', cargo_data.status,
      'payment_status', cargo_data.payment_status,
      'customer_name', cargo_data.customer_name,
      'recipient_name', cargo_data.recipient_name,
      'created_at', cargo_data.created_at,
      'logs', logs_data
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.track_cargo_shipment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_cargo_shipment(text) TO anon, authenticated;
