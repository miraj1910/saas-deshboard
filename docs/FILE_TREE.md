# FlowDesk — Next.js 15 File Tree

Architecture choices:

| Decision | Choice |
|---|---|
| Routing | App Router with route groups |
| Feature isolation | Colocated modules under `src/features/` |
| Data layer | Prisma client in `src/lib/` |
| Auth | Auth.js (NextAuth v5) with credentials + Google providers |
| Server Actions | Per-feature `_actions.ts` files |
| Validation | Zod schemas per feature |
| Styling | Tailwind CSS + shadcn/ui components |
| Client portal | Same app, middleware rewrites by subdomain |

---

## Top-Level Structure

```
flowdesk/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── app/
│   ├── features/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── types/
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env
├── .env.example
└── .gitignore
```

---

## App Directory — Route Groups

```
src/app/
├── (marketing)/                  # Public landing pages
│   ├── page.tsx                  # Landing / home
│   ├── layout.tsx                # Marketing layout (no sidebar)
│   └── pricing/
│       └── page.tsx
│
├── (auth)/                       # Auth flow — no workspace context
│   ├── layout.tsx                # Centered card layout
│   ├── login/
│   │   ├── page.tsx
│   │   └── login-form.tsx
│   ├── signup/
│   │   ├── page.tsx
│   │   └── signup-form.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   ├── reset-password/
│   │   └── [token]/
│   │       └── page.tsx
│   └── invite/
│       └── [token]/
│           └── page.tsx
│
├── (workspace)/                  # Authenticated workspace routes
│   ├── layout.tsx                # Workspace layout — sidebar, topbar, breadcrumbs
│   ├── [workspaceSlug]/
│   │   ├── layout.tsx            # Loads workspace data, resolves role
│   │   ├── page.tsx              # Redirect to /dashboard
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── reports/
│   │   │       ├── page.tsx
│   │   │       └── profitability/
│   │   │           └── [projectId]/
│   │   │               └── page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [clientId]/
│   │   │       ├── page.tsx
│   │   │       ├── edit/
│   │   │       │   └── page.tsx
│   │   │       └── portal/
│   │   │           └── invite/
│   │   │               └── page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx
│   │   │       ├── edit/
│   │   │       │   └── page.tsx
│   │   │       └── tasks/
│   │   │           ├── page.tsx
│   │   │           ├── new/
│   │   │           │   └── page.tsx
│   │   │           └── [taskId]/
│   │   │               ├── page.tsx
│   │   │               ├── edit/
│   │   │               │   └── page.tsx
│   │   │               └── delete/
│   │   │                   └── page.tsx (or use action)
│   │   ├── time/
│   │   │   ├── page.tsx
│   │   │   ├── entries/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [entryId]/
│   │   │   │       ├── edit/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── submit/
│   │   │   │           └── page.tsx
│   │   │   └── approvals/
│   │   │       ├── page.tsx
│   │   │       └── [entryId]/
│   │   │           └── page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [invoiceId]/
│   │   │       ├── page.tsx
│   │   │       ├── edit/
│   │   │       │   └── page.tsx
│   │   │       └── pdf/
│   │   │           └── route.ts          # PDF download route
│   │   ├── team/
│   │   │   ├── page.tsx
│   │   │   ├── invite/
│   │   │   │   └── page.tsx
│   │   │   └── [memberId]/
│   │   │       └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── general/
│   │       │   └── page.tsx
│   │       ├── branding/
│   │       │   └── page.tsx
│   │       └── billing/
│   │           └── page.tsx
│   │
│   └── account/                   # Global (non-workspace) user routes
│       ├── page.tsx               # Profile settings
│       └── workspaces/
│           └── page.tsx
│
├── (portal)/                      # Client portal — subdomain routed via middleware
│   ├── layout.tsx                 # Portal layout — minimal header, no sidebar
│   ├── login/
│   │   ├── page.tsx
│   │   └── login-form.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   └── [projectId]/
│   │       ├── page.tsx
│   │       └── tasks/
│   │           └── page.tsx
│   ├── invoices/
│   │   ├── page.tsx
│   │   └── [invoiceId]/
│   │       └── page.tsx
│   └── profile/
│       └── page.tsx
│
├── api/                           # API routes (webhooks, external integrations)
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts           # Auth.js handler
│
└── error.tsx                      # Global error boundary
    layout.tsx                     # Root layout (fonts, providers)
    not-found.tsx                  # 404 page
```

---

## Feature Modules

Each feature encapsulates its domain logic independently. Features are imported by pages but never by each other (no cross-feature coupling).

```
src/features/
├── auth/
│   ├── components/
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   ├── forgot-password-form.tsx
│   │   ├── reset-password-form.tsx
│   │   └── oauth-buttons.tsx
│   ├── _actions.ts               # signup, login, resetPassword, acceptInvite
│   ├── _schemas.ts               # Zod: loginSchema, signupSchema, etc.
│   ├── _utils.ts                  # Password hashing, token generation
│   └── _types.ts                  # Session types, provider types
│
├── clients/
│   ├── components/
│   │   ├── client-list.tsx
│   │   ├── client-card.tsx
│   │   ├── client-form.tsx
│   │   ├── client-detail.tsx
│   │   ├── client-status-badge.tsx
│   │   └── portal-invite-button.tsx
│   ├── _actions.ts               # createClient, updateClient, archiveClient, deleteClient, invitePortalUser
│   ├── _schemas.ts               # Zod: createClientSchema, updateClientSchema
│   ├── _queries.ts               # getClients, getClientById (server-only fetches)
│   └── _types.ts
│
├── projects/
│   ├── components/
│   │   ├── project-list.tsx
│   │   ├── project-card.tsx
│   │   ├── project-form.tsx
│   │   ├── project-detail.tsx
│   │   ├── project-status-badge.tsx
│   │   └── task-list.tsx
│   │   └── task-form.tsx
│   │   └── task-card.tsx
│   ├── _actions.ts               # createProject, updateProject, deleteProject, changeStatus
│   ├── _actions_tasks.ts         # createTask, updateTask, deleteTask, assignTask
│   ├── _schemas.ts               # Zod: createProjectSchema, createTaskSchema
│   ├── _queries.ts               # getProjects, getProjectById, getTasks
│   └── _types.ts
│
├── time-tracking/
│   ├── components/
│   │   ├── timer.tsx             # Start/stop timer with live duration
│   │   ├── time-entry-list.tsx
│   │   ├── time-entry-form.tsx
│   │   ├── timesheet-table.tsx
│   │   ├── approval-queue.tsx
│   │   └── approval-actions.tsx
│   ├── _actions.ts               # startTimer, stopTimer, createEntry, updateEntry, deleteEntry, submitEntry, approveEntry, rejectEntry
│   ├── _schemas.ts               # Zod: timeEntrySchema, approvalSchema
│   ├── _queries.ts               # getTimeEntries, getPendingApprovals, getRunningTimer
│   ├── _hooks.ts                 # useTimer (client-side interval)
│   └── _types.ts
│
├── invoices/
│   ├── components/
│   │   ├── invoice-list.tsx
│   │   ├── invoice-card.tsx
│   │   ├── invoice-form.tsx      # Select unbilled entries, generate line items
│   │   ├── invoice-detail.tsx
│   │   ├── invoice-status-badge.tsx
│   │   └── invoice-pdf.tsx
│   ├── _actions.ts               # createInvoice, updateInvoice, sendInvoice, markPaid, voidInvoice, deleteInvoice
│   ├── _schemas.ts               # Zod: createInvoiceSchema
│   ├── _queries.ts               # getInvoices, getInvoiceById, getUnbilledEntries
│   └── _types.ts
│
├── team/
│   ├── components/
│   │   ├── member-list.tsx
│   │   ├── member-row.tsx
│   │   ├── invite-form.tsx
│   │   └── role-select.tsx
│   ├── _actions.ts               # inviteMember, changeRole, removeMember, transferOwnership
│   ├── _schemas.ts
│   ├── _queries.ts               # getMembers, getMemberById
│   └── _types.ts
│
├── settings/
│   ├── components/
│   │   ├── general-settings-form.tsx
│   │   ├── branding-form.tsx
│   │   └── billing-overview.tsx
│   ├── _actions.ts               # updateWorkspace, updateBranding
│   ├── _schemas.ts
│   └── _types.ts
│
├── account/
│   ├── components/
│   │   ├── profile-form.tsx
│   │   └── workspace-switcher.tsx
│   ├── _actions.ts               # updateProfile, changePassword
│   ├── _schemas.ts
│   └── _types.ts
│
└── portal/                       # Client portal features (read-only views)
    ├── components/
    │   ├── portal-layout.tsx
    │   ├── client-dashboard.tsx
    │   ├── client-project-list.tsx
    │   ├── client-project-detail.tsx
    │   ├── client-invoice-list.tsx
    │   ├── client-invoice-detail.tsx
    │   └── client-profile-form.tsx
    ├── _actions.ts               # updateClientProfile
    ├── _schemas.ts
    ├── _queries.ts               # getClientProjects, getClientInvoices
    └── _types.ts
```

---

## Shared Libraries

```
src/lib/
├── prisma.ts                     # Prisma client singleton
├── auth.ts                       # Auth.js configuration (providers, callbacks, adapter)
├── auth.config.ts                # Auth.js edge-compatible config (middleware)
├── rbac.ts                       # Role-based access check helpers
├── multi-tenant.ts               # Workspace resolution, scope enforcement
├── email.ts                      # Email sending (invites, invoices, password reset)
├── utils.ts                      # Formatting, date helpers, slug generation
├── constants.ts                  # Enums, status values, role strings
└── logger.ts                     # Structured logging

src/components/
├── ui/                           # shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── toast.tsx
│   ├── badge.tsx
│   ├── avatar.tsx
│   ├── skeleton.tsx
│   └── ...
├── layout/
│   ├── sidebar.tsx
│   ├── topbar.tsx
│   ├── breadcrumbs.tsx
│   ├── workspace-switcher.tsx
│   ├── user-menu.tsx
│   └── mobile-nav.tsx
├── shared/
│   ├── data-table.tsx
│   ├── pagination.tsx
│   ├── empty-state.tsx
│   ├── confirm-dialog.tsx
│   ├── loading-spinner.tsx
│   └── error-fallback.tsx
└── providers.tsx                  # Client providers (SessionProvider, ThemeProvider, Toaster)

src/hooks/
├── use-workspace.ts              # Current workspace context
├── use-current-user.ts           # Current user + role in workspace
├── use-timer.ts                  # Timer start/stop/elapsed state
├── use-media-query.ts
└── use-debounce.ts

src/types/
├── index.ts                      # Shared TypeScript types
└── next-auth.d.ts                # Auth.js type augmentations (role, workspaceId)
```

---

## Middleware

```
middleware.ts                     # Handles:
                                  #   1. Subdomain detection → rewrite to (portal) route group
                                  #   2. Auth check → redirect to /login if unauthenticated
                                  #   3. Workspace slug resolution → 404 if slug invalid
                                  #   4. Role-based route access → 403 if role insufficient
```

---

## Key Architecture Rules

| Rule | Rationale |
|---|---|
| Pages never contain business logic | Pages compose components, call actions, and pass data. Logic lives in `_actions.ts` / `_queries.ts`. |
| Feature modules are independent | `features/clients` never imports from `features/invoices`. Shared contracts live in `lib/` or `types/`. |
| Server Actions are the mutation layer | Every data write is a Server Action in the owning feature. No REST endpoints except Auth.js and webhooks. |
| Queries are server components | Data fetching uses async server components with `_queries.ts` helpers. No `useEffect` for initial load. |
| Role checks happen in actions + layout | The workspace layout resolves the user's role. Server Actions re-verify permissions before mutating. |
| Client portal is the same Next.js app | A middleware rewrites `client.flowdesk.io/*` to `/(portal)/*`, keeping auth and DB in one codebase. |
| No barrel exports | Feature modules are imported explicitly: `import { createClient } from '@/features/clients/_actions'`. |
| `_` prefix for non-route files in app dir | Prevents Next.js from treating helpers as routes (e.g., `_actions.ts`, `_utils.ts`, `_queries.ts`). |
