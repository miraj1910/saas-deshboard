# FlowDesk — Authentication Architecture

**Status:** Draft
**Target:** Auth.js v5 (NextAuth), Next.js 15 App Router

---

## 1. Auth.js Configuration

### File: `src/lib/auth.ts`

**Framework:** Auth.js v5 (NextAuth) with the following providers:

| Provider | Purpose | v1 Scope |
|---|---|---|
| **Credentials** | Email + password login for all user types | Required |
| **Google** | One-click signup/login, auto-fills profile | Required |

### Adapter

Use **PrismaAdapter** from `@auth/prisma-adapter`. This maps Auth.js session/account/verification-token models to the existing `User` table and auto-creates `Account` and `Session` rows for OAuth accounts.

**Why PrismaAdapter:** Eliminates the need to manually manage OAuth `Account` linked tables and session records. The adapter creates `Account` rows for Google-linked users and `Session` rows for database sessions. For the credentials provider, we manage sessions manually via JWT to keep the path simple.

### Provider Configuration

**Credentials Provider:**

```
authorize(credentials)
  → find User by email (include deletedAt check)
  → if userType=CLIENT, deny (client users log in via portal subdomain)
  → bcrypt.compare(credentials.password, user.passwordHash)
  → if no match, return null (generic "Invalid email or password")
  → return user object (id, email, name, userType, avatarUrl)
```

**Google Provider:**

```
clientId = env.GOOGLE_CLIENT_ID
clientSecret = env.GOOGLE_CLIENT_SECRET
authorization params: prompt: "consent", access_type: "offline"
```

### Auth.js Callbacks

**`signIn` callback (Google only):**
```
after Google auth:
  → check if User exists by email
  → if exists AND user.deletedAt is set → redirect to /login?error=AccountDisabled
  → if exists AND userType=CLIENT → redirect to /login?error=ClientLoginRestricted
  → if does not exist → create User (userType=TEAM, passwordHash="OAUTH_GOOGLE")
  → allow sign-in
```

**`jwt` callback:**
```
token.sub = user.id (or existing token.sub)
token.userType = user.userType
token.workspaceSlug = from db query or existing
token.onboardingComplete = boolean
```

**`session` callback:**
```
session.user.id = token.sub
session.user.userType = token.userType
session.user.workspaceSlug = token.workspaceSlug
session.user.onboardingComplete = token.onboardingComplete
```

### Type Augmentation

File: `src/types/next-auth.d.ts`

Extend `Session.user` and `JWT` to include `id`, `userType`, `workspaceSlug`, `onboardingComplete`.

---

## 2. Session Strategy

**Strategy:** JWT (default in Auth.js v5)

**Rationale for JWT over database sessions:**

| Factor | JWT | Database Sessions |
|---|---|---|
| Latency | Zero — no DB call on every request | +5–15ms per request |
| Cold-start | Stateless, scales horizontally | Requires session table + adapter |
| Revocation | Manual (token blacklist or short expiry) | Instant (delete row) |
| Complexity | Minimal — no adapter needed for credentials | Requires PrismaAdapter for Session model |
| Use case | Workspace API calls, middleware edge runtime | Long-lived admin sessions |

**Token configuration:**

| Parameter | Value |
|---|---|
| `maxAge` | 30 days (30 * 24 * 60 * 60) |
| `updateAge` | 24 hours (JWT refresh interval) |

**On every authenticated request (middleware):**
1. Auth.js validates the JWT signature and expiry
2. `jwt` callback runs — we query the DB to check if the user is still active (not deleted)
3. If deleted → clear token, redirect to login
4. If active → return token as-is

**Note:** The `jwt` callback queries the User table on every `updateAge` interval (24h), not on every request. In-flight requests use the cached token. This keeps the fast path fast while ensuring revocation within 24 hours.

---

## 3. Credentials Login

### Flow

```
1. User visits /login
2. Enters email + password
3. Form POSTs to Server Action (signIn via Auth.js)
4. Auth.js CredentialsProvider.authorize() is called
5. On success → JWT issued, redirect to /{slug}/dashboard
6. On failure → return error, form shows "Invalid email or password"
```

### Password Validation

- Passwords stored as bcrypt hash in `User.passwordHash`
- Minimum length: 8 characters (enforced at signup)
- No maximum length (bcrypt handles up to 72 bytes)
- Rate limit: 5 attempts per email per 15 minutes (via Upstash Ratelimit or in-memory)

### Error Messages

| Condition | User-facing Message |
|---|---|
| Email not found | "Invalid email or password" |
| Wrong password | "Invalid email or password" |
| User soft-deleted | "Invalid email or password" |
| Client user on team login | "Invalid email or password" |
| Rate limited | "Too many attempts. Try again in 15 minutes." |

**Why generic messages:** Prevents email enumeration attacks. Do not distinguish between "email not found" and "wrong password."

### Client Login Restriction

Client users (userType=CLIENT) cannot log in via the main app `/login` route. They are redirected to the client portal subdomain. The CredentialsProvider.authorize() explicitly rejects CLIENT userType, returning null with a generic error.

Client login happens on `client.flowdesk.io/login` via a separate Auth.js configuration or a shared instance with a custom `signIn` page. In v1.5, this will be a dedicated portal setup; for v1, the same Auth.js instance is used with portal-scoped pages.

---

## 4. Google OAuth

### Flow

```
1. User clicks "Continue with Google" on /login or /signup
2. Auth.js redirects to Google consent screen
3. User approves → Google sends auth code to callback URL
4. Auth.js exchanges code for tokens
5. signIn callback runs:
   a. If existing User found by email → sign in (unless deleted)
   b. If new email → create User with userType=TEAM, passwordHash="OAUTH_GOOGLE"
6. First-time Google user → redirect to onboarding
7. Returning Google user → redirect to /{slug}/dashboard
```

### Account Linking

- Google auth automatically links to an existing User by email
- If the User was created via credentials (has bcrypt hash) and user logs in with Google for the first time, the signIn callback matches by email and allows sign-in — no merge needed
- If the User was created via Google and user later tries credentials login, they must use "Forgot password" to set a password first

### Password Hash for OAuth Users

Users created via Google have `passwordHash = "OAUTH_GOOGLE"`. This sentinel value is:
- Not a valid bcrypt hash (bcrypt.compare returns false)
- Immediately recognizable in the DB as an OAuth-only account
- Checked at forgot-password time: if user has no valid bcrypt hash, allow them to set a password

---

## 5. Protected Routes

### Route Protection Strategy

Three-tier protection enforced at the middleware level:

| Tier | Guard | Routes |
|---|---|---|
| **Public** | No auth required | /, /pricing, /login, /signup, /forgot-password, /reset-password/:token, /invite/:token, /api/auth/* |
| **Authenticated** | Valid JWT session required | /account/*, /:slug/* (workspace routes) |
| **Authenticated + Workspace Member** | Valid JWT + user must be a WorkspaceMember in the resolved workspace | /:slug/clients/*, /:slug/projects/*, /:slug/time/*, /:slug/invoices/*, /:slug/team/*, /:slug/settings/* |

### Unauthenticated Access

If no valid session:
- Workspace routes → redirect to `/login?callbackUrl=...`
- Account routes → redirect to `/login?callbackUrl=...`
- API auth routes → 401
- Public routes → render normally

### Authenticated but Not a Workspace Member

If user has a valid session but is NOT a member of the requested workspace:
- If the user has no workspace memberships at all → redirect to `/onboarding`
- If the user has workspace memberships but not in this one → show 403 or redirect to a workspace the user belongs to
- This case is rare in v1 (single-workspace users) but matters for multi-workspace users (v2)

### Route Groups and Layout Hierarchy

```
(marketing)/     → public, no layout auth
(auth)/          → public, no layout auth, redirect to dashboard if already logged in
(workspace)/     → layout: auth check + workspace resolution + sidebar
(portal)/        → layout: auth check + client-only guard + portal nav (v1.5)
```

### Workspace Resolution

Middleware extracts the slug from the URL path (`/:slug/...`):
1. If user is authenticated → verify user is a WorkspaceMember in the workspace with that slug
2. If verified → attach workspaceId to the request headers
3. If not verified → redirect as above

---

## 6. Middleware

### File: `middleware.ts`

**Runtime:** Edge (Vercel Edge Functions / Next.js Middleware)

### Responsibilities

| Responsibility | Detail |
|---|---|
| Auth check | Validate JWT for protected routes |
| Subdomain detection | Rewrite `client.flowdesk.io` to `/(portal)/*` |
| Workspace resolution | Extract slug from path, verify membership |
| Route redirection | Unauthenticated → /login, non-member → appropriate page |
| Public route bypass | Skip all checks for marketing, auth pages |

### Pseudocode Flow

```
export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const hostname = req.headers.get('host')

  // ── 1. Client portal subdomain ──
  if (hostname starts with 'client.'):
    rewrite to /(portal)/ + pathname
    return

  // ── 2. Public routes ──
  const publicRoutes = ['/', '/pricing', '/login', '/signup',
    '/forgot-password', '/reset-password', '/invite', '/api/auth']
  if (publicRoutes.some(r => pathname starts with r)):
    return

  // ── 3. Auth check ──
  if (!isLoggedIn):
    redirect to /login?callbackUrl= + pathname

  // ── 4. Onboarding check ──
  if (!req.auth.user.onboardingComplete):
    if pathname !== '/onboarding':
      redirect to /onboarding

  // ── 5. Workspace routes (/:slug/...) ──
  const match = pathname.match(/^\/([^/]+)\//)
  if (match):
    // Verify workspace membership via DB lookup or cached header
    // If not member → redirect to workspace selection
    // If member → inject X-Workspace-Id header

  return
})
```

### Auth.js Middleware Integration

Auth.js v5 provides a `auth()` middleware wrapper. The middleware:
1. Calls `auth()` to get the session (`req.auth`)
2. If no session and route is protected → redirect to login
3. Runs the custom logic above
4. Calls `NextResponse.next()` with modified headers/URL

### Matcher Configuration

```
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
```

---

## 7. User Onboarding Flow

### Entry Points

| Entry Point | User Type | Next Step |
|---|---|---|
| `/signup` (credentials) | New TEAM user | Create Workspace → Onboarding |
| `/signup` (Google) | New TEAM user | Create Workspace → Onboarding |
| `/invite/:token` (team invite) | New TEAM user invited to existing workspace | Accept invite → Join Workspace → Dashboard |
| `/invite/:token` (client invite) | New CLIENT user | Accept invite → Set password → Portal Dashboard |
| `/login` (returning user) | Existing TEAM user | Dashboard |
| `client.flowdesk.io/login` | Existing CLIENT user | Portal Dashboard |

### Signup Flow (New Workspace)

```
1. /signup → form: email, password, name
   - OR "Continue with Google"
2. Server Action: signup(email, password, name)
   a. Check email not already in use
   b. Create User record (userType=TEAM)
   c. Generate unique slug from name (e.g., "Sarah's Agency" → "sarahs-agency")
   d. Create Workspace record
   e. Create WorkspaceSettings default
   f. Create Subscription (FREE plan, TRIALING status, 14-day trial)
   g. Create WorkspaceMember (role=OWNER)
   h. Sign in via Auth.js
   i. Redirect to /onboarding
3. /onboarding wizard (multi-step):
   Step 1: Workspace name (pre-filled from slug), company info (optional)
   Step 2: Solo or Agency? If Agency → invite team members
   Step 3: Done → redirect to /{slug}/dashboard
```

### Invite Acceptance Flow (Team)

```
1. User receives email with /invite/:token link
2. Invite page: shows workspace name + role
3. If user already has an account:
   a. Log in (or already logged in)
   b. Server Action: acceptInvite(token)
     - Validate token (not expired, status=PENDING)
     - Create WorkspaceMember
     - Mark invite as ACCEPTED
   c. Redirect to /{slug}/dashboard
4. If user is new:
   a. Show signup form (name, password)
   b. Server Action: acceptInvite(token, name, password)
     - Validate token
     - Create User record (userType=TEAM)
     - Create WorkspaceMember
     - Mark invite as ACCEPTED
     - Sign in via Auth.js
   c. Redirect to /{slug}/dashboard
```

### Invite Acceptance Flow (Client Portal)

```
1. Client receives email with /invite/:token link
2. Invite page shows client name
3. Show set-password form
4. Server Action: acceptClientInvite(token, name, password)
   a. Validate invite (not expired, has clientId, status=PENDING)
   b. Create User record (userType=CLIENT)
   c. Create ClientMember record (links User to Client)
   d. Mark invite as ACCEPTED
   e. Sign in via Auth.js
5. Redirect to client.flowdesk.io/portal/dashboard
```

### Returning User Flow

```
1. /login → form: email, password
   - OR "Continue with Google"
2. Auth.js CredentialsProvider.authorize()
   a. Find user by email
   b. Reject if deleted, client user, or wrong password
   c. Return user
3. Auth.js issues JWT
4. Middleware checks:
   - Determine workspace membership:
     a. Query WorkspaceMember for userId
     b. If 0 memberships → redirect to /onboarding
     c. If 1 membership → redirect to /{slug}/dashboard
     d. If multiple memberships → show workspace picker (v2)
   - jwt callback stores workspaceSlug in token for quick access
5. Redirect to dashboard
```

### Workspace Slug Generation

```
Input: workspace name
Process:
  1. Lowercase and trim
  2. Replace spaces with hyphens
  3. Remove non-alphanumeric chars (except hyphens)
  4. Collapse multiple hyphens
  5. Truncate to 50 chars
  6. Append random 4-char suffix if slug collision
  7. Retry on collision (max 5 attempts)
```

---

## 8. Auth Entity Relationship

```
User
  ├── id (PK, UUID)
  ├── email (unique)
  ├── passwordHash (bcrypt or "OAUTH_GOOGLE")
  ├── name
  ├── avatarUrl (nullable)
  ├── userType (TEAM | CLIENT)
  ├── deletedAt (nullable)
  │
  ├── Account (Auth.js OAuth link) [0..N]
  │   ├── provider (e.g., "google")
  │   ├── providerAccountId
  │   └── userId → User.id
  │
  ├── Session (Auth.js database session, unused in v1) [0..N]
  │
  └── WorkspaceMember [0..N]
      ├── role (OWNER | MANAGER | TEAM_MEMBER)
      └── workspaceId → Workspace.id

Invite
  ├── token (unique)
  ├── email
  ├── role (WorkspaceRole — only for team invites)
  ├── status (PENDING | ACCEPTED | EXPIRED | REVOKED)
  ├── expiresAt
  ├── clientId (nullable — if set, it's a client portal invite)
  ├── createdById → User.id
  └── workspaceId → Workspace.id
```

---

## 9. Security Considerations

| Concern | Mitigation |
|---|---|
| Email enumeration | Generic "Invalid email or password" for all login failures |
| Brute force | Rate limit: 5 attempts per email per 15 min + 10 attempts per IP per min |
| Session hijacking | JWT signed with high-entropy secret, 30-day expiry, httpOnly cookies |
| CSRF | Auth.js built-in CSRF token on all auth endpoints |
| Deleted user login | Check `deletedAt` in authorize() and jwt callback |
| Client user on team login | Explicitly reject userType=CLIENT in authorize() |
| Weak passwords | Enforce 8-char minimum, no common patterns check at signup |
| Invite token theft | Tokens are 32-byte random hex (64 chars), 7-day expiry, single-use |
| OAuth account takeover | Email must match existing User to link — no email-less linking |
| XSS on auth pages | Auth.js escapes all form output, React renders safely by default |

---

## 10. Open Questions

| Question | Decision Needed By | Notes |
|---|---|---|
| Should we support magic-link (email) login? | v1.5 | Low friction for non-technical users, but adds email dependency |
| Multi-workspace user dashboard? | v2 | Where does a user with 3 workspaces land on login? |
| OAuth account unlinking? | v2 | User wants to disconnect Google and use password only |
| Session revocation on password change? | v1 | Invalidate all existing sessions when password changes |
| Remember-me vs session-only? | v1 | 30-day JWT vs session cookie — do we offer a choice? |
| SSO for Agency plan? | v2 | SAML/SSO for larger teams on AGENCY plan |
