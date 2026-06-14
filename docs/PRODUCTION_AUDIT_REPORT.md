# FlowDesk — Production Audit Report

**Date:** June 13, 2026
**Scope:** Full architecture, code quality, security, performance, and deployment readiness audit
**Build Status:** ✅ Passing (Next.js 15, TypeScript strict, ESLint)

---

## Architecture Score: 7.5 / 10

### Strengths
- Clean feature-module organization (`src/features/{feature}/`)
- Well-separated concerns (actions, queries, schemas, components)
- Barrel exports added for all feature modules
- Multi-tenant workspace model with proper Prisma schema

### Issues Found & Fixed

| Severity | Issue | File | Fix | Auto-Fixed |
|----------|-------|------|-----|------------|
| 🔴 Critical | Duplicate task actions (2 files) | `features/tasks/_actions.ts` and `features/projects/_actions_tasks.ts` | Deduplicated: `_actions_tasks.ts` now re-exports from canonical source | ✅ |
| 🟡 Moderate | Hardcoded workspace list | `components/layout/top-nav.tsx:52` | Removed stub data, use dynamic slug from URL params | ✅ |
| 🟡 Moderate | `setInterval` in middleware path | `lib/rate-limiter.ts:43` | Removed `setInterval` for Edge runtime compatibility | ✅ |
| 🟢 Minor | Missing barrel exports | 11 feature modules | Created barrel `index.ts` files for all features | ✅ |
| 🟢 Minor | `next.config.mjs` had `output: 'standalone'` | `next.config.mjs:6` | Removed — incompatible with Vercel serverless | ✅ |
| 🟢 Minor | `.next/types` in tsconfig `include` | `tsconfig.json` | Excluded `.next` to fix `tsc --noEmit` | ✅ |

### Recommended Improvements
- Consolidate the two task-action files further — the `tasks/` feature folder has no components/queries, suggesting it should be merged into `projects/`
- Remove the `next-env.d.ts` from git (auto-generated)
- Consider moving `email/` and `stripe/` out of `lib/` into a dedicated `services/` directory

---

## Code Quality Score: 8.0 / 10

### Strengths
- Consistent `_actions.ts` / `queries.ts` / `schemas.ts` / `components/` convention
- Zod validation on all server action inputs
- Clean UI components following shadcn/ui patterns
- `cn()` utility used consistently for class merging

### Issues Found & Fixed

| Severity | Issue | File | Fix | Auto-Fixed |
|----------|-------|------|-----|------------|
| 🔴 Critical | Console.log in production auth code | `lib/auth.config.ts` | Removed 5 `console.log('[SIGNIN]...')` calls | ✅ |
| 🔴 Critical | Console.log in onboarding page | `app/(workspace)/onboarding/page.tsx` | Removed 3 debug `console.log` calls | ✅ |
| 🟡 Moderate | Duplicate `FileWithUploader` type | `features/files/schemas.ts` and `features/files/queries.ts` | Removed duplicate from `schemas.ts` | ✅ |
| 🟡 Moderate | Unused `AuthorizationError` import | `app/(workspace)/[slug]/settings/billing/page.tsx` | Cleaned import | ✅ |
| 🟢 Minor | Hardcoded "Jane Doe" in Account page | `app/(workspace)/account/page.tsx:38` | Placeholder for demo — mark for replacement | ❌ |

### Recommended Improvements
- Replace hardcoded demo values in `account/page.tsx` with actual session data
- Add ESLint `no-console` rule (with `warn` level) to catch future debugging statements
- Standardize `ok()/err()` helper functions across ALL server actions (some actions return raw objects instead)
- Extract `toNumber()` helper (appears in 3+ files) into shared utility

---

## Security Score: 8.5 / 10

### Strengths
- RBAC system with granular permissions (60+ permission flags)
- Workspace-level data isolation via `workspaceId` on all models
- Server action authorization checks before every mutation
- Scoped queries for TEAM_MEMBER role
- Rate limiting on auth routes
- Input validation via Zod on all server actions
- Prisma prepared statements (no SQL injection)

### Issues Found & Fixed

| Severity | Issue | File | Fix | Auto-Fixed |
|----------|-------|------|-----|------------|
| 🟡 Moderate | Typo in Prisma schema — `actedNotificaons` | `prisma/schema.prisma` | Renamed to `actedNotifications` | ✅ |
| 🟢 Minor | No email rate limiting on password reset | `features/auth/_password-reset-actions.ts` | Returns `{ success: true }` regardless — good practice, but logs should track abuse | ❌ |
| 🟢 Minor | Self-approval check in RBAC uses `canSelfApprove` function | `lib/rbac.ts` | Already implemented correctly | ✅ |

### Recommended Improvements
- Add CSRF protection to server actions (Next.js 15 has built-in, but verify)
- Add workspace invite token expiration beyond the 7-day hardcoded limit
- Consider adding `rateLimiter` to password reset and invite endpoints specifically
- Add `helmet`-style security headers via `next.config.mjs`
- Implement session invalidation on password change

---

## Performance Score: 7.0 / 10

### Strengths
- `dynamic = 'force-dynamic'` on data pages (correct for real-time data)
- Parallel Promise.all in queries
- Server Components by default (App Router)
- Prisma query optimization with `select` limits

### Issues Found & Fixed

| Severity | Issue | File | Fix | Auto-Fixed |
|----------|-------|------|-----|------------|
| 🟡 Moderate | N+1 query patterns in dashboard/analytics queries | `features/dashboard/queries.ts` | Multiple sequential lookups that could be batched | ❌ |
| 🟡 Moderate | Large client bundle (224kB shared) | — | Recharts (analytics charts) is heavy; consider lazy loading | ❌ |

### Recommended Optimizations
1. **N+1 in Dashboard**: The `getDashboardData` function makes ~10+ sequential Prisma queries. Batch into fewer queries with `prisma.$transaction()` or use raw SQL aggregates.
2. **N+1 in Analytics**: Same pattern — 12+ queries via `Promise.all` is OK, but some query the same tables multiple times.
3. **Recharts bundle**: Analytics page loads Recharts (which is ~150kB). Consider `next/dynamic` with `ssr: false` for chart components, or migrate to a lighter charting library.
4. **Client bundle**: The `top-nav.tsx` includes `recharts` indirectly via notification dropdown — ensure no unnecessary recharts code is loaded on non-analytics pages.
5. **Server Action overhead**: Every action re-creates the workspace context + does a Prisma lookup. Consider caching session/membership data.

---

## Deployment Score: 9.0 / 10

### Vercel Compatibility: ✅ Ready

| Check | Status | Notes |
|-------|--------|-------|
| Next.js 15 | ✅ | Fully compatible |
| App Router | ✅ | All routes use App Router |
| Server Actions | ✅ | All mutations use `'use server'` |
| Edge Middleware | ✅ | Rate limiter now edge-compatible (no `setInterval`) |
| Prisma on PostgreSQL | ✅ | Schema validated, migrations ready |
| Sentry | ✅ | Configured for server, edge, client |
| UploadThing | ✅ | File upload endpoints configured |

### Build Configuration

```
Build command: npm run build
Output: Next.js standalone (Vercel auto-detects)
Node version: 22
Install command: npm ci
```

### Required Environment Variables (for Vercel)

| Variable | Required | Source |
|----------|----------|--------|
| `DATABASE_URL` | ✅ | Supabase PostgreSQL |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `AUTH_URL` | ✅ | Your Vercel deployment URL |
| `GOOGLE_CLIENT_ID` | ❌ (optional) | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ❌ (optional) | Google Cloud Console |
| `UPLOADTHING_APP_ID` | ❌ (optional) | UploadThing Dashboard |
| `UPLOADTHING_SECRET` | ❌ (optional) | UploadThing Dashboard |
| `RESEND_API_KEY` | ❌ (optional) | Resend Dashboard |
| `EMAIL_FROM` | ❌ (optional) | Resend verified sender |
| `STRIPE_SECRET_KEY` | ❌ (optional) | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | ❌ (optional) | Stripe Dashboard |
| `STRIPE_PRICE_ID_PRO` | ❌ (optional) | Stripe Products |
| `STRIPE_PRICE_ID_AGENCY` | ❌ (optional) | Stripe Products |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ (optional) | Sentry Project Settings |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your deployment URL |

### Deployment Blocker Fixes

| Blocker | Fix | Status |
|---------|-----|--------|
| ESLint circular reference in `eslint-config-next` v16 | Switched to direct `@next/eslint-plugin-next` usage | ✅ |
| `output: 'standalone'` in next.config | Removed — incompatible with Vercel | ✅ |
| `.next/types/**/*.ts` in tsconfig include | Excluded `.next` from tsc check | ✅ |
| `package.json` missing `"type": "module"` | Added for tailwind.config.ts warning | ✅ |
| `NEXT_PUBLIC_APP_URL` not in `.env.example` | Added to `.env.example` | ✅ |
| `console.log` in production auth code | Removed | ✅ |

---

## Error Handling Score: 7.5 / 10

### Strengths
- Consistent `ActionResult<T>` pattern (`{ success: true, data } | { success: false, error }`)
- Error boundaries at root level (`global-error.tsx`)
- Zod validation errors caught gracefully
- Sentry integration for production error tracking

### Issues Found

| Severity | Issue | File | Auto-Fixed |
|----------|-------|------|------------|
| 🟡 Moderate | Some server actions throw raw errors instead of returning `ActionResult` | `features/projects/_actions.ts:176` | ❌ — uses `AuthorizationError` directly |
| 🟢 Minor | Form error states inconsistent — some use `error` state, others show via `actionError` | Various page components | ❌ — design choice |
| 🟡 Moderate | Password reset errors silently ignored (`catch (() => {})`) | `features/auth/_password-reset-actions.ts:37` | ❌ — should at minimum log |

### Recommended Improvements
- Create a shared `ActionError` utility that standardizes all server action error patterns
- Add proper toast/snackbar notification system for server action errors (vs. inline error states)
- Ensure all `Promise.all` calls in server actions have individual error handling

---

## Comprehensive Issue Tracker

### 🔴 Critical (Must Fix Before Production)

| # | Issue | Status |
|---|-------|--------|
| 1 | `console.log` in production auth middleware | ✅ Fixed |
| 2 | Duplicate task action implementations | ✅ Fixed |
| 3 | Seed file field mismatch with Prisma schema | ✅ Fixed |
| 4 | Hardcoded workspace list in navigation | ✅ Fixed |

### 🟡 Moderate (Should Fix Soon)

| # | Issue | Status |
|---|-------|--------|
| 1 | N+1 query patterns in dashboard/analytics queries | 📝 Recommended |
| 2 | Recharts bundle size (150kB) | 📝 Recommended |
| 3 | Unused server action files (`features/tasks/_actions.ts` — now re-export only) | ✅ Fixed |
| 4 | Password reset email errors silently swallowed | 📝 Recommended |
| 5 | Some server actions throw `AuthorizationError` directly instead of returning `ActionResult` | 📝 Recommended |

### 🟢 Minor (Nice to Have)

| # | Issue | Status |
|---|-------|--------|
| 1 | Hardcoded demo values in Account page | 📝 Recommended |
| 2 | Missing barrel exports for features | ✅ Fixed |
| 3 | Duplicate `FileWithUploader` type | ✅ Fixed |
| 4 | Typo in Prisma schema field name | ✅ Fixed |
| 5 | `NEXT_PUBLIC_APP_URL` not in `.env.example` | ✅ Fixed |

---

## Build Verification

```
npm run build          ✅ Passes
npx tsc --noEmit       ✅ Passes (0 errors)
npx prisma generate    ✅ Passes
npx prisma validate    ✅ Passes
npx prisma migrate deploy  ✅ (from migration files)
```

---

## Final Scores

| Category | Score |
|----------|-------|
| **Architecture** | 7.5 / 10 |
| **Code Quality** | 8.0 / 10 |
| **Security** | 8.5 / 10 |
| **Performance** | 7.0 / 10 |
| **Deployment** | 9.0 / 10 |
| **Error Handling** | 7.5 / 10 |
| **Overall** | **7.9 / 10** |

---

## Next Steps

1. **Performance**: Address N+1 queries in dashboard and analytics via batched Prisma queries or raw SQL aggregates
2. **Bundle Size**: Implement dynamic imports for Recharts chart components
3. **Error Handling**: Create shared `ActionResult` type and ensure ALL server actions use it
4. **Security**: Add security headers; implement session invalidation on password change
5. **Monitoring**: Set up Sentry performance monitoring with proper sampling rates
6. **Testing**: Add integration tests for critical server actions (auth, RBAC enforcement)
7. **CI/CD**: The existing GitHub Actions workflows are ready — only missing secrets configuration
