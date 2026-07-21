-- Complete provider-verified payments and their related records atomically.
CREATE OR REPLACE FUNCTION public.complete_verified_payment(
  p_payment_id uuid,
  p_reference text,
  p_booking_type text,
  p_provider_transaction_id text,
  p_provider_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_type text;
  v_payment_status text;
  v_rows integer;
BEGIN
  SELECT booking_type, status
  INTO v_booking_type, v_payment_status
  FROM public.payments
  WHERE id = p_payment_id AND reference = p_reference
  FOR UPDATE;

  IF NOT FOUND OR v_booking_type IS DISTINCT FROM p_booking_type THEN
    RAISE EXCEPTION 'Payment record does not match the verified payment';
  END IF;

  IF v_booking_type = 'cargo' THEN
    UPDATE public.cargo_bookings
    SET payment_status = 'paid'
    WHERE payment_reference = p_reference;
  ELSIF v_booking_type = 'passenger' THEN
    UPDATE public.passenger_tickets
    SET payment_status = 'paid', reservation_expires_at = null
    WHERE payment_reference = p_reference;
  ELSE
    RAISE EXCEPTION 'Unsupported booking type: %', v_booking_type;
  END IF;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'No booking or ticket found for verified payment';
  END IF;

  IF v_payment_status <> 'paid' THEN
    UPDATE public.payments
    SET status = 'paid',
        provider_transaction_id = p_provider_transaction_id,
        provider_payload = p_provider_payload,
        verified_at = now(),
        updated_at = now()
    WHERE id = p_payment_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_verified_payment(uuid, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_verified_payment(uuid, text, text, text, jsonb) TO service_role;

-- Public tracking must not disclose names, payment state, or status notes.
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
  SELECT id, booking_id, origin, destination, weight_kg, cargo_type, status, created_at
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
      'created_at', cargo_data.created_at,
      'logs', logs_data
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.track_cargo_shipment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_cargo_shipment(text) TO anon, authenticated;
