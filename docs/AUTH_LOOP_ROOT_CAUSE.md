# Auth Loop Root Cause Analysis

## Root Cause

### Primary: `AUTH_URL` protocol mismatch causes invisible Secure cookies

`.env` had `AUTH_URL=https://saas-deshboard.vercel.app/deshboard` — an **HTTPS** URL pointing to a production deployment.

Auth.js v5 uses the `AUTH_URL` protocol to determine the `useSecureCookies` flag. With `https:`, it:
- Sets cookie name to `__Secure-authjs.session-token` (prefix)
- Sets the `Secure` flag on the cookie

On `http://localhost:3000`, the browser **receives** the `Set-Cookie` header but **never sends** the cookie back (browsers refuse to send `Secure` cookies over HTTP).

**Result:** Auth handler sets the session cookie → redirects to app → middleware reads request cookies → `__Secure-authjs.session-token` is absent → `req.auth` is null → redirect to `/login`.

### Secondary: Onboarding page unconditional redirect to `/login`

`src/app/(workspace)/onboarding/page.tsx` line 11: `redirect('/login')` — if `session.user.workspaceSlug` is null/undefined, redirects to `/login`. The middleware at `/login` sees a valid session and redirects back to `/onboarding`, creating a true redirect loop.

This secondary path only triggers if the session cookie is recognized (user is on HTTPS), which makes the redirect loop visible as an infinite browser redirect.

---

## Session Flow (after fix)

```
User clicks "Sign in with Google"
  │
  └─ signIn('google', { redirectTo: '/onboarding' })
       │
       ├─ Browser → Google OAuth consent screen
       │
       ├─ Google → /api/auth/callback/google?code=...
       │    │
       │    ├─ Middleware: isPublic('/api/auth/callback/google') → true → pass through
       │    │
       │    └─ Auth.js handler processes callback:
       │         ├─ Adapter.createUser → creates DB user (userType: 'TEAM')
       │         ├─ Adapter.linkAccount → creates OAuth Account record
       │         ├─ signIn callback → creates Workspace + WorkspaceMember (OWNER)
       │         ├─ jwt callback → queries membership → sets token.workspaceSlug, token.onboardingComplete=true
       │         ├─ session callback → copies token → session.user
       │         └─ Sets cookie: authjs.session-token (no __Secure- prefix, Secure=false)
       │              url.protocol === "http:" → useSecureCookies = false
       │
       └─ Redirect to /onboarding
            │
            └─ Middleware at /onboarding:
                 ├─ Reads authjs.session-token cookie ✓
                 ├─ Decodes JWT → session exists ✓
                 ├─ isPublic('/onboarding') → false
                 ├─ Auth check → passes (session exists)
                 ├─ Onboarding check: onboardingComplete=true → passes
                 └─ Workspace route: slug='onboarding' ≠ '<workspaceSlug>'
                      └─ Redirect to /<workspaceSlug>/dashboard
                           │
                           └─ Middleware at /<workspaceSlug>/dashboard:
                                ├─ Session exists ✓
                                ├─ Auth check → passes
                                ├─ Onboarding check → passes
                                └─ Workspace route: slug matches → NextResponse.next()
                                     │
                                     └─ DashboardPage renders ✓
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. /login                                                        │
│    │ User clicks "Sign in with Google"                           │
│    │ signIn('google', { redirectTo: '/onboarding' })             │
│    └─→ Google                                                    │
└─────────────────────────────────────────────────────────────────┘
                                                                    
┌─────────────────────────────────────────────────────────────────┐
│ 2. /api/auth/callback/google?code=...                            │
│    │ Auth.js v5 processes OAuth callback                         │
│    │                                                             │
│    ├─ PrismaAdapter                                              │
│    │  ├─ getUserByEmail(email) → null (first-time)               │
│    │  ├─ createUser({ email, name, image }) → User { id, ... }   │
│    │  └─ linkAccount(...) → Account { userId, provider, ... }    │
│    │                                                             │
│    ├─ signIn callback (auth.config.ts:55)                        │
│    │  ├─ findUnique({ email }) → finds adapter-created user      │
│    │  ├─ findFirst({ userId }) → null (no membership yet)        │
│    │  └─ workspace.create({ members: { userId, role: 'OWNER' }}) │
│    │                                                             │
│    ├─ jwt callback (auth.config.ts:113)                          │
│    │  ├─ findFirst({ userId }) → finds just-created membership   │
│    │  ├─ token.workspaceSlug = workspace.slug                    │
│    │  └─ token.onboardingComplete = true                         │
│    │                                                             │
│    ├─ session callback (auth.config.ts:142)                      │
│    │  └─ session.user = { id, userType, workspaceSlug, ... }    │
│    │                                                             │
│    └─ Set-Cookie: authjs.session-token=<JWT>; Secure=false       │
│         (AUTH_URL=http://localhost:3000 → useSecureCookies=false)│
│                                                             │
│    Redirect: 302 → /onboarding                                   │
└─────────────────────────────────────────────────────────────────┘
                                                                    
┌─────────────────────────────────────────────────────────────────┐
│ 3. /onboarding (with cookie)                                     │
│    │ Middleware: req.auth = session { workspaceSlug, ... }       │
│    │ Onboarding check: onboardingComplete=true → passes          │
│    │ Workspace slug: workspaceSlug ≠ 'onboarding' → redirect     │
│    └─→ /<workspaceSlug>/dashboard                                │
└─────────────────────────────────────────────────────────────────┘
                                                                    
┌─────────────────────────────────────────────────────────────────┐
│ 4. /<workspaceSlug>/dashboard (with cookie)                     │
│    │ Middleware: session valid → passes                          │
│    │ DashboardPage: createWorkspaceContext → auth() → session    │
│    │ → Dashboard renders ✓                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Affected

| File | Change | Impact |
|------|--------|--------|
| `.env` | `AUTH_URL` changed from `https://saas-deshboard.vercel.app/deshboard` to `http://localhost:3000` | Fixes `useSecureCookies = true` → `false`. Cookie name changes from `__Secure-authjs.session-token` to `authjs.session-token`. Browser sends cookie over HTTP. |
| `.env.example` | Updated `AUTH_URL` comment to explain `Secure` / `__Secure-` behavior | Prevents future misconfiguration |
| `src/lib/auth.config.ts` | Added `console.log` to `signIn`, `jwt`, `session` callbacks | Enables tracing session creation in server logs |
| `middleware.ts` | Added `console.log` for pathname, session existence, session.user fields | Enables tracing cookie recognition and session state per request |
| `src/app/(workspace)/onboarding/page.tsx` | Added debug logging; changed unconditional `redirect('/login')` to check `session?.user?.id` first; added `?error=NoWorkspace` query param | Prevents silent redirect loop; provides diagnostic query param |

---

## Exact Fix

### 1. `.env` — Fix AUTH_URL protocol

**Before:**
```
AUTH_URL=https://saas-deshboard.vercel.app/deshboard
```

**After:**
```
AUTH_URL=http://localhost:3000
```

**Why:** `AUTH_URL` protocol determines `useSecureCookies`. HTTPS → `__Secure-authjs.session-token` cookie (browser ignores on HTTP). HTTP → `authjs.session-token` cookie (works on localhost).

For production on HTTPS: set `AUTH_URL=https://your-domain.com` (the `Secure` cookie then works correctly over HTTPS).

### 2. Auth.js `useSecureCookies` resolution detail

In `@auth/core/lib/init.js` line 69:
```javascript
cookies: merge(cookie.defaultCookies(config.useSecureCookies ?? url.protocol === "https:"), config.cookies),
```

- If `config.useSecureCookies` is set → uses that value
- If not → uses `url.protocol === "https:"` where `url` comes from `AUTH_URL` / `NEXTAUTH_URL`

The `url` is constructed by `reqWithEnvURL` (middleware) or `createActionURL` (API routes), both of which resolve from `AUTH_URL` first.

### 3. Onboarding page redirect safety

**Before:**
```typescript
if (session?.user?.workspaceSlug) {
  redirect(`/${session.user.workspaceSlug}/dashboard`)
}
redirect('/login')
```

**After:**
```typescript
if (!session?.user?.id) {
  redirect('/login')
}
if (session.user.workspaceSlug) {
  redirect(`/${session.user.workspaceSlug}/dashboard`)
}
redirect('/login?error=NoWorkspace')
```

**Why:** The unconditional `redirect('/login')` at the end caused a redirect loop with middleware (middleware at `/login` sees session → redirects to `/onboarding` → page redirects back to `/login`). Now the page checks:
1. If no session at all → `/login` (user needs to sign in)
2. If session + workspaceSlug → dashboard (normal flow)
3. If session but no workspaceSlug → `/login?error=NoWorkspace` (signIn callback failed to create workspace)

---

## Debug Logging (added, to remove after verification)

All debug lines are prefixed for easy grep filtering:

| Prefix | File | What it logs |
|--------|------|-------------|
| `[AUTH:signIn]` | `auth.config.ts:82,106,108` | Workspace creation outcome |
| `[AUTH:jwt]` | `auth.config.ts:126` | Token fields after sign-in |
| `[AUTH:session]` | `auth.config.ts:147` | Session fields after construction |
| `[MW]` | `middleware.ts:12` | Per-request path, session existence, user fields |
| `[ONBOARDING]` | `onboarding/page.tsx:6-11` | Session state at onboarding page |

To verify the fix:
1. Run `npm run dev`
2. Open browser devtools → Network tab
3. Click "Sign in with Google"
4. Check server console for:
   - `[AUTH:signIn] Creating workspace for userId: <uuid>`
   - `[AUTH:signIn] Workspace created for userId: <uuid>`
   - `[AUTH:jwt] Initial token created: {"sub":"<uuid>","workspaceSlug":"<slug>","onboardingComplete":true}`
   - `[MW] pathname: /onboarding hasSession: true session.user: {"id":"<uuid>","workspaceSlug":"<slug>","onboardingComplete":true}`
   - `[MW] Workspace slug mismatch, redirecting to /<slug>/dashboard`

Remove all `console.log` lines after confirming the flow works.
