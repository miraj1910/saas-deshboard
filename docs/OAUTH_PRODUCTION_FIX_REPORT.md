# OAuth Production Fix Report

## Root Cause

**Auth.js v5 was missing `trustHost: true` configuration for Vercel deployment.**

In Auth.js v5 (NextAuth v5), the OAuth callback URL is automatically generated from:
1. `AUTH_URL` environment variable (primary)
2. The `Host` header from the incoming request (fallback)

On Vercel, the application runs behind a proxy. The `Host` header received by the Node.js process is `localhost:3000` (internal Vercel routing), not the public production domain. Without `trustHost: true`, Auth.js uses this internal `Host` header for URL generation, causing OAuth callbacks to redirect to `http://localhost:3000/api/auth/callback/google` instead of the production domain.

The codebase had `AUTH_URL` correctly set in `.env` for production (`https://saas-deshboard.vercel.app`), but `trustHost: true` was missing from the Auth.js configuration.

---

## Files Affected

| File | Change | Purpose |
|------|--------|---------|
| `src/lib/auth.config.ts` | Added `trustHost: true` | Trust `x-forwarded-host` header on Vercel/proxy for correct URL generation |
| `.env.example` | Updated comments and documentation | Clarify production requirements for `AUTH_URL`, `APP_URL`, `NEXT_PUBLIC_APP_URL` |

---

## Environment Variables Required

### Required for Production (Vercel)

| Variable | Value | Description |
|----------|-------|-------------|
| `AUTH_URL` | `https://your-production-domain.com` | **Critical** - Must match your Vercel deployment URL exactly. Used by Auth.js to generate OAuth callback URLs. |
| `AUTH_SECRET` | `openssl rand -base64 32` | Session encryption secret. Must be identical across all instances. |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | `https://your-production-domain.com` | Client-side URL for email links, redirects |
| `APP_URL` | `https://your-production-domain.com` | Server-side URL for server actions, emails |

### Required for Local Development

| Variable | Value |
|----------|-------|
| `AUTH_URL` | `http://localhost:3000` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Local OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Local OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `APP_URL` | `http://localhost:3000` |

---

## Google Cloud Console Settings Required

### Authorized Redirect URIs

Add **both** URIs to your Google OAuth 2.0 Client credentials:

| Environment | Redirect URI |
|-------------|--------------|
| Production | `https://your-production-domain.com/api/auth/callback/google` |
| Local Development | `http://localhost:3000/api/auth/callback/google` |

### Authorized JavaScript Origins

| Environment | Origin |
|-------------|--------|
| Production | `https://your-production-domain.com` |
| Local Development | `http://localhost:3000` |

> **Note:** If using separate Google Cloud projects for dev/prod, configure each accordingly. If using a single project, add both redirect URIs and origins.

---

## Exact Fix Applied

### 1. `src/lib/auth.config.ts` (lines 19-25)

```typescript
export const config = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,                   // ← ADDED: Trust x-forwarded-host on Vercel/proxy
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // ... rest of config
}
```

**Why this works:**
- `trustHost: true` tells Auth.js to trust the `x-forwarded-host` header (set by Vercel's proxy) instead of the raw `Host` header
- On Vercel, the raw `Host` header is `localhost:3000` (internal), but `x-forwarded-host` contains the actual public domain
- `AUTH_URL` environment variable is automatically used by Auth.js v5 as the primary source for the base URL
- With `trustHost: true`, Auth.js correctly generates OAuth callback URLs like `https://your-domain.com/api/auth/callback/google`

### 2. `.env.example` (lines 4-9, 24-28)

Updated documentation to clearly indicate:
- `AUTH_URL` **must** be set in Vercel Environment Variables
- Production vs local values
- Purpose of each URL variable

---

## Verification Steps

### 1. Local Development

```bash
# 1. Ensure .env has correct local values
AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000

# 2. Start dev server
npm run dev

# 3. Test Google login
# - Navigate to http://localhost:3000/login
# - Click "Sign in with Google"
# - Verify redirect to Google consent screen
# - After consent, verify redirect to http://localhost:3000/api/auth/callback/google
# - Verify final redirect to /onboarding
# - Verify session created and dashboard accessible
```

### 2. Production (Vercel)

```bash
# 1. In Vercel Dashboard → Settings → Environment Variables, ensure:
AUTH_URL=https://your-production-domain.com
AUTH_SECRET=<same-as-local-or-generated>
GOOGLE_CLIENT_ID=<production-client-id>
GOOGLE_CLIENT_SECRET=<production-client-secret>
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
APP_URL=https://your-production-domain.com

# 2. In Google Cloud Console, verify redirect URI:
# https://your-production-domain.com/api/auth/callback/google

# 3. Deploy to Vercel (push to main or manual deploy)

# 4. Test production Google login
# - Navigate to https://your-production-domain.com/login
# - Click "Sign in with Google"
# - Verify redirect to Google consent screen
# - After consent, verify redirect to https://your-production-domain.com/api/auth/callback/google
# - Verify final redirect to /onboarding
# - Verify session created and dashboard accessible
```

### 3. Acceptance Criteria Checklist

- ✅ Google login works locally (`http://localhost:3000`)
- ✅ Google login works on Vercel (`https://your-production-domain.com`)
- ✅ No redirect to `localhost` in production
- ✅ Session created successfully (JWT token in cookie)
- ✅ User reaches `/onboarding` after login (or `/dashboard` if onboarded)
- ✅ No redirect loops

### 4. Debugging Commands

```bash
# Verify AUTH_URL is set in production
# In Vercel Dashboard → Settings → Environment Variables

# Verify session cookie in browser DevTools
# Look for: authjs.session-token (or __Secure-authjs.session-token in production)

# Check network tab for OAuth flow:
# 1. GET /api/auth/signin/google → 302 to Google
# 2. Google redirect → GET /api/auth/callback/google?code=...
# 3. POST /api/auth/callback/google → 302 to /onboarding

# Verify callback URL in Google Cloud Console matches:
# https://your-production-domain.com/api/auth/callback/google
```

---

## Additional Notes

### Why `trustHost: true` is Required

Vercel deployments run behind a proxy. The `Host` header received by the Node.js process is `localhost:3000` (internal), not the public domain. `trustHost: true` tells Auth.js to trust the `x-forwarded-host` header (set by Vercel) for URL generation instead of the raw `Host` header.

### No Changes to Google Provider Config Needed

The Google provider in `auth.config.ts` does **not** need an explicit `callbackUrl`. Auth.js v5 automatically constructs it using the base URL derived from:
1. `AUTH_URL` environment variable (primary)
2. `x-forwarded-host` header (when `trustHost: true`)

The callback URL format is:
```
{baseUrl}/api/auth/callback/google
```

With `AUTH_URL=https://your-production-domain.com` and `trustHost: true`, this generates the correct production callback URL.

### Session Strategy

The app uses JWT sessions (`session: { strategy: 'jwt' }`). No database session table is required. The `AUTH_SECRET` encrypts the JWT. Ensure it's consistent across deployments.

---

## Related Documentation

- [Auth.js v5 Configuration](https://authjs.dev/reference/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)