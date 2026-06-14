# FlowDesk — Project Context

**Single source of truth for all development decisions.**

---

## Executive Summary

**What FlowDesk is:** A multi-tenant SaaS application that serves as the operational backbone for independent knowledge workers. It replaces the typical patchwork of invoicing tools, CRMs, project management software, and time-trackers with one unified workspace.

**Who it serves:**
- Solo freelancers who need a single app to run their business
- Small to mid-size agencies (2–25 people) who need team management, role-based access, and client-facing portals
- Their clients, who get a read-only portal to view project progress and invoices

**What problem it solves:** Freelancers and small agencies typically juggle 4–6 separate tools (Harvest for time, FreshBooks for invoicing, Trello for tasks, HubSpot for CRM, etc.) with no data integration between them. FlowDesk is the single source of truth for client relationships, project work, time tracking, and billing — all within one login, one data model, and one permission system.

**North star metric:** Make running a services business as simple as using a single app.

---

## Business Model

Three-tier SaaS pricing. All plans include core workspace functionality. Differentiation is by team size, feature access, and support level.

### Free Plan
- 1 workspace
- 1 user (solo freelancer)
- Up to 5 clients
- Up to 3 active projects
- Time tracking & invoicing
- No team features
- No client portal
- Community support

### Pro Plan
- 1 workspace
- Up to 5 team members (MANAGER + TEAM_MEMBER roles)
- Unlimited clients & projects
- Time tracking with approval workflow
- Invoicing with PDF export
- Client portal (read-only)
- Basic reports (revenue, utilization)
- Email support

### Agency Plan
- 1 workspace with unlimited team members
- All Pro features
- Advanced reports (project profitability, team utilization)
- Priority support
- Future: API access, file storage, expense tracking

---

## User Roles

### OWNER

**Responsibilities:** Owns the workspace. Manages branding, subscription/billing, team invitations, role assignments, and ownership transfer. Has unrestricted access to all data within the workspace.

**Permissions:**
- Full CRUD on all entities within the workspace
- Invite and remove team members
- Change any user's role (except self)
- Transfer ownership to another member
- Manage subscription and billing
- Delete workspace
- Override any scope restriction

**Limitations:** Exactly one OWNER per workspace. Cannot demote self without transferring ownership first. Cannot change own role.

### MANAGER

**Responsibilities:** Oversees projects and people. Creates tasks, assigns work to team members, monitors time logs, approves timesheets, and generates reports. Does not handle billing.

**Permissions:**
- Full CRUD on clients, projects, and tasks
- View all team time entries (read)
- Approve or reject submitted time entries
- Invite clients to portal
- View workspace reports and member list
- Edit own time entries

**Limitations:** Cannot self-approve timesheets. Cannot generate, send, or void invoices. Cannot invite team members, change roles, or manage workspace settings. Cannot delete clients or projects permanently (archive only).

### TEAM_MEMBER

**Responsibilities:** Individual contributor. Tracks time against assigned tasks, manages own projects and clients, submits timesheets for approval.

**Permissions:**
- Create clients and projects (own scope)
- View and update own assigned tasks and projects
- Log time (timer + manual), submit for approval
- View own invoices
- View own membership

**Limitations:** Scoped visibility — sees only projects they created or are assigned to, and clients linked to those projects. Cannot view team time entries. Cannot approve anything. Cannot access workspace settings, team list, or reports. Cannot delete clients or projects.

### CLIENT

**Responsibilities:** External stakeholder. Views project progress and invoices through a restricted portal.

**Permissions:**
- View own client record
- View projects where their client record is the billing party
- View invoices billed to them
- Update own portal profile (name, password)

**Limitations:** No access to team members, time entries, internal notes, other clients, or workspace settings. No create/update/delete on any business entity. No access to workspace app — restricted to dedicated portal subdomain.

---

## Core Features

### Authentication
- Email/password login
- Google OAuth
- Session management via Auth.js
- Rate-limited public endpoints
- Secure invite acceptance flow

### Workspace Management
- Tenant creation with unique slug
- Onboarding wizard (name, team or solo)
- Settings managed via WorkspaceSettings entity (branding, timezone, company info)

### Client CRM
- Contact records with status pipeline (lead → active → inactive → archived)
- Company name, email, phone, notes
- Client portal user management (invite, deactivate)
- Full audit trail on status changes

### Projects
- Nested under clients
- Hourly rate per project
- Status lifecycle (active → completed → archived)
- Start and due dates
- Soft-delete with recovery window

### Tasks
- Belong to projects
- Assignable to one team member
- Status: todo → in_progress → done
- Float-based sort order for efficient drag-and-drop reordering
- Due dates

### Time Tracking
- Start/stop timer linked to project and optional task
- Manual time entry with duration
- Timesheet submission and approval workflow
- States: draft → submitted → approved/rejected
- Self-approval prohibited at database/application level

### Client Portal
- Separate subdomain (`client.flowdesk.io`)
- Read-only views of projects, tasks, and invoices
- Profile management for portal users
- No access to internal workspace data

### Invoices
- Generated from unbilled time entries
- Invoice number unique per workspace
- Status lifecycle: draft → sent → paid → overdue → canceled
- Line items linked back to originating time entries
- PDF download
- Audit log for all status transitions

### Notifications / Activity Feed
- In-app activity feed on dashboards
- Events: task completed, invoice sent, member joined, time approved
- Email notifications for invites, invoice delivery, password resets

### Analytics / Reports
- Personal dashboard (own tasks, time, invoices)
- Workspace dashboard (revenue MTD, utilization)
- Project profitability drilldown
- Team utilization report

### Subscription System
- Workspace linked to a Subscription entity with plan (FREE / PRO / AGENCY) and status (TRIALING / ACTIVE / PAST_DUE / CANCELED / EXPIRED)
- Trial period with expiration tracking
- Plan enforcement (feature gating per plan)
- Stripe integration for payment collection (v2)

---

## User Journeys

### Owner Journey
1. Sign up → create workspace with slug
2. Complete onboarding wizard (name, branding)
3. Choose solo or agency path
4. If agency: invite team members via email, assign MANAGER or TEAM_MEMBER roles
5. Create client records in CRM
6. Create projects under clients with hourly rates
7. Optionally assign team members to projects
8. Log time themselves or review team timesheets
9. Approve/reject submitted time entries
10. Generate invoices from unbilled time entries
11. Send invoices to clients via portal
12. Mark invoices as paid on receipt
13. Monitor dashboard for revenue, utilization, overdue

### Manager Journey
1. Log in → see dashboard with team workload and deadlines
2. View assigned projects
3. Create tasks and milestones
4. Assign tasks to team members
5. Monitor time logs per team member
6. Approve or reject submitted timesheets
7. Request revisions on entries
8. Generate project reports
9. Escalate billing to Owner

### Team Member Journey
1. Log in → view personal tasks and deadlines
2. Start timer on active task (or manually add time)
3. Stop timer — entry saved as draft
4. Review personal timesheet
5. Submit entries for approval
6. If rejected: revise and resubmit
7. View own invoices
8. See project progress and any client feedback

### Client Journey
1. Receive invite email from workspace
2. Set password and accept invite
3. Log in to client portal (separate subdomain)
4. View dashboard: active projects and unpaid invoices
5. View project details and task progress
6. View invoice breakdown
7. Send messages / request changes
8. Project completes → archived view

---

## Multi-Tenant Architecture

### Workspace Ownership
- Each workspace is created by a user who becomes its first (and initially only) OWNER
- A User can belong to multiple workspaces with independent roles
- Workspace membership is managed through the WorkspaceMember join table
- Client portal users (CLIENT role) are linked via ClientMember, not WorkspaceMember

### Tenant Isolation
- Every business entity contains a `workspaceId` foreign key referencing Workspace
- All queries must filter by `workspaceId` — enforced via Prisma middleware at the database access layer
- Postgres Row-Level Security policies are planned as defense-in-depth (future)
- Client portal access is scoped to a single client record, not to the entire workspace

### Data Access Boundaries
- No cross-tenant access permitted under any condition
- Authorization checks verify both the user's role AND the resource's `workspaceId`
- Soft-delete (`deletedAt` timestamp) prevents permanent data loss
- Audit logs capture all sensitive operations per workspace

### How Every Entity Relates to Workspace

| Entity | Scoped by workspaceId | Cascade on Workspace Delete |
|---|---|---|
| WorkspaceSettings | Yes (1:1) | Cascade |
| WorkspaceMember | Yes | Cascade |
| Subscription | Yes | Cascade |
| Client | Yes | Cascade |
| ClientMember | Yes | Cascade |
| Project | Yes | Cascade |
| Task | No (scoped via Project → Workspace) | Cascade |
| TimeEntry | Yes | Cascade |
| Invoice | Yes | Cascade |
| InvoiceLineItem | No (scoped via Invoice → Workspace) | Cascade |
| Invite | Yes | Cascade |
| AuditLog | Yes | Cascade |
| Activity | Yes | Cascade |
| ApiKey | Yes | Cascade |

---

## Database Overview

### Entities

| Entity | Purpose |
|---|---|
| **Workspace** | Multi-tenant container. Core identity — name and slug. Settings moved to WorkspaceSettings. |
| **WorkspaceSettings** | 1:1 extension of Workspace. Stores branding (logo, color), timezone, company info (address, tax ID), theme. |
| **Subscription** | Workspace billing record. Links to Stripe. Stores plan (FREE / PRO / AGENCY), status, period dates. |
| **User** | Unified identity for both team members and client portal users. Discriminated by `userType` (TEAM / CLIENT). |
| **WorkspaceMember** | Join table linking User to Workspace with a role (OWNER / MANAGER / TEAM_MEMBER). |
| **Client** | CRM record — company or individual the workspace does business with. |
| **ClientMember** | Links a User (type CLIENT) to a Client record for portal access. |
| **Project** | Work container nested under a Client. Has hourly rate, status, dates. |
| **Task** | Work item within a Project. Assignable to one User. Float sort_order for reordering. |
| **TimeEntry** | Logged time against a Project, optionally linked to a Task. Has approval workflow. |
| **Invoice** | Billing document sent to a Client. Generated from time entries. |
| **InvoiceLineItem** | Individual line on an Invoice. Links back to originating TimeEntry. |
| **Invite** | Pending invitation for team members or client portal users. Has token, expiry, status. |
| **AuditLog** | Compliance trail for sensitive mutations (invoice sent, role changed, client deleted). |
| **Activity** | In-app feed events for dashboards (task completed, invoice paid, member joined). |
| **ApiKey** | Future: API keys for Zapier / external integrations. |

### Key Relationships
- Workspace → WorkspaceSettings: one-to-one (cascade delete)
- Workspace → Subscription: one-to-many (cascade delete)
- Workspace → Client: one-to-many (cascade delete)
- Client → Project: one-to-many (restrict delete)
- Project → Task: one-to-many (cascade delete)
- Project → TimeEntry: one-to-many (restrict delete)
- User → TimeEntry: one-to-many (cascade delete)
- Client → Invoice: one-to-many (restrict delete)
- Invoice → InvoiceLineItem: one-to-many (cascade delete)
- TimeEntry → InvoiceLineItem: one-to-many (set null on delete)

### Important Constraints
- User email globally unique
- Workspace slug globally unique
- WorkspaceSettings: one WorkspaceSettings per Workspace (unique on workspaceId)
- Subscription: one active subscription per Workspace at a time (application-level enforcement)
- Invoice number unique per workspace (composite)
- WorkspaceMember unique per (workspaceId, userId)
- ClientMember unique per (clientId, userId)
- TimeEntry: endTime > startTime
- Invoice: dueDate >= issuedDate
- InvoiceLineItem: quantity > 0, unitPrice >= 0, amount >= 0
- Manager cannot approve own time entries (application-level enforcement)

---

## RBAC Summary

### Permissions Matrix

| Resource | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| Workspace settings | Full | View | — | — |
| Team members | Full | View list | View own | — |
| Clients | Full | Full | Create + own view/update | View own record |
| Client portal users | Full | Create + view | — | Manage own profile |
| Projects | Full | Full | Create + own CRUD | View own |
| Tasks | Full | Full | Create (own projects) + own CRUD | View |
| Time entries | Full (any) | Own CRUD + view all + approve | Own CRUD + submit | — |
| Invoices | Full | View | View own | View own |
| Invoice line items | Full | View | View own | View |
| Reports | Full | Full (workspace) | Personal only | Personal only |
| Permissions | Manage all | View all | View own | View own |

### Security Rules
- Deny-by-default: any action not explicitly granted is forbidden
- Self-approval of timesheets is prohibited for all roles
- Only OWNER can permanently delete entities; MANAGER and TEAM_MEMBER are limited to status transitions (archive)
- TEAM_MEMBER visibility is scoped to projects they created or are assigned to
- CLIENT role sees only their own client record, projects, and invoices
- All authorization checks verify both role and workspace_id
- No user can change their own role

---

## Route Structure

### Auth Routes (public)
- `/signup`, `/login`, `/forgot-password`, `/reset-password/:token`, `/invite/:token`, `/logout`

### Dashboard Routes (workspace-scoped)
- `/:slug/dashboard` — personal overview
- `/:slug/dashboard/reports` — workspace metrics
- `/:slug/dashboard/reports/profitability/:projectId` — per-project drilldown
- `/:slug/dashboard/reports/team-utilization` — per-member hours

### Client Routes
- `/:slug/clients` — list
- `/:slug/clients/new` — create
- `/:slug/clients/:clientId` — detail
- `/:slug/clients/:clientId/edit` — update
- `/:slug/clients/:clientId/archive` — archive
- `/:slug/clients/:clientId/portal/invite` — invite to portal

### Project Routes
- `/:slug/projects` — list
- `/:slug/projects/new` — create
- `/:slug/projects/:projectId` — detail
- `/:slug/projects/:projectId/edit` — update
- `/:slug/projects/:projectId/status` — transition
- `/:slug/projects/:projectId/tasks` — list
- `/:slug/projects/:projectId/tasks/new` — create task
- `/:slug/projects/:projectId/tasks/:taskId` — task detail
- `/:slug/projects/:projectId/tasks/:taskId/edit` — update task
- `/:slug/projects/:projectId/tasks/:taskId` — delete task

### Time Routes
- `/:slug/time` — dashboard
- `/:slug/time/entries` — paginated list
- `/:slug/time/entries/new` — manual entry
- `/:slug/time/timer/start` — start timer
- `/:slug/time/timer/stop` — stop timer
- `/:slug/time/entries/:entryId/edit` — edit draft
- `/:slug/time/entries/:entryId/submit` — submit for approval
- `/:slug/time/approvals` — approval queue
- `/:slug/time/approvals/:entryId/approve` — approve
- `/:slug/time/approvals/:entryId/reject` — reject

### Invoice Routes
- `/:slug/invoices` — list
- `/:slug/invoices/new` — create from unbilled entries
- `/:slug/invoices/:invoiceId` — detail
- `/:slug/invoices/:invoiceId/edit` — edit draft
- `/:slug/invoices/:invoiceId/send` — mark sent
- `/:slug/invoices/:invoiceId/pay` — mark paid
- `/:slug/invoices/:invoiceId/void` — void
- `/:slug/invoices/:invoiceId/pdf` — download PDF

### Team Routes
- `/:slug/team` — member list
- `/:slug/team/invite` — send invite
- `/:slug/team/:memberId/role` — change role
- `/:slug/team/:memberId` — remove member
- `/:slug/team/transfer-ownership` — transfer

### Settings Routes
- `/:slug/settings` — overview
- `/:slug/settings/general` — workspace name
- `/:slug/settings/branding` — logo, color, theme (stored in WorkspaceSettings)
- `/:slug/settings/company` — company name, address, tax ID (stored in WorkspaceSettings)
- `/:slug/settings/billing` — subscription plan and history

### Account Routes (global, no slug)
- `/account` — profile (name, email, password)
- `/account/workspaces` — workspace switcher

### Client Portal Routes (separate subdomain)
- `/portal/login`
- `/portal/dashboard`
- `/portal/projects`
- `/portal/projects/:projectId`
- `/portal/projects/:projectId/tasks`
- `/portal/invoices`
- `/portal/invoices/:invoiceId`
- `/portal/profile`

---

## Folder Structure

```
flowdesk/
├── prisma/                        # Database schema, migrations, seed
├── public/                        # Static assets (favicon, images)
├── src/
│   ├── app/                       # Next.js App Router pages (route groups)
│   │   ├── (marketing)/           # Landing, pricing pages (no auth)
│   │   ├── (auth)/                # Login, signup, password reset (no sidebar)
│   │   ├── (workspace)/           # Authenticated app ([workspaceSlug]/*)
│   │   ├── (portal)/              # Client portal (separate subdomain)
│   │   └── api/                   # Auth.js handler, webhooks
│   ├── features/                  # Domain modules — one per feature
│   │   ├── auth/                  # Authentication forms, actions, schemas
│   │   ├── clients/               # Client CRM components, actions, queries
│   │   ├── projects/              # Project and task components, actions
│   │   ├── time-tracking/         # Timer, entries, approvals
│   │   ├── invoices/              # Invoice CRUD, PDF generation
│   │   ├── team/                  # Member management, invites
│   │   ├── settings/              # Workspace settings + WorkspaceSettings forms
│   │   ├── subscription/          # Subscription management, Stripe integration (v2)
│   │   ├── account/               # Profile, workspace switcher
│   │   └── portal/                # Client portal views
│   ├── components/                # Shared UI (shadcn/ui primitives, layout)
│   │   ├── ui/                    # Button, card, dialog, table, etc.
│   │   ├── layout/                # Sidebar, topbar, breadcrumbs
│   │   └── shared/                # DataTable, pagination, empty state
│   ├── lib/                       # Shared utilities
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # Auth.js configuration
│   │   ├── rbac.ts                # Role/permission helpers
│   │   ├── multi-tenant.ts        # Workspace scope enforcement
│   │   ├── email.ts               # Email sending
│   │   └── constants.ts           # Enums, status values
│   ├── hooks/                     # Client-side React hooks
│   └── types/                     # TypeScript types + Auth.js augmentations
└── middleware.ts                   # Subdomain routing, auth checks, scope
```

**Why each major folder exists:**
- `prisma/` — Single source of truth for the database. Migrations live here.
- `src/app/` — Next.js App Router owns URL structure and page composition. Thin — no business logic.
- `src/features/` — Domain logic lives here. Each feature is independent, importable by pages but never by other features.
- `src/components/` — Shared reusable UI. shadcn/ui primitives in `ui/`, app layout in `layout/`, common patterns in `shared/`.
- `src/lib/` — Infrastructure (Prisma, Auth.js, email). No business logic — shared by all features.
- `src/hooks/` — Client-side state and browser API wrappers.
- `src/types/` — Global TypeScript types and module augmentations.
- `middleware.ts` — Edge runtime. Handles auth checks, subdomain rewriting, and route protection before any page loads.

---

## Server Actions Overview

Every data mutation is a Server Action. Organized by feature module:

### Auth (`features/auth/_actions.ts`)
- `signup(email, password, name)` — create User + Workspace + WorkspaceMember (OWNER)
- `login(email, password)` — delegate to Auth.js
- `resetPassword(email)` — generate reset token, send email
- `acceptInvite(token, password, name)` — validate invite, create User + WorkspaceMember

### Clients (`features/clients/_actions.ts`)
- `createClient(data)` — validate, create Client record
- `updateClient(clientId, data)` — update fields
- `archiveClient(clientId)` — transition status to ARCHIVED
- `deleteClient(clientId)` — soft-delete (OWNER only)
- `invitePortalUser(clientId, email)` — create Invite with clientId

### Projects (`features/projects/_actions.ts`)
- `createProject(data)` — validate, create Project
- `updateProject(projectId, data)` — update fields
- `changeProjectStatus(projectId, status)` — transition
- `deleteProject(projectId)` — soft-delete (OWNER only)

### Tasks (`features/projects/_actions_tasks.ts`)
- `createTask(projectId, data)` — create Task with sortOrder
- `updateTask(taskId, data)` — update fields, assignee, status
- `reorderTasks(projectId, taskIds)` — batch update sortOrder
- `deleteTask(taskId)` — soft-delete

### Time Tracking (`features/time-tracking/_actions.ts`)
- `startTimer(projectId, taskId?)` — create TimeEntry with startTime, status DRAFT
- `stopTimer(entryId)` — set endTime, calculate durationMinutes
- `createTimeEntry(data)` — manual entry
- `updateTimeEntry(entryId, data)` — edit draft (OWNER can edit any)
- `deleteTimeEntry(entryId)` — soft-delete draft
- `submitTimeEntry(entryId)` — transition to SUBMITTED
- `approveTimeEntry(entryId)` — transition to APPROVED, set approvedBy (enforce no self-approval)
- `rejectTimeEntry(entryId, reason)` — transition to REJECTED

### Invoices (`features/invoices/_actions.ts`)
- `createInvoice(clientId, timeEntryIds)` — group unbilled entries, generate line items
- `updateInvoice(invoiceId, data)` — edit draft
- `sendInvoice(invoiceId)` — transition to SENT, notify client, write AuditLog
- `markInvoicePaid(invoiceId, paidAt)` — transition to PAID
- `voidInvoice(invoiceId)` — transition to CANCELED
- `deleteInvoice(invoiceId)` — soft-delete draft

### Team (`features/team/_actions.ts`)
- `inviteMember(workspaceId, email, role)` — create Invite
- `changeMemberRole(memberId, role)` — update role (OWNER only)
- `removeMember(memberId)` — soft-delete WorkspaceMember
- `transferOwnership(memberId)` — swap OWNER role

### Settings (`features/settings/_actions.ts`)
- `updateWorkspace(data)` — name
- `updateWorkspaceSettings(data)` — timezone, logo, primary color, company info, theme

### Account (`features/account/_actions.ts`)
- `updateProfile(data)` — name, email, avatar
- `changePassword(currentPassword, newPassword)` — validate + update hash

### Subscription (`features/subscription/_actions.ts`) [v2]
- `createCheckoutSession(plan)` — redirect to Stripe checkout
- `handleStripeWebhook(event)` — sync subscription status from Stripe
- `cancelSubscription()` — set cancelAtPeriodEnd
- `resumeSubscription()` — unset cancelAtPeriodEnd
- `getActiveSubscription()` — return current plan and status

### Portal (`features/portal/_actions.ts`)
- `updateClientProfile(data)` — name, email, password

---

## External Services

| Service | Purpose | Integration Point |
|---|---|---|
| **Auth.js** (NextAuth v5) | Authentication framework — credentials provider, Google OAuth, session management | `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `middleware.ts` |
| **PostgreSQL** | Primary database — all entity data | Prisma ORM, `prisma/schema.prisma`, `DATABASE_URL` env var |
| **Prisma** | Type-safe database access, migrations, seed | `src/lib/prisma.ts` (client singleton), `prisma/migrations/` |
| **AWS S3** | File storage for avatars, logos, invoice PDFs (future: file sharing) | Image/file upload server actions |
| **Resend** | Transactional email — invites, invoice delivery, password reset, notifications | `src/lib/email.ts` |
| **Stripe** | Payment processing — subscription billing, one-time invoice payments (v2) | Webhook endpoints in `src/app/api/` |
| **Recharts** | Dashboard charts — revenue trends, utilization graphs | React components within dashboard feature |

---

## Security Requirements

### Authentication
- Passwords hashed with bcrypt (via Auth.js)
- Google OAuth as secondary provider
- Session tokens managed by Auth.js (JWT or database sessions)
- Rate limiting on all public auth endpoints (login, signup, forgot-password, invite)
- Invite tokens are single-use, expire after 7 days, stored as hashed values

### Authorization
- Deny-by-default: every action requires explicit permission
- Role checks on every Server Action (via `src/lib/rbac.ts`)
- Role checks in workspace layout (for page-level access)
- Manager self-approval of timesheets explicitly prohibited
- Only OWNER can permanently delete entities
- No user can modify their own role

### Tenant Isolation
- Every entity has `workspaceId` (except Task and InvoiceLineItem, which reach it through their parent)
- Prisma middleware auto-injects `workspaceId` filter on all queries
- Postgres Row-Level Security policies planned as defense-in-depth
- Client portal scoped to a single Client record, not the workspace

### Validation
- Zod schemas validate all Server Action inputs
- Server-side validation only — client validation is convenience, not security
- Decimal/currency values validated for non-negative constraints
- Date ranges validated (dueDate >= issuedDate, endTime > startTime)

### File Upload Restrictions (Future)
- Allowed types: images (JPEG, PNG, WebP), PDFs
- Max file size: 10 MB
- Virus scanning on upload
- Files stored in S3 with pre-signed URLs, never served from application server
- All file access requires authenticated session

---

## MVP Scope

### MVP v1 — Core Operations

Target: Solo freelancers and small agencies (2–5 people). Focus on the essential loop: client → project → task → time → invoice.

- Email/password authentication + Google OAuth
- Workspace creation with unique slug and onboarding wizard
- Membership system: invite team members, assign roles (OWNER, MANAGER, TEAM_MEMBER)
- RBAC enforcement via WorkspaceMember
- Client CRM: create, edit, archive, status tracking (lead, active, inactive)
- Projects nested under clients with hourly rate
- Task management: create, assign, reorder (float sort), status tracking
- Time tracking: start/stop timer, manual entry, view logs
- Timesheet submission and approval workflow (self-approval prohibited)
- Invoice generation from unbilled time entries (OWNER only)
- Invoice lifecycle: draft → sent → paid → overdue → canceled
- Personal dashboard (tasks due, time today, unpaid invoices)
- Team management (invite, list, change role, remove)
- Workspace settings (general + branding via WorkspaceSettings)
- Account settings (profile, password)
- Soft-delete on all entities
- Audit logging for financial and permission actions

**Why v1 only:** Client portal, notifications, and analytics are valuable but not required to close the time-to-invoice loop. The core value proposition is replacing 4–6 separate tools with one — that works without a client portal. Portal is v1.5 because it requires ClientMember infrastructure and additional route protection.

### v1.5 — Client Engagement

Target: Enable client collaboration without requiring them to adopt a new tool.

- Client portal (separate subdomain): login, project views, invoice views, profile management
- Activity feed on dashboards (task completed, invoice sent, member joined)
- Email notifications (invites, invoice delivery, password reset)
- Workspace dashboard (revenue, utilization — OWNER/MANAGER)
- Basic reports (project profitability, team utilization)

**Why v1.5:** These features depend on v1 data (time entries generating invoices, tasks being completed). Portal access relies on ClientMember and Invite entities which are migrations on top of the core schema. Separating this prevents the MVP from being blocked by portal route architecture.

### v2 — Growth & Scale

Target: Monetization, integrations, and advanced workflows.

- Stripe payment processing (online invoice payments, auto-reconciliation, subscription billing)
- Proposals & estimates with e-signature
- Recurring invoices / retainer management
- File storage (S3) per project with client-accessible share
- Public API (Zapier / API keys via ApiKey entity)
- Expense tracking with receipt OCR
- Public booking page (clients book time slots)
- Team scheduling & time-off management
- Mobile app (iOS / Android)

**Why v2:** Stripe requires PCI compliance, webhook infrastructure, and subscription plan entities. File storage requires S3, presigned URLs, and virus scanning. The public API requires the ApiKey entity and rate limiting. These are independent systems that don't unlock the core time-to-invoice loop.

---

## Future Enhancements

### v1.5 — Client Engagement

1. **Client portal** — separate subdomain with login, project views, invoice views, profile management
2. **Activity feed** — in-app dashboard events (task completed, invoice sent, member joined)
3. **Email notifications** — invites, invoice delivery, password reset, approval requests
4. **Workspace dashboard** — revenue MTD, utilization %, overdue invoices
5. **Basic reports** — project profitability drilldown, team utilization per-member

### v2 — Growth & Scale

6. **Stripe integration** — online invoice payments, auto-reconciliation, subscription billing
7. **Proposals & estimates** — templated proposals with e-signature, convert to project on acceptance
8. **Recurring invoices** — retainer management, auto-generated monthly invoices
9. **File sharing** — per-project document storage with S3, client-accessible
10. **Public API** — ApiKey-based REST API for Zapier and third-party integrations
11. **Expense tracking** — receipt upload with OCR, expense categorization, billable toggle
12. **Public booking page** — clients book time slots on calendar, auto-creates tasks
13. **Team scheduling** — availability calendar, time-off management
14. **Mobile app** — iOS/Android for timer, task management, notifications

---

## Development Roadmap

### MVP v1 — Core Operations (Weeks 1–10)

#### Phase 1: Foundation (Weeks 1–3)
- Set up Next.js 15 project with App Router
- Prisma schema + initial migration + seed script
- Auth.js integration (credentials + Google OAuth)
- Middleware: subdomain detection, auth guards, workspace resolution
- Multi-tenant Prisma middleware (auto workspace_id injection)
- Shared UI components (shadcn/ui button, card, form, table, dialog)
- Layout components (sidebar, topbar, breadcrumbs)
- Create all v1 entities: Workspace, WorkspaceSettings, Subscription, User, WorkspaceMember, Client, ClientMember, Project, Task, TimeEntry, Invoice, InvoiceLineItem, Invite, AuditLog

#### Phase 2: Core Workspace (Weeks 4–6)
- Workspace creation + onboarding wizard
- Client CRM (list, create, edit, archive)
- Project CRUD
- Task CRUD with float-based reordering
- Time tracking (timer, manual entry, view logs)
- Timesheet submission and approval workflow
- Team management (invite, change role, remove, transfer ownership)

#### Phase 3: Invoicing & Settings (Weeks 7–8)
- Invoice generation from unbilled time entries
- Invoice lifecycle (send, pay, void, overdue)
- Invoice PDF generation
- Workspace settings (general, branding via WorkspaceSettings)
- Account settings (profile, password, workspace switcher)

#### Phase 4: Dashboard & Security (Weeks 9–10)
- Personal dashboard (tasks due, time today, unpaid invoices)
- Team management UI
- Audit logging for all sensitive actions
- Rate limiting on auth endpoints
- Invite token expiry and single-use enforcement
- Error boundaries and loading states
- Soft-delete purge job (data retention policy)

### v1.5 — Client Engagement (Weeks 11–14)
- Client portal (separate subdomain, ClientMember auth)
- Activity feed on dashboards
- Email notifications (invites, invoice delivery, password reset)
- Workspace dashboard (revenue, utilization — OWNER/MANAGER)
- Basic reports (project profitability, team utilization)

### v2 — Growth & Scale (Future)
- Stripe integration (payment processing, subscriptions)
- Proposals & estimates with e-signature
- Recurring invoices / retainer management
- File storage (S3) per project
- Public API (Zapier / API keys)
- Expense tracking with receipt OCR
- Public booking page
- Team scheduling & time-off management
- Mobile app (iOS / Android)

---

## Architecture Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | **Unified User table** instead of separate User + ClientUser | Eliminates dual auth systems, reduces attack surface, simplifies session management, enables a single password reset flow. Discriminated by `userType` enum. |
| 2 | **Feature-based architecture** instead of file-type-based | Each feature (clients, projects, invoices) owns its domain logic end-to-end. A new engineer can understand one feature without tracing imports across folders. Features never import from other features. |
| 3 | **Server Actions as the only mutation layer** instead of REST API | Eliminates the need for API route handlers, request serialization, and client-side fetch logic. Actions are RPC-style functions callable directly from forms and components. Type safety is automatic. |
| 4 | **Server components for data fetching** instead of client-side useEffect | Reduces client bundle size, eliminates waterfall requests, improves SEO and initial page load. React Server Components fetch data at request time on the server. |
| 5 | **App Router with route groups** for URL organization | `(auth)`, `(workspace)`, `(portal)` groups share layouts without affecting URL structure. Workspace routes are parameterized by `[workspaceSlug]`. |
| 6 | **Client portal in the same Next.js app** via middleware rewrite | Avoids maintaining a separate application with duplicate auth and database code. Middleware detects the `client.flowdesk.io` subdomain and rewrites to `/(portal)/*`. |
| 7 | **Float sort_order on tasks** instead of integer | Integer reordering requires N+1 updates per drag-and-drop. Float allows inserting between neighbors by averaging their sort values — 1–2 updates per reorder. |
| 8 | **Soft-delete on all entities** with `deletedAt` | Prevents catastrophic data loss from accidental deletion. Enables recovery window, audit trails, and deferred cleanup. Financial data is never hard-deleted. |
| 9 | **Restrict delete on financial relationships** (Project→TimeEntry, Client→Invoice) | Prevents orphaned financial records. Cascade delete on Project→Task is safe (tasks have no financial value independently), but time entries and invoices must survive parent deletion. |
| 10 | **Composite indexes on (workspaceId, status) and (workspaceId, date)** | Every filtered list query in the app filters by workspace + status or workspace + date range. These indexes make the most common queries efficient without over-indexing. |
| 11 | **AuditLog and Activity as separate entities** | AuditLog is immutable, long-lived, and used for compliance. Activity is transient, user-facing, and appears on dashboards. Different retention policies, access patterns, and data shapes. |
| 12 | **No barrel exports** (`index.ts` files) | Barrel files create circular dependency risks and hide dependency graphs. Explicit imports (`import { createClient } from '@/features/clients/_actions'`) make dependencies visible and tree-shaking reliable. |
| 13 | **Subscription as separate entity** instead of fields on Workspace | Enables subscription history, multiple plans, Stripe integration readiness. A workspace can have many subscriptions over time; the latest active one determines current plan. |
| 14 | **WorkspaceSettings as separate entity** (1:1 with Workspace) | Separates operational identity (name, slug) from configuration (branding, timezone, company info). Configuration can be extended with new fields without touching the Workspace table. Enables different caching strategies — Workspace is hot-path for every request, settings are infrequently accessed. |
| 15 | **Reduced MVP scope** (three-phase release) | Delivers the core time-to-invoice loop faster. Client portal and analytics are v1.5 because they depend on v1 data but don't block invoice creation. Stripe and integrations are v2 because they require separate infrastructure (PCI compliance, API keys, webhooks). |
