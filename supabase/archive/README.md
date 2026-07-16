# Historical manual setup files

This folder contains old, one-off SQL scripts and local maintenance tools that
were used while the project was being built. They are retained for reference
only and are not part of the supported production deployment path.

Do not run any file here against production without reviewing it first. Some
scripts contain sample data, obsolete role policies, or old notification setup.

For current production changes, use only:

- `supabase/migrations/`
- `supabase/functions/`
- the deployment instructions in `supabase/SECURITY_DEPLOYMENT.md` and
  `supabase/PAYMENT_DEPLOYMENT.md`
