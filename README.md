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
5. `supabase/migrations/20260717_add_public_cargo_tracking.sql`
6. `supabase/migrations/20260717_support_telegram_chat_ids.sql`
7. `supabase/migrations/20260718_large_cargo_approval_notifications.sql`
8. `supabase/migrations/20260718_add_approved_cargo_payment_link.sql`
9. `supabase/migrations/20260718_fix_large_cargo_approval_transition.sql`
10. `supabase/migrations/20260720_enforce_express_cargo_approval.sql`
11. `supabase/migrations/20260720_harden_large_cargo_management_alert.sql`
12. `supabase/migrations/20260720_use_edge_function_for_large_cargo_alerts.sql`
13. `supabase/migrations/20260721_force_express_manual_approval.sql`
14. `supabase/migrations/20260721_send_express_approved_payment_link.sql`
15. `supabase/migrations/20260721_atomic_payment_completion_and_private_tracking.sql`
16. `supabase/migrations/20260721_ai_rate_limits.sql`

Review [Security deployment](supabase/SECURITY_DEPLOYMENT.md) and [Payment deployment](supabase/PAYMENT_DEPLOYMENT.md) before applying them. Use a staging Supabase project first.

Older one-off setup and test scripts are retained under `supabase/archive/` for
reference only. Do not run them against production without review.

Use the live Vercel URL (`https://afriquecon.vercel.app`) for `APP_URL` until the
permanent domain is ready. Apply migrations in the Supabase SQL Editor or through
the CLI, and use a staging project first for schema changes.

## Edge Functions

- `telegram-webhook` — Telegram support commands and account linking.
- `create-payment-intent` — creates server-side pending payment records.
- `create-passenger-reservation` — validates fare/seat availability and creates a 15-minute seat hold.
- `payment-webhook` — validates and verifies Paystack/Flutterwave notifications before marking bookings paid.
- `generate-ai-text` — website AI assistant.
- `admin-create-user` — privileged staff account creation.
- `notify-large-cargo-approval` — management notification for large/express cargo.

Deploy updated functions with the Supabase CLI after applying their migrations.
Never commit or expose `SUPABASE_ACCESS_TOKEN`, service-role, payment-secret,
Telegram-bot, or AI-provider keys.

## Operational safeguards

- Admin access is resolved from active `admin_users` records in the database.
- Browser code cannot mark bookings paid.
- Passenger seats are unique per schedule and expire after 15 minutes if unpaid.
- Telegram mappings and secrets are not publicly exposed.

## Current verification

Run `npm run lint`, `npm run build`, and `npm test -- --run` before publishing.
Provider webhooks and Edge Functions must additionally be tested in Supabase
staging with sandbox payment credentials. The public AI assistant is limited to
10 requests per client per 10-minute window; a 429 response is expected after
the limit is reached.
