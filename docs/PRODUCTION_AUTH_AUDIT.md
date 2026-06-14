# Production Auth Audit — `https://saas-deshboard.vercel.app`

## Root Cause

The production redirect loop is caused by a redirect chain between two files that together create an infinite loop when the session JWT token is missing custom fields (`workspaceSlug`, `onboardingComplete`).

### The Loop

```
/login  (authenticated)
   │
   ├─ middleware.ts:42  →  session exists + path is /login
   │                       →  redirect /onboarding
   │
   ▼
/onboarding  (authenticated)
   │
   └─ onboarding/page.tsx:25  →  session.user.workspaceSlug is null
                                →  redirect /login
   │
   └── repeat ──→
```

### Why workspaceSlug Is Null

The `jwt` callback (`auth.config.ts:113`) queries the database for the user's `WorkspaceMember` record during sign-in. If this query **fails** (cold-start timeout, connection pool exhaustion, Prisma error), the callback throws. Auth.js v5 captures the error and creates the JWT **without** the custom fields (`workspaceSlug`, `onboardingComplete`, `userType`).

The session is created and the cookie is set — but the session object has no `workspaceSlug`:
- `session.user.workspaceSlug` → `undefined`
- `session.user.onboardingComplete` → `undefined`
- `session.user.userType` → `undefined`

### Why The Loop Is Only Visible In Production

| Environment | Cookie Works? | Session Recognized? | Loop Type |
|---|---|---|---|
| Local (HTTP) | No (Secure cookie not sent) | Never | User sees login page, must click sign-in again |
| Production (HTTPS) | Yes (Secure cookie sent) | Always | **Automatic redirect loop** — middleware reads session, redirects to `/onboarding`, onboarding redirects to `/login` |

**On HTTPS (production), the cookie IS sent and decoded.** The middleware sees a valid session. But the session lacks `workspaceSlug` and `onboardingComplete`, triggering the redirect loop.

---

## Auth.js v5 Callback Flow (OAuth)

```
1. handleAuthorized()          ← calls signIn callback   [user = raw Google profile]
       │
       ├─ signIn callback:
       │   ├─ prisma.user.create()          ← creates user (userType='TEAM')
       │   ├─ prisma.workspaceMember.findFirst()  ← null
       │   └─ prisma.workspace.create()     ← creates workspace + member + settings + subscription
       │
2. handleLoginOrRegister()     ← adapter processes user [userFromProvider]
       │
       ├─ adapter.getUserByEmail()  ← finds user created in step 1
       ├─ user = userByEmail        ← user is now the DB user object
       ├─ adapter.linkAccount()     ← links OAuth account to user
       └─ returns { user: <DB user>, session: {}, isNewUser: false }
       │
3. jwt callback()              ← called with DB user from step 2
       │
       ├─ token.sub = user.id                ← UUID
       ├─ token.userType = user.userType      ← 'TEAM'
       ├─ prisma.workspaceMember.findFirst()  ← SHOULD find membership
       ├─ token.workspaceSlug = <slug>
       └─ token.onboardingComplete = true
       │
4. session callback()          ← called with token from step 3
       │
       ├─ session.user = token fields
       └─ session cookie set
       │
5. Redirect to /onboarding
```

**Critical moment:** Step 3's `prisma.workspaceMember.findFirst()` runs on the **same database connection** as step 1's `prisma.workspace.create()`. On Vercel serverless cold-starts, if the connection pool is exhausted or the query times out, the callback throws and Auth.js creates a token without custom fields.

---

## Files Affected & Changes

| File | Issue | Fix |
|---|---|---|
| `src/lib/auth.config.ts` (jwt callback) | No error handling — DB query failure silently produces incomplete token | Added try/catch around `prisma.workspaceMember.findFirst()`; fallback to `null`/`false`; detailed console.error |
| `src/lib/auth.config.ts` (jwt callback) | `user.userType` assignment could fail if field is missing | Added guard `if (user.userType)` |
| `src/app/(workspace)/onboarding/page.tsx` | Unconditional `redirect('/login')` when workspaceSlug is null — closes the loop | Added `!session?.user?.id` guard; changed redirect to `/login?error=NoWorkspace` for diagnostics |
| `middleware.ts` | No visibility into session state | Added console.log per request showing pathname, session existence, user fields |
| `src/lib/auth.config.ts` (signIn callback) | No logging for workspace creation | Added console.log before/after workspace create |
| `src/lib/auth.config.ts` (session callback) | No logging for session output | Added console.log showing constructed session fields |

---

## Vercel Environment Variables — Critical Check

### `AUTH_URL`

**Must be:** `https://saas-deshboard.vercel.app`

**Must NOT be:** `https://saas-deshboard.vercel.app/deshboard`

The `AUTH_URL` protocol determines `useSecureCookies`:
- `https://` → `__Secure-authjs.session-token` (correct for production)
- `http://` → `authjs.session-token` (local dev only)

**Path suffix issue:** If `AUTH_URL` has a path (e.g., `/deshboard`), Auth.js sets `basePath = '/deshboard'`. This causes:
- `createActionURL` generates URLs at `/deshboard/session` instead of `/api/auth/session`
- Route handler at `/api/auth/[...nextauth]` still works for callbacks
- But session lookup URLs are wrong, potentially causing cookie/config mismatches

**Verify in Vercel dashboard:** Settings → Environment Variables → `AUTH_URL`

### `AUTH_SECRET`

Must match between local `.env` and Vercel. Current value works.

### `AUTH_TRUST_HOST`

Not required (already `trustHost: true` in `auth.config.ts:21`).

---

## Google OAuth Callback URL

In Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID:

**Redirect URI:** `https://saas-deshboard.vercel.app/api/auth/callback/google`

This must match the **actual** route handler at `/api/auth/[...nextauth]/route.ts`, NOT the `basePath`.

---

## Debug Logging (Added)

All logs are prefixed for grep filtering. Deploy and check Vercel Function Logs:

### Expected logs for successful sign-in

```
[AUTH:signIn] Creating workspace for userId: <uuid>
[AUTH:signIn] Workspace created for userId: <uuid>
[AUTH:jwt] Token after sign-in: {"sub":"<uuid>","workspaceSlug":"<slug>","onboardingComplete":true,"userType":"TEAM"}
[AUTH:session] Session built: {"id":"<uuid>","workspaceSlug":"<slug>","onboardingComplete":true}
[MW] pathname: /onboarding hasSession: true session.user: {"id":"<uuid>","workspaceSlug":"<slug>","onboardingComplete":true}
[MW] Workspace slug mismatch, redirecting to /<slug>/dashboard
[ONBOARDING] Has workspace, redirecting to dashboard: <slug>
```

### Logs indicating the loop (workspaceSlug null)

```
[AUTH:jwt] Membership query failed on sign-in: Error: ...  ← JWT callback DB failure
[AUTH:jwt] Token after sign-in: {"sub":"<uuid>","workspaceSlug":null,"onboardingComplete":false,"userType":"TEAM"}
[AUTH:session] Session built: {"id":"<uuid>","workspaceSlug":null,"onboardingComplete":false}
[MW] pathname: /onboarding hasSession: true session.user: {"id":"<uuid>","workspaceSlug":null,"onboardingComplete":false}
[ONBOARDING] Authenticated but no workspaceSlug
```

---

## Exact Fix Summary

### 1. `src/lib/auth.config.ts` — jwt callback error handling

Added try/catch around the `prisma.workspaceMember.findFirst()` query. If the query fails, the token still gets valid defaults (`workspaceSlug = null`, `onboardingComplete = false`) instead of Auth.js silently dropping the custom fields. The session exists and the middleware can at least redirect properly.

### 2. `src/app/(workspace)/onboarding/page.tsx` — break the redirect loop

Added `!session?.user?.id` guard before checking workspaceSlug. Changed unconditional `redirect('/login')` to `redirect('/login?error=NoWorkspace')` so the loop breaks on the middleware's public-page redirect.

### 3. `.env` — local development fix

Changed `AUTH_URL` from `https://saas-deshboard.vercel.app/deshboard` to `http://localhost:3000` so local HTTP cookies work.

### 4. Debug logging throughout

Added `[AUTH:signIn]`, `[AUTH:jwt]`, `[AUTH:session]`, `[MW]`, `[ONBOARDING]` prefixed logs.

---

## Verification Steps

1. **Check Vercel env vars:**
   - `AUTH_URL` = `https://saas-deshboard.vercel.app` (no path suffix)
   - `AUTH_SECRET` matches local `.env`

2. **Deploy and test Google sign-in**

3. **Check Vercel Function Logs** for:
   - Session created with workspaceSlug
   - Middleware recognizes session
   - Dashboard loads

4. **If loop persists:**
   - Look for `[AUTH:jwt] Membership query failed on sign-in:` in logs
   - Check Supabase connection (connection pool, cold start latency)
   - Verify `DATABASE_URL` on Vercel is correct (no special chars, properly URL-encoded)
   - Check browser devtools → Application → Cookies for `__Secure-authjs.session-token`
