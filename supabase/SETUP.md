# Supabase hookup setup

## 1) Run the schema
In Supabase SQL editor, run:

- `supabase/schema.sql`

This creates:
- `wellness_entries`
- `wellness_preferences`
- `updated_at` trigger for preferences
- starter RLS policies

## 2) Add env vars
Set these in Vercel project envs and local `.env.local` when testing:

- `VITE_API_BASE_URL=https://<your-deployed-app-url>`
- `SUPABASE_URL=https://<your-project>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- `WELLNESS_USER_ID=ela`

## 3) Important note
Current policies are only a starter scaffold for service-role access. Before production auth, replace them with real user-scoped policies.

## 4) Expected behavior after hookup
- `GET /api/store` returns preferences + entries from Supabase, while temporarily merging any fallback file-backed data not yet present remotely
- `POST /api/logs` writes entries to Supabase when envs are set, otherwise falls back locally
- `POST /api/preferences` upserts onboarding/dashboard preferences
- `POST /api/parse` returns server-side parsed events

## 4.5) Current transition behavior
- fallback file-backed entries are now labeled `source: "local"`
- frontend and backend parsing logic are aligned
- duplicate risk is reduced with id-based dedupe in fallback/UI save paths
- until Supabase writes are fully verified in production, treat the file store as a transition backup rather than true final persistence

## 5) Fast verification
After deploy, test these with your real domain:

```bash
curl -s https://<app-domain>/api/store

curl -s -X POST https://<app-domain>/api/parse \
  -H 'Content-Type: application/json' \
  -d '{"detail":"had a latte, then did a 40 min workout"}'
```

If `source: "server"` appears in parse results and new entries + preference changes persist across reloads, the backend path is working.
