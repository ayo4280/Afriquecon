# Afrique-con PLC

Cross-border cargo and passenger booking platform for Cameroon and Nigeria.

## Technology

- React, TypeScript, Vite, Tailwind CSS
- Supabase Auth, Postgres, Row Level Security, RPC, and Edge Functions
- Paystack and Flutterwave checkout
- Telegram Bot API, Leaflet, and i18next

## Local development

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and provide the public browser variables.
3. Run `npm install` and `npm run dev`.
4. Verify with `npm run build` and `npm run lint`.

Browser variables must use the `VITE_` prefix. Do not put service-role,
payment-secret, Telegram-bot, or AI-provider keys in Vite variables.

## Supabase deployment order

For supported production changes, apply these migrations in order:

1. `supabase/migrations/20260715_security_hardening.sql`
2. `supabase/migrations/20260715_payment_webhooks.sql`
3. `supabase/migrations/20260715_passenger_seat_holds.sql`
4. `supabase/migrations/20260715_cargo_status_notifications.sql`

Review [Security deployment](supabase/SECURITY_DEPLOYMENT.md) and [Payment deployment](supabase/PAYMENT_DEPLOYMENT.md) before applying them. Use a staging Supabase project first.

Older one-off setup and test scripts are retained under `supabase/archive/` for
reference only. Do not run them against production without review.

## Edge Functions

- `telegram-webhook` — Telegram support commands and account linking.
- `create-payment-intent` — creates server-side pending payment records.
- `create-passenger-reservation` — validates fare/seat availability and creates a 15-minute seat hold.
- `payment-webhook` — validates and verifies Paystack/Flutterwave notifications before marking bookings paid.
- `generate-ai-text` — website AI assistant.

## Operational safeguards

- Admin access is resolved from active `admin_users` records in the database.
- Browser code cannot mark bookings paid.
- Passenger seats are unique per schedule and expire after 15 minutes if unpaid.
- Telegram mappings and secrets are not publicly exposed.

## Current verification

`npm run build` and `npm run lint` are the current local checks. Provider
webhooks and Edge Functions must additionally be tested in Supabase staging
with sandbox payment credentials.
