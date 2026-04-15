# Wellness App

Voice-first body log prototype for Ela.

## Current scope
- premium mobile web UI
- dashboard and stats cards
- daily feed concept
- onboarding structure
- home-screen friendly PWA shell

## Deploy
This app is deployed on Vercel.

Key config:
- framework: Vite
- build command: `npm run build`
- output directory: `dist`

## Recent improvements
- Parser now extracts explicit exercise durations ("40 min run" → cardio: 40, not a fixed default)
- Food coverage expanded: pasta, pizza, burger, sushi, oats, yogurt, avocado, salmon, steak, chocolate, fruit, and more
- Sugar estimates added for sweets and fruit
- Protein estimates added for fish, dairy, and grains

## Next build priorities
1. replace the file-backed API with Supabase-backed persistence
2. connect `/api/store`, `/api/logs`, and `/api/parse` to real backend env vars
3. verify Vercel deployment with serverless routes enabled
4. add auth/privacy guardrails for sensitive wellness data
5. improve parser quality for natural voice logs

## Backend scaffold now present
- `api/store.ts` returns the current store
- `api/logs.ts` accepts new log entries
- `api/parse.ts` parses freeform logging text server-side
- `api/preferences.ts` persists onboarding/dashboard preferences
- `supabase/schema.sql` defines the first pass at entries + preferences tables, updated_at trigger, and starter RLS policies
- `.env.example` shows the env vars needed for the next Supabase wiring step

## What still needs doing
- add real auth before production because wellness data is sensitive
- set actual `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- deploy and verify the serverless routes on Vercel
- point `VITE_API_BASE_URL` at the deployed backend base URL
- switch from transitional fallback-backed persistence to Supabase-first verified writes

## Current persistence status
- frontend build is passing
- onboarding preferences save locally and can sync through `/api/preferences`
- logging/parser UX is improved on both client and server
- fallback file storage now keeps `source: local` honestly
- `/api/store` now merges fallback data with Supabase data during transition
- wellness API routes now send explicit `no-store` cache headers to reduce accidental caching of sensitive data
- Supabase is scaffolded, but not yet confirmed as the primary live write path

## Handoff files for the next run
- `supabase/SETUP.md` = exact hookup steps
- `DEPLOY_CHECKLIST.md` = fast verification after deploy
