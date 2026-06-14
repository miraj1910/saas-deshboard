# Authentication Stabilization Report

**Date:** 2026-06-11
**Objective:** Eliminate hardcoded user data, wire sign-out, add SessionProvider, remove broken GitHub OAuth

---

## Files Changed

| File | Change |
|---|---|
| `src/app/providers/session-provider.tsx` | **NEW** — Client component wrapping `SessionProvider` from `next-auth/react` |
| `src/app/layout.tsx` | Added `<SessionProvider>` wrapper inside `<SidebarProvider>` |
| `src/components/layout/top-nav.tsx` | Replaced hardcoded `'Jane Doe'`/`'jane@acme.com'`/`'JD'` with live `useSession()` data; wired sign-out to `signOut()` |
| `src/lib/auth.config.ts` | Removed `GitHub` import, provider entry, and `'github'` branch in `signIn` callback |
| `.env.example` | **NEW** — Documented all required environment variables |

---

## Session Flow

```
SessionProvider (root layout)
  │
  ├── Provides Auth.js React context to entire app
  │
  └── TopNav (client component)
        │
        └── useSession() → { data: session }
              │
              ├── session.user.name    → avatar dropdown label
              ├── session.user.email   → avatar dropdown subtitle
              └── getInitials(name)    → avatar fallback initials
```

### Implementation Details

- `SessionProvider` wraps all routes via root layout `src/app/layout.tsx:28`
- `TopNav` calls `useSession()` on every render — session is cached client-side by Auth.js
- `getInitials()` extracts first letters of first/last name, falls back to `'?'` for null
- Avatar shows dynamic initials (e.g., `SC` for Sarah Chen, `GM` for gajeramiraj2@gmail.com → `GA`)
- Display name falls back to `'User'`, email to `''` when session is loading or null

---

## Sign-Out Flow

```
User clicks "Sign out" in avatar dropdown
  │
  └── signOut({ callbackUrl: '/login' })
        │
        ├── Clears session cookie (authjs.session-token)
        ├── Redirects browser to /login
        └── Login page renders, user can sign in again
```

### Implementation Details

- `signOut()` imported from `next-auth/react`, same package as `useSession()`
- `callbackUrl: '/login'` ensures user lands on login page after logout
- No redirect loop — middleware checks for session on `/login`, which is a public route
- No additional server action needed — Auth.js handles cookie destruction

---

## OAuth Status

| Provider | Status | Notes |
|---|---|---|
| Google | Working | `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` configured in `.env` |
| GitHub | Removed | Credentials were empty strings (`GITHUB_CLIENT_ID=` / `GITHUB_CLIENT_SECRET=`), would throw on Auth.js init |
| Credentials | Working | Email/password with bcrypt, `loginAction` server action |

### GitHub Removal Details

Removed from `src/lib/auth.config.ts`:
- `import GitHub from 'next-auth/providers/github'` — line 3
- `GitHub({ clientId, clientSecret, allowDangerousEmailAccountLinking })` — provider entry
- `|| account?.provider === 'github'` in `signIn` callback guard

GitHub can be re-added when valid credentials are obtained. The provider block and import are the only places that need restoration.

---

## Acceptance Criteria Check

| Criteria | Status | Evidence |
|---|---|---|
| ✓ User name shown from session | Done | `{userName}` reads from `session.user.name`, fallback `'User'` |
| ✓ User email shown from session | Done | `{userEmail}` reads from `session.user.email`, fallback `''` |
| ✓ Avatar generated from session | Done | `getInitials(userName)` computes from session name |
| ✓ Sign out works | Done | `signOut({ callbackUrl: '/login' })` on dropdown click |
| ✓ SessionProvider configured | Done | Wraps children in root layout |
| ✓ No hardcoded user data remains | Done | `'Jane Doe'`, `'jane@acme.com'`, `'JD'` all replaced |
| ✓ GitHub OAuth either works or is removed | Done | GitHub provider removed from config |
| ✓ .env.example exists | Done | Documents `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_URL`, `AUTH_SECRET` |

---

## Remaining Auth Issues

1. **`SessionProvider` only on client** — Server components use `auth()` from `@/lib/auth` directly, which is correct. No mixing issues expected.

2. **Workspace switcher still hardcoded** — The `workspaces` array in `top-nav.tsx:51-53` contains `{ slug: 'acme', name: 'Acme Agency' }`. This is a separate feature and was not in scope. The current workspace slug comes from `useParams()`, so navigation still works.

3. **Avatar image not loaded** — The `User` model has `avatarUrl` field, and Google OAuth returns an image. The `session.user.image` is populated by Auth.js. The `Avatar` component accepts an `src` prop for images, but this was not wired. `AvatarFallback` shows initials, which is sufficient. To enable images: pass `<Avatar src={user?.image ?? undefined}>`.

4. **`signOut` does not call server-side `auth().destroy()`** — The client-side `signOut()` clears the cookie and redirects. For JWT strategy, this is sufficient. No database session to clean up.

5. **Profile and Settings links in avatar dropdown still point to hardcoded pages** — `/account` is a static HTML shell, `/account/workspaces` returns 404, `/{slug}/settings` returns 404. These are feature pages outside scope.
