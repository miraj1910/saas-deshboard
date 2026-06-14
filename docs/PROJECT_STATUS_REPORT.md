# FlowDesk — Project Status Report

**Date:** 2026-06-11
**Scope:** Full codebase audit of `/home/miraj/flowdesk`
**Method:** File-by-file inspection of every source file, schema, migration, and config

---

## 1. Executive Summary

FlowDesk is a multi-tenant operations platform for independent knowledge workers. It is approximately **35% complete** by feature surface area.

### Major Completed Systems

- **Database schema** — 16 models, 10 enums, 2 migrations applied, comprehensive seed data
- **Authentication** — Auth.js v5 (next-auth beta.25) with Google OAuth, Credentials login, JWT session strategy
- **Middleware** — Route protection, onboarding enforcement, workspace slug resolution
- **RBAC** — Complete role matrix (OWNER/MANAGER/TEAM_MEMBER/CLIENT) with 40+ granular permissions
- **Authorization layer** — `createWorkspaceContext` and `createClientContext` with assertion helpers
- **Server actions** — Full CRUD for Clients, Projects, Tasks, Time Tracking, Invoices (5 features with actions/queries/schemas)
- **Dashboard** — Complete query pipeline with revenue, activity, deadlines, stats
- **UI shell** — Sidebar, TopNav, MainContent, DashboardShell (with skeleton loading states)
- **Seed data** — 1 workspace, 4 users, 3 clients, 5 projects, 20 tasks, 15 time entries, 3 invoices

### Major Missing Systems

- **Feature pages** — Clients, Projects, Time, Invoices, Settings all return 404 (no page.tsx files exist)
- **Client Portal** — No actual portal UI exists (middleware has subdomain rewrite placeholder)
- **API routes** — No custom API routes beyond NextAuth handler
- **Notifications** — Bell icon exists in TopNav, no implementation
- **Analytics/Reports** — RBAC defines permissions, no UI
- **Account page** — Static shell with hardcoded data, no server actions
- **Stripe integration** — Schema has `stripeSubscriptionId`/`stripeCustomerId`, no integration code
- **Email** — No email service for invites or notifications
- **Invite acceptance** — No page for `/invite` route
- **Client portal** — No client-facing UI

---

## 2. Infrastructure Status

### Next.js 15.5.19 — Partial
- Server components, client components working
- Route groups `(auth)`, `(marketing)`, `(workspace)` established
- `params` in dashboard page broken (not awaited) — **FIXED**
- `next.config.mjs` is empty — no image domains, no rewrites/redirects configured
- `dist` directory exists but `.next` is also present — potential build confusion

### TypeScript 5.6 — Complete
- `strict: true`, `ES2022` target, `bundler` module resolution
- Path alias `@/*` mapping to `./src/*`
- `tsc --noEmit` passes with zero errors

### Tailwind CSS v4 — Complete
- Custom color palette (teal, slate, sidebar tokens)
- Custom spacing for sidebar/topbar
- Dark mode via `class` strategy
- PostCSS with `@tailwindcss/postcss` plugin
- CSS variables architecture in `globals.css`

### Prisma v6 — Complete
- 16 models, 10 enums, proper indexes and constraints
- 2 migrations applied (init + nextauth tables)
- Seed script with realistic demo data

### PostgreSQL (Supabase) — Partial
- Database hosted on Supabase, connection string in `.env`
- No connection pooling configured
- Password contains space in connection string — potential URL parsing issue

### Supabase — Missing
- Using only PostgreSQL, no Supabase Auth, Storage, or Realtime features

### Auth.js v5 (next-auth@5.0.0-beta.25) — Partial
- Google OAuth configured and working
- Credentials login configured and working
- GitHub OAuth configured but credentials are empty strings in `.env`
- JWT session strategy with Prisma Adapter
- Missing: `SessionProvider` on client side, `signOut()` not wired in UI

---

## 3. Database Status

### Models Implemented (16/16 from schema)

| Model | Status | Notes |
|---|---|---|
| `User` | Complete | Email unique, passwordHash, userType, soft-delete |
| `Account` | Complete | NextAuth OAuth links |
| `Session` | Complete | Database sessions (unused with JWT strategy) |
| `VerificationToken` | Complete | Email verification (unused, no email provider) |
| `Workspace` | Complete | Multi-tenant, slug unique, soft-delete |
| `WorkspaceSettings` | Complete | 1:1 with workspace |
| `Subscription` | Complete | Stripe fields present, no integration |
| `WorkspaceMember` | Complete | Composite unique on workspaceId+userId |
| `Client` | Complete | CRM record, soft-delete |
| `ClientMember` | Complete | Portal user link |
| `Project` | Complete | Belongs to client, soft-delete |
| `Task` | Complete | Sort order, soft-delete |
| `TimeEntry` | Complete | Status lifecycle, soft-delete |
| `Invoice` | Complete | Line items, soft-delete |
| `Invite` | Complete | Token-based, role assignment |
| `AuditLog` | Complete | Compliance trail |
| `Activity` | Complete | In-app feed |
| `ApiKey` | Complete | External integrations |

### Migrations Applied (2/2)

1. `20260610101333_init` — All business tables (workspace, user, client, project, task, time_entry, invoice, etc.)
2. `20260611102802_add_nextauth_tables` — accounts, sessions, verification_tokens, emailVerified on users

### Seed Status

- Seed script exists at `prisma/seed.ts`
- Seeds: 1 workspace, 4 users (owner/manager/member/client), 3 clients, 5 projects, 20 tasks, 15 time entries, 3 invoices
- All users share password `password123`
- Command: `npm run seed` (tsx prisma/seed.ts)

### Schema Quality Assessment

- **Good**: Proper use of UUIDs, composite unique constraints, cascade deletes, soft-delete pattern, @map for table naming
- **Good**: Comprehensive indexing for query patterns
- **Good**: Enums for all status fields (no magic strings)
- **Warning**: `InvoiceLineItem` model uses `Decimal(12,2)` for `amount` — queries return Prisma `Decimal` objects requiring `toNumber()` conversion (handled via helper in queries)
- **Warning**: `passwordHash` on User has no default — credentials-only accounts require it, OAuth accounts store `'OAUTH'` sentinel
- **Missing**: `emailVerified` column added in migration 2 but never set/used in application code

---

## 4. Authentication Status

### Credentials Login — Complete
- Email + password via `Credentials` provider in `auth.config.ts`
- bcryptjs comparison against `passwordHash`
- `loginAction` server action in `features/auth/_actions.ts`
- Login form at `(auth)/login/page.tsx` uses server action, not client-side signIn

### Google OAuth — Complete
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` configured
- `allowDangerousEmailAccountLinking: true`
- `prompt: 'consent'`, `access_type: 'offline'`
- Google button in login-form.tsx calls `signIn('google', { redirectTo: '/onboarding' })`
- Verified working (logs confirm successful auth + workspace creation)

### GitHub OAuth — Broken
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are empty strings in `.env`
- GitHub button does not exist in UI

### Session Handling — Partial
- JWT strategy with 30-day maxAge, 24-hour updateAge
- Session augmentation in `next-auth.d.ts` adds `userType`, `workspaceSlug`, `onboardingComplete`
- JWT callback enriches token with membership data
- **Missing**: Client-side `SessionProvider` in root layout — `useSession` will not work
- **Missing**: Sign out functionality is not wired — TopNav has "Sign out" dropdown item with no onClick handler

### Middleware — Partial
- Route protection implemented at `middleware.ts`
- Public routes list controls unauthenticated access
- Authenticated users redirected from landing/login to `/onboarding`
- Onboarding completion enforced
- Workspace slug consistency enforced
- **Bug**: Portal subdomain rewrite uses single quotes with `${}` — results in literal string `'/(portal)${pathname}'` instead of interpolation

### Root Cause of Login Redirect Loop (RESOLVED)

**Root Cause:** In `src/lib/auth.config.ts`, the `signIn` callback's `existing` check found the recently-created user and returned `true` without creating a workspace/membership. For first-time OAuth users, Auth.js v5 calls `adapter.createUser` BEFORE `signIn` callback. The `prisma.user.findUnique({ email })` immediately found the just-created user, hit `if (existing) { return true }`, and skipped workspace creation. With no workspace membership, `onboardingComplete = false` and `workspaceSlug = null`, causing the onboarding page to redirect back to `/login`.

**Fix Applied:** Removed the `if (existing) { return true }` short-circuit. Workspace membership is now checked and created for ALL OAuth users regardless of whether they were just created or pre-existed.

---

## 5. Route Audit

| Route | Exists | Public | Protected | Working | Notes |
|---|---|---|---|---|---|
| `/` | Yes | Yes | No | Partial | Redirects to `/login` |
| `/login` | Yes | Yes | No | Yes | Login form with email/password + Google OAuth |
| `/signup` | Yes | Yes | No | Yes | Registration form, creates workspace |
| `/forgot-password` | No | N/A | N/A | 404 | Listed as public, no page |
| `/reset-password` | No | N/A | N/A | 404 | Listed as public, no page |
| `/invite` | No | N/A | N/A | 404 | Listed as public, no page |
| `/pricing` | No | N/A | N/A | 404 | Listed as public, no page |
| `/onboarding` | Yes | No | Yes | Yes | Redirects to `/{workspaceSlug}/dashboard` |
| `/{slug}/dashboard` | Yes | No | Yes | Yes | Dashboard with stats, activity, deadlines |
| `/{slug}/clients` | No | No | N/A | 404 | Server actions exist, no page |
| `/{slug}/projects` | No | No | N/A | 404 | Server actions exist, no page |
| `/{slug}/time` | No | No | N/A | 404 | Server actions exist, no page |
| `/{slug}/invoices` | No | No | N/A | 404 | Server actions exist, no page |
| `/{slug}/settings` | No | No | N/A | 404 | Sidebar links to it |
| `/account` | Yes | No | Yes | Partial | Static shell with hardcoded data |
| `/api/auth/*` | Yes | Yes | No | Yes | NextAuth handler |
| `/(portal)` | No | N/A | N/A | N/A | Subdomain rewrite target, no implementation |

**Total routes: 7 working, 9 missing (404), 1 partial**

---

## 6. Feature Status

### Workspace System — Complete
- Multi-tenant by `workspaceId` on all records
- Slug-based routing via `[workspaceSlug]` segment
- Auto-creation on OAuth sign-in and registration
- Settings (1:1), subscriptions, members

### RBAC — Complete
- 4 roles: OWNER, MANAGER, TEAM_MEMBER, CLIENT
- 40+ granular permissions in `rbac.ts`
- Permission checks in all server actions
- Role-based query scoping in dashboard

### Clients — In Progress
- Server actions: create, update, archive, list, get (complete)
- Queries: findById, listAll, listScoped, accessibleIds (complete)
- Schemas: create/update with Zod validation (complete)
- **Missing**: Page at `/{slug}/clients`
- **Missing**: Client detail page

### Projects — In Progress
- Server actions: create, update, archive, list, get (complete)
- Task actions: create, update, reorder, delete (complete)
- Queries: project queries + task queries (complete)
- Schemas: project + task with Zod validation (complete)
- **Missing**: Page at `/{slug}/projects`
- **Missing**: Project detail page with task list

### Tasks — In Progress
- Full lifecycle: create → assign → update status → reorder → soft-delete
- Query scoping by role and assignment
- **Missing**: Page (bundled with Projects)

### Time Tracking — In Progress
- Server actions: startTimer, stopTimer, submit, approve, reject (complete)
- Queries: findActiveTimer, findRunningTimerForUser (complete)
- Schemas: full Zod validation (complete)
- **Missing**: Page at `/{slug}/time`
- **Missing**: Active timer display in UI

### Invoices — In Progress
- Server actions: create, send, markPaid, void (complete)
- Queries: findById, list, getNextInvoiceNumber, getApprovedTimeEntries (complete)
- Schemas: create/send/markPaid/void with Zod validation (complete)
- **Missing**: Page at `/{slug}/invoices`
- **Missing**: Invoice detail page with line items

### Notifications — Not Started
- Bell icon in TopNav (no badge, no dropdown)
- No notification system, polling, or WebSocket

### Analytics — Not Started
- RBAC defines ReportPersonal, ReportWorkspace, ReportProfitability, ReportTeamUtilization permissions
- No pages, no queries, no UI

### Client Portal — Not Started
- `ClientMember` model exists
- `client.` subdomain rewrite in middleware (with broken interpolation)
- RBAC defines CLIENT role with read-only permissions
- No portal UI pages

---

## 7. UI Status

### Layout — Complete
- Root layout with ThemeProvider (next-themes) and SidebarProvider
- Auth layout: centered card container
- Workspace layout: Sidebar + TopNav + MainContent
- Workspace slug layout: passthrough

### Sidebar — Complete
- Hardcoded nav items: Dashboard, Clients, Projects, Time, Invoices, Settings
- Collapsible with animation (260px → 60px)
- Active state detection via pathname
- Mobile hidden, Sheet drawer via TopNav hamburger
- Resize/collapse state via React context

### TopNav — Partial
- Workspace switcher dropdown (hardcoded data)
- Search input with toggle
- Dark mode toggle (working)
- Avatar dropdown with Profile, Workspaces, Settings, Sign out
- **Missing**: User data is hardcoded (`'Jane Doe'`, `'jane@acme.com'`, `'JD'` avatar fallback)
- **Missing**: Sign out has no onClick handler
- **Missing**: Notification bell has no badge or dropdown
- **Missing**: Workspace list is hardcoded (`workspaces` array)

### Dashboard Shell — Complete
- 4 stat cards (Revenue MTD, Active Clients, Active Projects, Pending Invoices)
- Recent Activity widget (query-based)
- Upcoming Deadlines widget (query-based)
- Quick Stats widget (hours, tasks, utilization, outstanding invoices, team size)
- Skeleton loading state when data is null

### Login Page — Complete
- Email/password form with validation
- Google OAuth button with Google logo SVG
- Error display
- Loading spinner on submit
- Link to signup

### Signup Page — Complete
- Name, email, password form
- Creates user + workspace + subscription + membership
- Auto-sign-in after registration

### Account Page — Not Started
- Static HTML with hardcoded values (`'Jane Doe'`, `'jane@acme.com'`)
- Profile form (Name + Email) with non-functional Save button
- Password form (Current + New password) with non-functional Update button
- No server actions wired

### UI Components — Complete
- 10 shadcn-style UI primitives: Avatar, Badge, Button, Card, DropdownMenu, Input, Label, Separator, Sheet, Skeleton
- Consistent styling via CSS variables and cn() utility

---

## 8. Technical Debt

### Bugs

1. **Portal subdomain rewrite broken** — `middleware.ts:20` uses `'/(portal)${pathname}'` (single quotes), should be backtick template literal. The `${pathname}` interpolation never executes.

2. **No workspace exists for non-slug routes** — `middleware.ts:50` sets `X-Workspace-Slug` even for paths like `/onboarding` that aren't real workspaces (the slug `'onboarding'` is used header value).

3. **Database URL contains space** — `.env:1` has `GaJeRa MiRaJ` with a space in the password. This requires URL encoding (`%20`) to be valid.

4. **GitHub OAuth will always fail** — `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are empty strings. Auth.js will throw on missing credentials.

### Architecture Risks

1. **No `SessionProvider`** — Any client component using `useSession()` will crash. Currently no component uses it, but it's a ticking time bomb for future work.

2. **Hardcoded user data in TopNav** — The avatar dropdown shows `'Jane Doe'` with `'jane@acme.com'` regardless of actual logged-in user. No session data flows to client components.

3. **No error boundaries** — `AuthorizationError` thrown from `getAuthorizedSession` in server components will crash the page with no fallback UI.

4. **No request validation middleware** — Zod schemas are used in server actions, but there's no centralized validation layer.

5. **Auth callback creates workspace inside signIn** — Workspace creation in `signIn` callback runs inside the Auth.js request lifecycle. If it fails, the entire sign-in fails (may be intentional, but risky).

### Missing Validations

1. **No input sanitization** on login/signup forms
2. **No rate limiting** on auth endpoints
3. **No email verification** — `emailVerified` field exists but never set
4. **No password reset flow** — `/forgot-password` and `/reset-password` are 404
5. **No invite acceptance flow** — `/invite` is 404

### Security Concerns

1. **`allowDangerousEmailAccountLinking: true`** — Allows linking any OAuth account to any email-matched existing account. If an attacker compromises an OAuth provider, they can link to any existing account.

2. **Database credentials in `.env`** — Supabase connection string has plaintext password. No `.env.local` or `.env.example` exists for alternative environments.

3. **No CSRF protection beyond NextAuth defaults** — Server actions rely on Next.js built-in CSRF. No additional verification.

4. **No API key authentication middleware** — `ApiKey` model exists with `keyHash`, but there's no middleware to authenticate API requests using keys.

---

## 9. Immediate Next Steps

### Task 1: Create feature pages for Clients, Projects, Time, Invoices
**Objective**: Build server-rendered pages that consume existing server actions and queries
**Files**: `src/app/(workspace)/[workspaceSlug]/clients/page.tsx`, `projects/page.tsx`, `time/page.tsx`, `invoices/page.tsx`
**Dependencies**: Feature actions/queries/schemas already complete

### Task 2: Wire user session data into TopNav
**Objective**: Replace hardcoded `'Jane Doe'` with actual session user name/email/avatar
**Files**: `src/components/layout/top-nav.tsx`, `src/app/(workspace)/layout.tsx`
**Dependencies**: Session augmentation already complete

### Task 3: Implement working sign-out
**Objective**: Wire the "Sign out" dropdown item to call `signOut()` from `next-auth/react`
**Files**: `src/components/layout/top-nav.tsx`
**Dependencies**: Task 2 (session data)

### Task 4: Add SessionProvider to root layout
**Objective**: Wrap app with `<SessionProvider>` so client components can use `useSession()`
**Files**: `src/app/layout.tsx`
**Dependencies**: None

### Task 5: Fix portal subdomain rewrite
**Objective**: Change single quotes to backticks so template literal interpolates correctly
**Files**: `middleware.ts`
**Dependencies**: None

### Task 6: Implement Account page server actions
**Objective**: Wire profile update and password change to Prisma mutations
**Files**: `src/app/(workspace)/account/page.tsx`, new `src/features/account/_actions.ts`
**Dependencies**: Task 2 (session user ID)

### Task 7: Implement client detail page
**Objective**: Show client info, projects list, invoices list for a single client
**Files**: `src/app/(workspace)/[workspaceSlug]/clients/[clientId]/page.tsx`
**Dependencies**: Task 1 (clients list page)

### Task 8: Implement project detail page with task list
**Objective**: Show project info, Kanban/list view of tasks, ability to create/reorder tasks
**Files**: `src/app/(workspace)/[workspaceSlug]/projects/[projectId]/page.tsx`
**Dependencies**: Task 1 (projects list page)

### Task 9: Wire invite acceptance flow
**Objective**: Create the `/invite` page that validates invite tokens and creates workspace memberships
**Files**: `src/app/(public)/invite/page.tsx`
**Dependencies**: Workspace member creation

### Task 10: Add .env.example and .env.local support
**Objective**: Create `.env.example` with all keys documented, ensure `.env.local` is gitignored
**Files**: `.env.example`
**Dependencies**: None

---

## 10. Readiness Score

| Category | Score | Rationale |
|---|---|---|
| **Architecture** | 60/100 | Route groups are solid, but missing SessionProvider, hardcoded data, empty config |
| **Database** | 85/100 | Schema is comprehensive and well-indexed. Minor Decimal handling concern |
| **Authentication** | 65/100 | Google/Credentials work, GitHub broken, missing SessionProvider, no sign-out wiring |
| **Backend** | 50/100 | Server actions complete for 5 features, but zero pages consume them. High-quality RBAC |
| **Frontend** | 30/100 | UI shell exists. Dashboard renders. All feature pages are 404 |
| **Deployment** | 15/100 | No Dockerfile, no CI config, no production env template, empty next.config |

### Overall: 50/100

The project has a strong backend foundation (database, auth, RBAC, server actions) but is **frontend-light** — the server actions have no pages to consume them. The authentication redirect loop is **resolved**. The next 10 tasks would bring the score to approximately 70/100 by adding the missing feature pages and wiring session data into the UI.
