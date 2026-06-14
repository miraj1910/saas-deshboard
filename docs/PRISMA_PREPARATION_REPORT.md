# FlowDesk — Prisma Preparation Report

**Date:** 2026-06-10
**Scope:** Review of architecture corrections (Fixes 1–5) and database readiness assessment.

---

## Fix 1: Role Standardization — Applied

**Change:** `ADMIN` → `OWNER`, `MEMBER` → `TEAM_MEMBER` across all documentation.

### Files Updated
| File | Changes |
|---|---|
| `docs/PRD.md` | Role definitions updated throughout |
| `docs/USER_FLOWS.md` | Journey narratives updated — Owner, Manager, Team Member, Client |
| `docs/DATABASE.md` | CHECK constraint values updated in entity tables |
| `docs/PERMISSIONS.md` | Matrix headers and boundary diagram updated |
| `docs/PROJECT_CONTEXT.md` | Role tables, permissions matrix, route guard descriptions updated |

### Gap: schema.prisma not yet updated

The `WorkspaceRole` enum at `prisma/schema.prisma:19-23` still uses the old values:

```prisma
enum WorkspaceRole {
  ADMIN
  MANAGER
  MEMBER
}
```

The `Invite` model (line 366) also references `WorkspaceRole`. Both require migration.

**Required action before first migration:**
```prisma
enum WorkspaceRole {
  OWNER
  MANAGER
  TEAM_MEMBER
}
```

---

## Fix 2: Subscription Entity — Applied

**Change:** Extracted subscription data from Workspace into a standalone `Subscription` entity.

### Design (documented in PROJECT_CONTEXT.md)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `workspaceId` | UUID | FK → Workspace |
| `stripeSubscriptionId` | String? | Stripe reference (v2) |
| `stripeCustomerId` | String? | Stripe reference (v2) |
| `plan` | Plan enum | `FREE │ PRO │ AGENCY` |
| `status` | SubscriptionStatus enum | `TRIALING │ ACTIVE │ PAST_DUE │ CANCELED │ EXPIRED` |
| `currentPeriodStart` | DateTime | |
| `currentPeriodEnd` | DateTime | |
| `trialEndsAt` | DateTime? | |
| `cancelAtPeriodEnd` | Boolean | Default false |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Relationship:** Workspace → Subscription: one-to-many. Only one active subscription per workspace at a time (application-level enforcement).

### Gap: Not in schema.prisma

No `Subscription` model exists. The old `SubscriptionStatus` enum uses:
```prisma
enum SubscriptionStatus {
  TRIAL       // → should be TRIALING
  ACTIVE
  PAST_DUE
  CANCELED    // → need EXPIRED
}
```

**Required action:** Add `Plan` enum, update `SubscriptionStatus` enum, create `Subscription` model.

---

## Fix 3: WorkspaceSettings Separation — Applied

**Change:** Split operational identity (Workspace: name, slug) from configuration (WorkspaceSettings: branding, timezone, company info).

### Design (documented in PROJECT_CONTEXT.md)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `workspaceId` | UUID | FK → Workspace, unique |
| `logoUrl` | String? | Moved from Workspace |
| `primaryColor` | String? | Moved from Workspace |
| `timezone` | String | Default "UTC" |
| `companyName` | String? | Legal business name |
| `companyAddress` | String? | |
| `companyTaxId` | String? | VAT / EIN |
| `theme` | Json? | Theme preferences |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Relationship:** Workspace → WorkspaceSettings: one-to-one (cascade delete).

### Gap: schema.prisma still has old fields on Workspace

```prisma
model Workspace {
  logoUrl            String?
  primaryColor       String?
  subscriptionStatus SubscriptionStatus @default(TRIAL)
  trialEndsAt        DateTime?
```

**Required action:** Remove `logoUrl`, `primaryColor`, `subscriptionStatus`, `trialEndsAt` from `Workspace`. Create `WorkspaceSettings` model.

---

## Fix 4: MVP Scope Reduction — Applied

**Change:** Restructured from a single monolithic MVP into three phases.

### v1 — Core Operations (Weeks 1–10)

Client → Project → Task → Time → Invoice loop. No portal, no notifications, no analytics.

**Included entities:** Workspace, WorkspaceSettings, User, WorkspaceMember, Client, ClientMember, Project, Task, TimeEntry, Invoice, InvoiceLineItem, Invite, AuditLog

**Explicitly excluded:**
- Client portal, activity feed, email notifications
- Workspace dashboard (revenue, utilization)
- Stripe / payment processing
- Proposals, expense tracking, file storage
- Public API, mobile app

### v1.5 — Client Engagement (Weeks 11–14)

Portal, activity feed, notifications, workspace dashboard, basic reports. Depends on v1 data.

### v2 — Growth & Scale (Future)

Stripe, proposals, recurring invoices, file storage, API, expenses, booking, mobile. Requires separate infrastructure (PCI compliance, S3, API keys, webhooks).

---

## Fix 5: Database Readiness Review

### 5.1 Schema Gaps — Must Fix Before Migration

| # | Issue | Location | Severity | Action |
|---|---|---|---|---|
| 5.1.1 | `WorkspaceRole` enum uses `ADMIN, MEMBER` | `schema.prisma:19-23` | 🔴 Critical | Rename to `OWNER, MANAGER, TEAM_MEMBER` |
| 5.1.2 | No `Subscription` model | `schema.prisma` | 🔴 Critical | Add model with Plan enum, updated SubscriptionStatus enum |
| 5.1.3 | No `WorkspaceSettings` model | `schema.prisma` | 🔴 Critical | Add model, remove branding fields from Workspace |
| 5.1.4 | `SubscriptionStatus` enum missing `TRIALING`, `EXPIRED` | `schema.prisma:25-30` | 🟡 Major | Add both values, deprecate `TRIAL` |
| 5.1.5 | Workspace has `logoUrl`, `primaryColor`, `subscriptionStatus`, `trialEndsAt` inline | `schema.prisma:81-84` | 🟡 Major | Extract to WorkspaceSettings and Subscription |
| 5.1.6 | `Invite` references old `WorkspaceRole` | `schema.prisma:366` | 🟡 Major | Will auto-update when enum is renamed |
| 5.1.7 | No `@@index([workspaceId, userId])` on `ClientMember` | `schema.prisma:203-206` | 🔵 Minor | Add for consistent lookup pattern |

### 5.2 Schema Correct — Already Addressed

| Feature | Status | Notes |
|---|---|---|
| Unified User (`userType` discriminator) | ✅ | `schema.prisma:109-134` — replaces old dual-table pattern |
| Soft-delete (`deletedAt` on all entities) | ✅ | Present on all main entities |
| Float sort_order on Task | ✅ | `schema.prisma:251` — O(1) reordering |
| Restrict delete on financial relationships | ✅ | `project → timeEntry`, `client → invoice` |
| Cascade delete on safe relationships | ✅ | `workspace → member`, `project → task` |
| AuditLog entity | ✅ | `schema.prisma:391-410` |
| Activity entity | ✅ | `schema.prisma:416-434` |
| Invite entity | ✅ | `schema.prisma:362-385` |
| ApiKey entity (future) | ✅ | `schema.prisma:440-458` |
| Composite indexes on (workspaceId, status) and (workspaceId, date) | ✅ | Present on TimeEntry, Invoice, Client, Project |
| Indexes on all FK columns | ✅ | Present on all models |

### 5.3 DATABASE.md — Outdated, Needs Rewrite

The current `docs/DATABASE.md` was written before the ARCHITECTURE_REVIEW fixes. Specific issues:

| Issue | Detail |
|---|---|
| Separate `User` + `ClientUser` tables | DATABASE.md still describes dual auth — schema.prisma already uses unified `User` with `userType` |
| Old role values | ER diagram shows `admin\|manager\|member` — should be `owner\|manager\|team_member` |
| No `ClientMember` | DATABASE.md has `ClientUser` instead of `ClientMember` |
| Missing entities | No `WorkspaceSettings`, `Subscription`, `Invite`, `AuditLog`, `Activity`, `ApiKey` |
| No soft-delete | No `deleted_at` on any entity |
| No `userType` | User entity missing the discriminator field |
| No indexes | Zero indexes documented despite schema.prisma having them |
| Cascade delete on financial data | Describes cascade on Client→Project, Client→Invoice — schema.prisma correctly uses Restrict |

**Recommendation:** Rewrite DATABASE.md to match the current schema.prisma after Fixes 1–3 are applied. Use the schema.prisma file as the single source of truth.

### 5.4 Outstanding Design Decisions

| # | Question | Options | Recommendation |
|---|---|---|---|
| 1 | Invoice number generation | Application-level counter vs. DB sequence | Pre-generate with format `{slug}-{YYYYMM}-{sequential}` using a counter row in DB to avoid gaps from failed transactions |
| 2 | TimeEntry pagination | Offset vs. cursor | Use cursor-based on `(workspaceId, startTime, id)` composite — avoids offset drift from new entries |
| 3 | Data retention policy | Hard-delete after N days | Soft-delete + cron job purging records older than 90 days (or workspace-level setting) |
| 4 | Slug changes | Allow or forbid | Allow with 301 redirect from old slug — requires `slug` to be mutable with uniqueness check |
| 5 | Invite email delivery | Sync vs. async | Async (job queue) — invite acceptance is not time-sensitive, avoids blocking the response |

### 5.5 Migration Strategy

1. **Rename `WorkspaceRole` enum** — Prisma handles this as an ALTER TYPE IF the old values map 1:1. `ADMIN → OWNER`, `MEMBER → TEAM_MEMBER`.
2. **Add `WorkspaceSettings` model + `Subscription` model** — new tables, no migration of existing data.
3. **Drop fields from `Workspace`** — only after confirming no code references `logoUrl`, `primaryColor`, `subscriptionStatus`, `trialEndsAt` on Workspace.
4. **Update `SubscriptionStatus`** — add `TRIALING` and `EXPIRED` as new enum values.
5. **Generate initial migration** — squash into a single migration for clean history.

---

## Summary: Migration-Ready Checklist

| Criterion | Status | Notes |
|---|---|---|
| Role enum standardized | ❌ | `schema.prisma:19-23` needs rename |
| Subscription entity | ❌ | Not in schema.prisma yet |
| WorkspaceSettings entity | ❌ | Not in schema.prisma yet |
| Workspace fields cleaned | ❌ | Old fields still on model |
| Unified User (userType) | ✅ | |
| Soft-delete on all entities | ✅ | |
| Float sort_order on tasks | ✅ | |
| Restrict delete on financial FK | ✅ | |
| AuditLog, Activity, Invite, ApiKey | ✅ | |
| Multi-tenant workspace_id on entities | ✅ | |
| Composite indexes on hot paths | ✅ | |
| DATABASE.md in sync | ❌ | Outdated — needs rewrite |
| Migration squashed (single initial) | Pending | Before first `prisma migrate dev` |

---

## Recommended Execution Order

1. Update `schema.prisma` — rename enum, add models, remove old fields
2. Run `prisma migrate dev --name init` to generate initial migration
3. Update `docs/DATABASE.md` to match the final schema
4. Generate seed script with test data for all entities
5. Begin Phase 1 implementation (Foundation)
