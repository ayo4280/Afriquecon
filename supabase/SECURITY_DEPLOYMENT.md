# Security deployment checklist

These changes are intentionally not applied automatically. Complete them in a
staging project first, then repeat in production.

1. Confirm at least one authenticated staff member has an active
   `admin_users` row with role `super_admin`. The new policy model has no
   hard-coded bootstrap email.
2. Apply [20260715_security_hardening.sql](./migrations/20260715_security_hardening.sql)
   using the Supabase SQL editor or your normal migration workflow.
3. Set a strong, random `TELEGRAM_WEBHOOK_SECRET` and `TELEGRAM_BOT_TOKEN` as
   Supabase Edge Function secrets. Do not put either value in `.env` files
   that are exposed to Vite.
4. Deploy the `telegram-webhook` Edge Function. Configure Telegram with
   `setWebhook`, setting its `secret_token` to the same webhook secret. The
   function accepts only Telegram's `X-Telegram-Bot-Api-Secret-Token` header.
5. Point Telegram only to the Supabase function URL. The former Vercel
   `api/telegram.ts` handler has been removed to prevent duplicate processing.
6. Sign in as each role and confirm that dashboard visibility and mutations
   match the intended permissions before releasing to customers.

The Edge Function is service-role only. The `telegram_users` table is no
longer publicly readable or writable after the migration.
