-- Verified payment workflow
-- Deploy the create-payment-intent and payment-webhook Edge Functions before
-- routing provider webhooks to production.

ALTER TABLE public.cargo_bookings
  ADD COLUMN IF NOT EXISTS payment_reference text;

ALTER TABLE public.passenger_tickets
  ADD COLUMN IF NOT EXISTS payment_reference text;

CREATE UNIQUE INDEX IF NOT EXISTS cargo_bookings_payment_reference_key
  ON public.cargo_bookings (payment_reference)
  WHERE payment_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS passenger_tickets_payment_reference_idx
  ON public.passenger_tickets (payment_reference);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('paystack', 'flutterwave')),
  booking_type text NOT NULL CHECK (booking_type IN ('cargo', 'passenger')),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL CHECK (currency IN ('NGN', 'XAF')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  provider_transaction_id text,
  verified_at timestamptz,
  provider_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view payments"
  ON public.payments FOR SELECT
  USING (public.has_admin_role(ARRAY['agent', 'manager', 'super_admin']));

-- The service-role Edge Functions create and update payment records. There is
-- deliberately no client INSERT or UPDATE policy.
