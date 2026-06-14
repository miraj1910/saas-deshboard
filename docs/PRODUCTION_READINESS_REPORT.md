# Production Readiness Report

## Overview

This report documents the production-hardening measures applied to FlowDesk, including containerization, CI/CD pipelines, error tracking, logging, and rate limiting.

## 1. Dockerfile

**File:** `Dockerfile`

Multi-stage build with three stages:

| Stage | Base | Purpose |
|-------|------|---------|
| `deps` | `node:22-alpine` | Installs all dependencies + production-only copy |
| `builder` | `node:22-alpine` | Generates Prisma client, runs `next build` with standalone output |
| `runner` | `node:22-alpine` | Minimal runtime image with standalone build output, production deps only |

Key details:
- Runs as non-root `nextjs` user (UID 1001)
- `NEXT_TELEMETRY_DISABLED=1` to opt out of Next.js telemetry
- Exposes port 3000
- Build args: `DATABASE_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
- Uses `output: 'standalone'` in `next.config.mjs` for self-contained deployment

## 2. Docker Compose

**File:** `docker-compose.yml`

Two services:

| Service | Image | Purpose |
|---------|-------|---------|
| `db` | `postgres:16-alpine` | PostgreSQL 16 with health check and persistent volume |
| `app` | Built from `Dockerfile` | Next.js production server |

Key details:
- PostgreSQL exposes port 5432
- App depends on `db` service with `condition: service_healthy`
- All sensitive env vars passed through from host `.env` file
- Persistent volume `pgdata` for database data

### Usage

```bash
# Start production stack
docker compose up -d

# View logs
docker compose logs -f app

# Run database migrations
docker compose exec app npx prisma migrate deploy

# Stop
docker compose down

# Stop and remove volumes
docker compose down -v
```

## 3. Environment Variables

**File:** `.env.example`

Comprehensive documentation with all required environment variables organized by category:

| Category | Variables | Required |
|----------|-----------|----------|
| Application | `NODE_ENV`, `LOG_LEVEL`, `APP_URL` | Yes |
| Database | `DATABASE_URL` | Yes |
| Auth | `AUTH_SECRET`, `AUTH_URL` | Yes |
| OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | For Google login |
| File Storage | `UPLOADTHING_APP_ID`, `UPLOADTHING_SECRET` | For file uploads |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` | For email sending |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_AGENCY` | For billing |
| Error Tracking | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | For Sentry |

## 4. GitHub Actions CI/CD

### CI Pipeline

**File:** `.github/workflows/ci.yml`

Triggered on: Push to `main`/`develop`, PRs to `main`

| Job | Steps |
|-----|-------|
| `quality` | PostgreSQL service, install deps, Prisma generate + validate + migrate diff, TypeScript type check, ESLint lint |
| `build` | Needs `quality`, install deps, Prisma generate, production build |

Runs on `ubuntu-latest` with Node 22 and PostgreSQL 16.

### CD Pipeline

**File:** `.github/workflows/deploy.yml`

Triggered on: Push to `main`

| Step | Description |
|------|-------------|
| Checkout | `actions/checkout@v4` |
| Setup Node | Node 22 with npm cache |
| Install | `npm ci` |
| Prisma generate | Generate client with production `DATABASE_URL` |
| Prisma migrate | `prisma migrate deploy` (safe migration) |
| Build | Production build with all secrets |
| Docker build & push | Build image and push to registry |

### Required GitHub Secrets

| Secret | Usage |
|--------|-------|
| `DATABASE_URL` | Database connection |
| `AUTH_SECRET` | NextAuth secret |
| `AUTH_URL` | Application URL |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `UPLOADTHING_*` | File upload credentials |
| `RESEND_API_KEY` | Email service |
| `EMAIL_FROM` | Sender address |
| `STRIPE_*` | Payment processing |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking |
| `SENTRY_ORG` | Sentry organization |
| `SENTRY_PROJECT` | Sentry project |
| `SENTRY_AUTH_TOKEN` | Sentry auth |
| `DOCKER_REGISTRY` | Container registry URL |

## 5. Logging

**Files:**
- `src/lib/logger.ts` — Structured logging utility
- `src/lib/request-logger.ts` — Request lifecycle logging

### Logger (`src/lib/logger.ts`)

Level-based logging with environment control:

| Level | Production Default | Description |
|-------|-------------------|-------------|
| `debug` | Suppressed | Detailed debugging information |
| `info` | Enabled | General operational information |
| `warn` | Enabled | Warning conditions |
| `error` | Enabled | Error conditions |

Format: `[ISO_TIMESTAMP] [LEVEL] message {"meta": "data"}`

Configured via `LOG_LEVEL` env var. In production, defaults to `info` (debug suppressed). In development, defaults to `debug`.

### Request Logger (`src/lib/request-logger.ts`)

Tracks request lifecycle with:
- Start time logging (DEBUG level)
- Completion logging (INFO level) with method, path, status code, duration, user-agent, referer
- Error logging with status extraction

## 6. Error Tracking

**Package:** `@sentry/nextjs` (v8+)

### Configuration Files

| File | Runtime | Purpose |
|------|---------|---------|
| `sentry.client.config.ts` | Browser | Client-side error tracking with session replays |
| `sentry.server.config.ts` | Node.js | Server-side error tracking with Prisma integration |
| `sentry.edge.config.ts` | Edge | Edge runtime error tracking |
| `src/instrumentation.ts` | All | Next.js instrumentation file that loads Sentry configs |
| `src/app/global-error.tsx` | Browser | Global error boundary with Sentry reporting |

### Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| `tracesSampleRate` | 0.25 (production) | 25% of transactions sampled |
| `replaysSessionSampleRate` | 0.1 | 10% of sessions recorded |
| `replaysOnErrorSampleRate` | 1.0 | 100% of errors get replay |
| `environment` | `NODE_ENV` | Automatic env detection |
| `enabled` | Production only | No Sentry in dev/test |

### Environment Variables for Sentry

```env
NEXT_PUBLIC_SENTRY_DSN=https://key@sentry.io/project
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=sntrys_...
```

## 7. Rate Limiting

**File:** `src/lib/rate-limiter.ts`

In-memory rate limiter with configurable windows.

### Rate Limit Rules

| Route Pattern | Window | Max Requests | Purpose |
|---------------|--------|-------------|---------|
| `/login`, `/signup`, `/register`, `/api/auth/*` | 15 minutes | 10 | Prevent brute force auth attacks |
| All other routes | 1 minute | 60 | General API protection |

### Implementation

- **Storage**: In-memory `Map` with automatic cleanup every 60 seconds
- **Keying**: By `IP:pathname:window` (IP from `x-forwarded-for` or `x-real-ip` headers)
- **Headers**: Returns standard `Retry-After` header on 429 responses
- **Scaling note**: For multi-instance deployments, replace the in-memory store with Redis (e.g., `@upstash/ratelimit`)

### Rate Limiting in Middleware

Rate limiting is applied in `middleware.ts` before any page/API handler executes. When exceeded:

```json
HTTP 429 Too Many Requests
Retry-After: 900
Content-Type: application/json

{"error": "Too many requests. Please try again later."}
```

## 8. Deployment Instructions

### Prerequisites

- Node.js 22+
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 16 (or Supabase/Railway/AWS RDS)
- Sentry account (for error tracking)
- UploadThing account (for file uploads)
- Resend account (for emails)
- Stripe account (for billing)

### Option A: Docker Compose (Recommended)

```bash
# 1. Clone and configure
git clone <repo> flowdesk
cd flowdesk
cp .env.example .env
# Edit .env with your credentials

# 2. Build and start
docker compose up -d

# 3. Run migrations
docker compose exec app npx prisma migrate deploy

# 4. Seed data (optional)
docker compose exec app npx tsx prisma/seed.ts

# 5. Verify
curl http://localhost:3000
```

### Option B: Manual Deployment

```bash
# 1. Install dependencies
npm ci

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate deploy

# 4. Build
npm run build

# 5. Start
npm start
```

### Option C: Railway / Fly.io / Render

```bash
# Railway: Connect GitHub repo, set DATABASE_URL + env vars in dashboard
# Fly.io: fly launch --build-arg DATABASE_URL=...
# Render: Use Docker runtime with env vars in dashboard
```

### Post-Deployment Checklist

- [ ] `DATABASE_URL` points to production database
- [ ] `AUTH_SECRET` is unique (not the example value)
- [ ] `AUTH_URL` matches deployment URL
- [ ] Google OAuth credentials configured with correct redirect URIs
- [ ] Stripe webhook endpoint configured pointing to `/api/webhooks/stripe`
- [ ] UploadThing app ID and secret configured
- [ ] Resend API key and verified sender domain configured
- [ ] Sentry DSN configured and test event verified
- [ ] Database migrations have been applied
- [ ] Health check responds at `GET /`
- [ ] Rate limiting returns 429 after rapid auth requests

## 9. Security Considerations

### Current Protections

- **Rate limiting**: Auth routes limited to 10 requests per 15 minutes per IP
- **Session management**: JWT-based sessions with 30-day max age, 24-hour update age
- **Password hashing**: bcrypt with 10 salt rounds
- **Environment separation**: `.env` in `.gitignore`, secrets never committed
- **Container security**: Runs as non-root user in Docker
- **Input validation**: Zod schemas on all create/update actions
- **RBAC**: Role-based access control on all server actions

### Recommended Additions

- **CSP headers**: Content Security Policy via `next.config.mjs` headers
- **Redis rate limiting**: Replace in-memory store for multi-instance deployments
- **Database connection pooler**: Use PgBouncer for connection pooling in production
- **DDoS protection**: Cloudflare or similar CDN/WAF
- **Audit logging**: Track all admin/owner actions for compliance
- **Secrets rotation**: Regular rotation of API keys and secrets
- **Penetration testing**: Regular security audits
