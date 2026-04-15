# Deploy checklist

## Before deploy
- [ ] `npm run build` passes
- [ ] `supabase/schema.sql` has been run in Supabase
- [ ] Vercel envs set: `VITE_API_BASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WELLNESS_USER_ID`
- [ ] `vercel.json` includes Node runtime for `api/**/*.ts`

## After deploy
- [ ] `/api/store` returns JSON
- [ ] `/api/parse` returns `source: "server"`
- [ ] Saving a log persists after refresh
- [ ] Updating goals/calorie mode persists after refresh
- [ ] `/api/store` is not accidentally dropping fallback-only entries during transition
- [ ] No sensitive debug output is exposed in route responses
- [ ] API responses include `Cache-Control: no-store` (or equivalent non-cache headers)

## Remaining production hardening
- [ ] Replace starter RLS policies with real auth-scoped policies
- [ ] Decide whether `WELLNESS_USER_ID` remains a single-user app shortcut or is replaced with auth-derived identity
- [ ] Review retention/privacy expectations for sensitive wellness data
