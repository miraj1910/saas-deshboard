# FlowDesk

> The operational backbone for independent knowledge workers.  
> Replace your patchwork of invoicing, CRM, project management, and time-tracking tools with one unified workspace.

---

## Overview

FlowDesk is a multi-tenant SaaS application purpose-built for freelancers and small to mid-size agencies (1–25 people). It consolidates client management, project tracking, time tracking, invoicing, and team collaboration into a single platform with role-based access control.

**Who it serves:**
- **Solo freelancers** — manage clients, projects, time, and invoices in one place
- **Small agencies** — team collaboration with OWNER, MANAGER, and TEAM_MEMBER roles
- **Clients** — read-only portal to view project progress, invoices, and files

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Auth** | [NextAuth v5](https://authjs.dev/) (Auth.js) with JWT strategy |
| **Database** | PostgreSQL via [Prisma ORM](https://www.prisma.io/) |
| **UI** | React 19, Tailwind CSS 4, Radix UI primitives |
| **Payments** | Stripe (subscriptions, billing portal) |
| **Email** | Resend |
| **File storage** | UploadThing |
| **Error tracking** | Sentry |
| **Deployment** | Docker / Vercel |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker (optional, for local database)

### 1. Clone and install

```bash
git clone <repo-url> flowdesk
cd flowdesk
npm install
```

### 2. Set up the database

**Option A: Docker (recommended)**

```bash
docker compose up -d db
```

**Option B: Local PostgreSQL**

Create a database named `flowdesk` and update `DATABASE_URL` in `.env`.

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in the required values — at minimum:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Run `openssl rand -base64 32` to generate |
| `AUTH_URL` | `http://localhost:3000` for local dev |
| `GOOGLE_CLIENT_ID` | From [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |

### 4. Run migrations and seed

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:migrate:deploy` | Deploy migrations (production) |
| `npm run db:seed` | Seed demo data |

---

## Architecture

### Route Groups

```
src/app/
  (auth)/          — login, signup, password reset
  (marketing)/     — landing page (redirects to /login)
  (workspace)/     — authenticated workspace routes
    [workspaceSlug]/   — tenant-scoped routes (dashboard, clients, projects, time, invoices, settings)
    onboarding/        — workspace onboarding flow
  api/             — API routes (NextAuth, UploadThing, Stripe webhooks, files)
  portal/          — client portal (subdomain-based)
  providers/       — SessionProvider (NextAuth client context)
```

### Authentication Flow

```
Login
  → OAuth callback / credentials authorize
  → signIn callback    (creates user + workspace + membership)
  → jwt callback       (queries membership, populates token)
  → session callback   (builds session from token)
  → cookie creation    (encrypted JWT in httpOnly cookie)
  → middleware         (reads JWT, enforces routing rules)
  → onboarding         (if workspace exists) → dashboard
  → onboarding         (if workspace missing) → recovery UI
```

### Key Middleware Behavior

- **Public routes** (`/`, `/login`, `/signup`, etc.) — pass through; authenticated users are redirected to onboarding or dashboard
- **Protected routes** — require valid session; redirect to `/login?callbackUrl=` if missing
- **Onboarding check** — if `onboardingComplete` is false, all routes redirect to `/onboarding`
- **Workspace slug resolution** — extracts slug from URL path, verifies against session
- **Loop protection** — cookie-based detection prevents redirect cycles

---

## Database

The Prisma schema is in `prisma/schema.prisma`. Key models:

| Model | Purpose |
|-------|---------|
| `User` | Unified identity (team + client users) |
| `Workspace` | Multi-tenant container |
| `WorkspaceMember` | User-to-workspace join with role |
| `Client` | CRM record |
| `Project` | Nested under client |
| `Task` | Nested under project |
| `TimeEntry` | Tracked hours |
| `Invoice` | Billing record with line items |
| `Subscription` | Plan and billing status |

---

## Deployment

### Docker

```bash
docker compose up -d
```

### Vercel

1. Connect your repository to Vercel
2. Set environment variables (use `.env.example` as a reference)
3. Ensure `AUTH_URL` matches your Vercel deployment URL
4. Deploy

> **Important:** The middleware uses an Edge-safe auth configuration that does not import Prisma. This prevents runtime errors on Vercel's Edge Runtime.

---

## Environment Variables

See `.env.example` for the full list with descriptions.

**Required for all environments:**
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## License

Private — all rights reserved.
