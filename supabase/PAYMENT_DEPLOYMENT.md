# Payment webhook deployment checklist

1. Apply [20260715_payment_webhooks.sql](./migrations/20260715_payment_webhooks.sql) and [20260715_passenger_seat_holds.sql](./migrations/20260715_passenger_seat_holds.sql).
2. Deploy `create-payment-intent`, `create-passenger-reservation`, and `payment-webhook` Supabase Edge Functions.
3. Configure these Edge Function secrets—never Vite-prefixed variables:

   - `PAYSTACK_SECRET_KEY`
   - `FLUTTERWAVE_SECRET_KEY`
   - `FLUTTERWAVE_WEBHOOK_HASH`
   - `APP_URL` (for example, `https://afrique-con.com`)
   - `SUPABASE_ANON_KEY` (for authenticated payment-intent calls)

4. Register the provider callback endpoints:

   - Paystack: `https://<project-ref>.functions.supabase.co/payment-webhook?provider=paystack`
   - Flutterwave: `https://<project-ref>.functions.supabase.co/payment-webhook?provider=flutterwave`

5. Test both providers in sandbox mode. Confirm that:

   - a browser callback alone leaves a booking `pending`;
   - a valid signed webhook creates a `paid` payment record and updates the
     matching cargo booking or passenger tickets;
   - a repeated webhook is idempotent;
   - an invalid signature cannot update any booking.

The client creates only a pending booking and payment intent. `paid` is set
exclusively by the payment webhook after provider verification.

Flutterwave uses its server-created Standard hosted checkout link; no
Flutterwave secret or public key is shipped to the browser.

Passenger seats are held for 15 minutes. The reservation function releases
expired unpaid holds before reserving seats, and the seat map ignores expired
holds. A unique schedule/seat index prevents two active bookings from taking
the same seat.
