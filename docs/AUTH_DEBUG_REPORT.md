# Auth Debug Report

## Root Cause

The `signIn` callback in `src/lib/auth.config.ts:60-112` had a logic bug that **skipped workspace creation for all OAuth users**.

### The Bug

The OAuth sign-in flow in Auth.js v5 works in this order:
1. Adapter's `createUser` creates the user in the database
2. Adapter's `linkAccount` links the OAuth provider account
3. `signIn` callback runs

In the old code:

```typescript
const existing = await prisma.user.findUnique({ where: { email: user.email! } })

if (existing) {
  if (existing.deletedAt) return '/login?error=AccountDisabled'
  if (existing.userType === 'CLIENT') return '/login?error=ClientLoginRestricted'
  return true  // ⚠️ EXITS HERE — no workspace created!
}

if (!user.id) return true  // also skips if user.id is falsy

const membership = await prisma.workspaceMember.findFirst({
  where: { userId: user.id },
})
// ... workspace creation only runs here for "truly new" users
```

**Problem:** For first-time OAuth users, step 1 (`createUser`) runs BEFORE the `signIn` callback. When `signIn` queries `findUnique({ where: { email: user.email! } })`, it **finds the just-created user**. The `if (existing)` block matches, and the callback returns `true` immediately — **without ever creating a workspace or membership**.

### The Redirect Loop

1. User clicks "Continue with Google"
2. Google OAuth succeeds, user is created/linked
3. `signIn` callback finds the newly created user → returns `true` without creating workspace
4. JWT callback: `membership` query returns null → `onboardingComplete = false`, `workspaceSlug = null`
5. NextAuth redirects to `/onboarding`
6. Middleware: session exists, `onboardingComplete = false`, path IS `/onboarding` → skips onboarding redirect
7. Middleware: `workspaceSlug` is null → skips workspace slug redirect
8. Middleware: returns `NextResponse.next()` → onboarding page renders
9. Onboarding page: `auth()` returns session with `workspaceSlug = null` → `redirect('/login')`
10. User is back at login page — the loop restarts on next Google click

## Files Involved

| File | Role |
|------|------|
| `src/lib/auth.config.ts` | `signIn`, `jwt`, `session` callbacks |
| `src/lib/auth.ts` | NextAuth initialization, Prisma adapter overrides |
| `middleware.ts` | Route protection, session check, workspace redirect |
| `src/app/(workspace)/onboarding/page.tsx` | Final redirect based on workspaceSlug |

## Exact Fix

**File: `src/lib/auth.config.ts`** — `signIn` callback

**Before:**
```typescript
const existing = await prisma.user.findUnique({ where: { email: user.email! } })

if (existing) {
  if (existing.deletedAt) return '/login?error=AccountDisabled'
  if (existing.userType === 'CLIENT') return '/login?error=ClientLoginRestricted'
  return true  // <-- exits for ALL existing users (including just-created ones)
}

if (!user.id) return true  // <-- also skips workspace creation

const membership = await prisma.workspaceMember.findFirst({
  where: { userId: user.id },
})
```

**After:**
```typescript
const existing = await prisma.user.findUnique({ where: { email: user.email! } })

if (existing?.deletedAt) return '/login?error=AccountDisabled'
if (existing?.userType === 'CLIENT') return '/login?error=ClientLoginRestricted'

const userId = existing?.id ?? user.id  // use existing.id or user.id
if (!userId) return true

const membership = await prisma.workspaceMember.findFirst({
  where: { userId },
})

if (!membership) {
  // create workspace + settings + subscription + member
}
```

**Key changes:**
- Removed `if (existing) { return true }` — no longer short-circuits workspace creation
- Uses `existing?.id ?? user.id` to reliably get the database user ID
- Always checks for membership and creates workspace if missing

## Why OAuth Succeeds but Dashboard Access Fails

- **OAuth succeeds** because the Google authentication flow itself works (Google verifies the user, Auth.js processes the callback, creates the user record in the database)
- **Dashboard access fails** because without a workspace membership, `onboardingComplete` is `false` and `workspaceSlug` is `null`
- The middleware redirects to `/onboarding` → onboarding page sees no `workspaceSlug` → redirects to `/login`
- The user is authenticated but has no workspace to navigate to

## Additional Fixes

- **`middleware.ts`**: Added detailed logging of session state (`session user`, `workspaceSlug`, `onboardingComplete`)
- **`src/app/(workspace)/onboarding/page.tsx`**: Added logging for session and workspaceSlug values
- **`.env`**: Added `AUTH_URL=http://localhost:3000` for correct cookie domain handling

## Verification Steps

1. **Check server logs**: After clicking "Continue with Google", look for these log lines:
   ```
   [SIGNIN] provider: google email: user@example.com existing: true
   [SIGNIN] userId: <uuid> has membership: false
   [SIGNIN] creating workspace for userId: <uuid>
   [SIGNIN] workspace created successfully
   ```

2. **Trace middleware logs**:
   ```
   [MW] pathname: /onboarding
   [MW] has session: true
   [MW] session user: { id: <uuid>, workspaceSlug: '<slug>', onboardingComplete: true }
   ```

3. **Trace onboarding page logs**:
   ```
   [ONBOARDING] session: true
   [ONBOARDING] session.user: { id: <uuid>, ..., workspaceSlug: '<slug>', onboardingComplete: true }
   [ONBOARDING] redirecting to dashboard: /<slug>/dashboard
   ```

4. **Expected final result**: After Google login → `/onboarding` → middleware redirects to `/<workspaceSlug>/dashboard` → dashboard loads successfully

5. **If still looping**: Check if the session cookie is being set (`authjs.session-token` cookie in browser dev tools). Ensure `AUTH_SECRET` and `AUTH_URL` are correct.

## Cookie Debugging

If issues persist, check browser developer tools → Application → Cookies for:
- `authjs.session-token` (or `__Secure-authjs.session-token` on HTTPS) — must be present after OAuth
- Cookie `Domain` and `Path` must match the site URL
- Cookie `Secure` flag must match the protocol (HTTPS vs HTTP)
