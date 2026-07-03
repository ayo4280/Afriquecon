-- =============================================
-- AFRIQUE-CON — PUBLIC CARGO TRACKING RPC
-- Paste this in: Supabase Dashboard > SQL Editor > Run
-- =============================================

CREATE OR REPLACE FUNCTION public.track_cargo_shipment(p_booking_id TEXT)
RETURNS jsonb AS $$
DECLARE
  cargo_data RECORD;
  logs_data JSONB;
BEGIN
  -- 1. Fetch the main cargo record (bypassing RLS)
  SELECT 
    id, booking_id, origin, destination, weight_kg, cargo_type, 
    status, payment_status, customer_name, recipient_name, created_at
  INTO cargo_data
  FROM public.cargo_bookings
  WHERE booking_id = p_booking_id
  LIMIT 1;

  -- If not found, return empty array
  IF cargo_data IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- 2. Fetch all logs for this cargo (oldest first to build timeline)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'status', l.status,
      'location', l.location,
      'notes', l.notes,
      'timestamp', l.timestamp
    ) ORDER BY l.timestamp ASC
  ), '[]'::jsonb)
  INTO logs_data
  FROM public.cargo_status_log l
  WHERE l.booking_id = cargo_data.id;

  -- 3. Return combined JSON
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
