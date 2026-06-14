# FlowDesk — Schema Gap Resolution

**Goal:** Reach 100% schema readiness before the first Prisma migration. Each gap is analyzed for root cause, impact, and resolution path.

---

## Gap 5.1.1 — WorkspaceRole Enum Uses `ADMIN` / `MEMBER`

### Problem
The `WorkspaceRole` enum in `schema.prisma` defines three values: `ADMIN`, `MANAGER`, `MEMBER`. Every documentation file — `PRD.md`, `PERMISSIONS.md`, `PROJECT_CONTEXT.md`, `USER_FLOWS.md` — uses the standardized roles `OWNER`, `MANAGER`, `TEAM_MEMBER`. The schema is out of sync with the source of truth.

The `Invite` model references the same enum, so the mismatch propagates into the invitation system.

### Why It Matters
- At migration time, Prisma will generate an `ALTER TYPE "WorkspaceRole" ADD VALUE ...` migration. Adding new values is additive and safe; renaming existing values requires a migration strategy (rename column, add new enum, drop old). If we migrate with `ADMIN`/`MEMBER` values in the database, every query in the application will need to translate between old enum values in the DB and new role names in the code, or we accept a permanent mismatch between code and docs.
- New engineers onboarding from `PROJECT_CONTEXT.md` will write queries against `OWNER`/`TEAM_MEMBER` that silently fail because the enum comparison against DB values of `ADMIN`/`MEMBER` never matches.
- The RBAC middleware (`src/lib/rbac.ts`) will need translation maps for the lifetime of the database if we do not fix this now.

### Recommended Solution
Rename the enum values before the first migration. Strategy:
1. Update the Prisma enum definition to the new values (`OWNER`, `MANAGER`, `TEAM_MEMBER`).
2. Do not add new columns or tables — this is a straight rename of enum labels.
3. Because no database exists yet, there is zero data migration cost. The first `prisma migrate dev --name init` creates the schema with the correct values from day one.

### Impact on Database
- **Before migration:** No database exists (fresh project).
- **Migration output:** The `WorkspaceRole` enum in Postgres will have values `'OWNER'`, `'MANAGER'`, `'TEAM_MEMBER'`.
- **Zero risk:** No data to convert, no rollback scenario.

### Impact on Application Architecture
- Every existing reference to `WorkspaceRole.ADMIN` in the codebase will break at compile time (TypeScript). This is desirable — the compiler surfaces every location that needs updating.
- The RBAC middleware (`src/lib/rbac.ts`), route guards, and Server Action permission checks all compare against this enum. After the rename, all comparisons use `OWNER` and `TEAM_MEMBER` directly, with no translation layer needed.
- The `Invite` model's role field automatically follows the enum rename — no separate migration step needed for it (see Gap 5.1.6).

---

## Gap 5.1.2 — No Subscription Model

### Problem
The `schema.prisma` has no `Subscription` entity. Subscription data — plan, status, trial — is currently embedded as scalar fields on the `Workspace` model (`subscriptionStatus`, `trialEndsAt`). The `SubscriptionStatus` enum exists but is only used by those Workspace fields.

`PROJECT_CONTEXT.md` defines a full `Subscription` entity with plan, status, Stripe integration fields, period tracking, and subscription history. The schema does not match.

### Why It Matters
- A SaaS application without a subscription table cannot track billing history, support Stripe webhooks, or enforce plan-based feature gating at the database level.
- Embedding subscription data on Workspace means a workspace can never have more than one subscription record. If a workspace downgrades and later upgrades, the historical record of the downgrade is lost. For a billing dispute, there is no audit trail of what plan was active when.
- Stripe integration requires storing `stripeSubscriptionId`, `stripeCustomerId`, and `cancelAtPeriodEnd`. Adding these fields later is an ALTER TABLE migration on a hot table — risk of lock contention on the Workspace row.
- The v2 roadmap includes Stripe. Building the schema without Subscription means a future schema migration to add it, which could require backfilling data for existing workspaces.

### Recommended Solution
Add a `Subscription` model as a child of `Workspace` (one-to-many). Key design decisions:
- A workspace has many subscriptions over time; the latest non-canceled one is the active plan.
- Stripe fields (`stripeSubscriptionId`, `stripeCustomerId`) are nullable — populated only when Stripe integration is live (v2).
- `SubscriptionStatus` enum values must include `EXPIRED` for grace-period enforcement and `TRIALING` for trial-state queries (see Gap 5.1.4).
- Remove `subscriptionStatus` and `trialEndsAt` from Workspace (see Gap 5.1.5).

### Impact on Database
- New table: `Subscription` with FK to `Workspace(id)`.
- Fields: plan, status, period start/end, trial end, cancel-at-period-end flag, Stripe IDs, timestamps.
- Index on `(workspaceId, status)` for active-subscription lookup.
- Index on `(workspaceId, currentPeriodEnd)` for upcoming-expiry queries.
- The old `subscriptionStatus` column on Workspace becomes unused data if not removed. Removing it is recommended (see Gap 5.1.5).

### Impact on Application Architecture
- Every query that checks subscription status must join or subquery against the Subscription table instead of reading a single column on Workspace. This is a moderate refactor of the subscription lookup path.
- A helper function `getActiveSubscription(workspaceId)` should centralize this logic — used by Server Actions, middleware (plan enforcement), and dashboard queries.
- The `Workspace` Prisma model no longer carries `subscriptionStatus` directly. Any frontend code referencing `workspace.subscriptionStatus` must be updated.
- Stripe webhook handlers in v2 will upsert Subscription rows rather than updating a field on Workspace — cleaner separation of concerns.
- Feature gating moves from `if (workspace.subscriptionStatus === 'ACTIVE')` to `if (getActiveSubscription(workspaceId)?.plan === 'PRO')`.

---

## Gap 5.1.3 — No WorkspaceSettings Model

### Problem
The `schema.prisma` has no `WorkspaceSettings` entity. Branding fields (`logoUrl`, `primaryColor`) live directly on the `Workspace` model alongside the core tenant identity (`name`, `slug`).

`PROJECT_CONTEXT.md` defines `WorkspaceSettings` as a 1:1 extension of Workspace holding branding, timezone, company info, and theme preferences.

### Why It Matters
- The `Workspace` model is in the hot path of every authenticated request. The middleware reads `workspace.slug` to resolve the tenant. Adding branding/company fields to the same row means every tenant resolution query fetches large, infrequently accessed data (logo URL strings, JSON theme objects) even when only the slug is needed.
- Branding and company information have different update frequency and validation rules than workspace identity. A brand color has a hex-format constraint; a tax ID has a country-specific format. Mixing validation concerns into a single model creates a god object.
- Caching strategy differs: Workspace identity (slug, name) is read on every request and should be aggressively cached. WorkspaceSettings (logo, theme) is read only on page load and can have a longer TTL. Same table means same cache policy.
- Adding new settings fields (e.g., `invoiceFooter`, `emailSignature`, `defaultHourlyRate`) requires adding nullable columns to the Workspace table, which already has high write contention from time-entry creation.

### Recommended Solution
Extract a `WorkspaceSettings` model with a 1:1 relationship to Workspace. Key decisions:
- Enforce 1:1 via a unique constraint on `workspaceId`.
- `logoUrl`, `primaryColor` move from Workspace to WorkspaceSettings.
- Add fields for timezone, company name, company address, company tax ID, and a JSON theme object.
- Cascade delete on workspace deletion — settings are meaningless without the workspace.
- Remove `logoUrl`, `primaryColor` from Workspace (see Gap 5.1.5).

### Impact on Database
- New table: `WorkspaceSettings` with FK to `Workspace(id)`, unique constraint on `workspaceId`.
- New nullable text/JSON columns for company info and theme.
- Workspace table loses two nullable columns (`logoUrl`, `primaryColor`).
- Index: unique index on `workspaceId` (already enforced by the unique constraint).

### Impact on Application Architecture
- The workspace lookup in middleware (`middleware.ts`) becomes faster — it only fetches `{ slug, name, id }` instead of the full Workspace row.
- Settings page components (`/:slug/settings/branding`, `/:slug/settings/company`) interact with `WorkspaceSettings` instead of `Workspace`.
- Update pattern changes from `updateWorkspace({ logoUrl, name })` to separate mutations: `updateWorkspace({ name })` for identity and `updateWorkspaceSettings({ logoUrl, timezone })` for configuration.
- Any existing code referencing `workspace.logoUrl` or `workspace.primaryColor` must be updated to `workspace.settings.logoUrl`.
- Seed scripts must create a `WorkspaceSettings` row alongside every `Workspace` row.

---

## Gap 5.1.4 — SubscriptionStatus Enum Missing `TRIALING` and `EXPIRED`

### Problem
The `SubscriptionStatus` enum in `schema.prisma` defines:
```prisma
enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELED
}
```
`PROJECT_CONTEXT.md` defines the canonical values as: `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELED`, `EXPIRED`.

Two mismatches: `TRIAL` vs `TRIALING` (naming inconsistency with Stripe), and missing `EXPIRED`.

### Why It Matters
- Stripe's subscription object uses `trialing` (present participle), not `trial` (noun). Mapping Stripe webhook payloads requires a translation layer between Stripe statuses and our enum. Using `TRIALING` matches Stripe's convention directly, eliminating one source of bugs when handling `customer.subscription.updated` events.
- Without `EXPIRED`, there is no way to represent a subscription that has completed its lifecycle without being explicitly canceled. A trial that ends without conversion, or a paid subscription that reaches its period end without renewal, has no valid state. Using `CANCELED` for both user-initiated cancellation and expiration means the database cannot distinguish between "user chose to leave" and "trial ran out" — two very different business signals.
- Feature gating for expired subscriptions should differ from canceled ones. An expired subscription might trigger a grace-period UI ("your trial ended — upgrade to continue"). A canceled subscription might trigger a retention offer. Without the enum value, both scenarios collapse into the same code path.

### Recommended Solution
1. Rename `TRIAL` to `TRIALING` (align with Stripe convention).
2. Add `EXPIRED` for end-of-lifecycle subscriptions.
3. Keep `CANCELED` for user-initiated cancellations.

These changes map 1:1 to Stripe's [`SubscriptionStatus`](https://stripe.com/docs/api/subscriptions/object#subscription_object-status) values: `trialing`, `active`, `past_due`, `canceled`, and we add `expired` for our internal lifecycle management.

### Impact on Database
- No new table. Pure enum value addition and rename.
- If a database already existed, renaming `TRIAL` to `TRIALING` would require an ALTER TYPE migration (add new value, update rows, drop old). Since no database exists yet, both changes are zero-cost.
- Any row (in the future) with status `EXPIRED` vs `CANCELED` carries clear business intent.

### Impact on Application Architecture
- Any code checking `WorkspaceSubscriptionStatus.TRIAL` must be updated to `SubscriptionStatus.TRIALING`.
- The grace-period logic for trial expiration becomes: `status === EXPIRED && trialEndsAt > now ? "grace" : "locked"`. Without the enum, this would require a separate boolean field or a date-only heuristic.
- Stripe webhook handler in v2 maps `status: "trialing"` to our enum directly: `stripeStatus === "trialing"` → `SubscriptionStatus.TRIALING`. No translation table needed.
- Retention campaign triggers differentiate: `CANCELED` users get a "come back" email; `EXPIRED` users get a "your trial ended" email. Same UI template, different messaging.

---

## Gap 5.1.5 — Workspace Contains Inline Fields That Belong Elsewhere

### Problem
The `Workspace` model carries four fields that should live in other entities:
- `logoUrl` → belongs in `WorkspaceSettings`
- `primaryColor` → belongs in `WorkspaceSettings`
- `subscriptionStatus` → belongs in `Subscription`
- `trialEndsAt` → belongs in `Subscription`

### Why It Matters
- **Table width:** Workspace is queried on every request. Four nullable columns that are only relevant to specific sub-features (settings page, billing page) increase I/O for every tenant resolution query. In Postgres, wider rows mean fewer rows per page in shared buffers, reducing cache efficiency.
- **Write amplification:** Every workspace identity update (e.g., rename) locks a row that also contains billing and branding data. If a Stripe webhook updates `subscriptionStatus` while a user is updating the workspace name, one of the transactions will abort and retry.
- **Conceptual cohesion:** Workspace identity (name, slug) has different invariants than branding (logo format constraints) and billing (payment gateway concerns). Mixing them violates the single-responsibility principle at the schema level. A developer working on billing should not need to understand Workspace's branding fields.
- **Migration cost increases over time:** Every day these fields remain on Workspace, more code references them there. The cost of extracting them grows with each new feature built on top of the current arrangement.

### Recommended Solution
Remove all four fields from `Workspace`. They are absorbed by:
- `WorkspaceSettings.logoUrl`, `WorkspaceSettings.primaryColor` (Gap 5.1.3)
- `Subscription.status`, `Subscription.trialEndsAt` (Gap 5.1.2)

The Workspace model retains only: `id`, `name`, `slug`, `deletedAt`, `createdAt`, `updatedAt`.

### Impact on Database
- Workspace table shrinks by four columns (two VARCHAR, one enum, one timestamp).
- Two new columns appear in `WorkspaceSettings` (logoUrl, primaryColor).
- Two new columns appear in `Subscription` (status, trialEndsAt).
- No duplicate data — each piece of information lives in exactly one place.
- The `subscriptionStatus` column on Workspace was previously non-nullable with a default. Removing it removes a DEFAULT value that was used for plan enforcement. After extraction, plan enforcement queries the Subscription table.

### Impact on Application Architecture
- **Tenant resolution** (`middleware.ts`, `src/lib/multi-tenant.ts`) becomes faster: `prisma.workspace.findUnique({ where: { slug } })` fetches only 5 columns instead of 9.
- **Settings page** must load WorkspaceSettings explicitly via `workspace.settings` relation.
- **Billing page** must load active subscription via `getActiveSubscription(workspaceId)` helper.
- **Onboarding flow** must create a WorkspaceSettings row (with defaults) during workspace creation. The signup Server Action gains an additional `prisma.workspaceSettings.create()` call.
- **Feature gating** in middleware and layout components changes from `workspace.subscriptionStatus` to a query or cached value for the active subscription status.
- **Seed scripts** must create default WorkspaceSettings and an initial Subscription (TRIALING plan) for every new Workspace.

---

## Gap 5.1.6 — Invite References Old WorkspaceRole

### Problem
The `Invite` model's `role` field uses `WorkspaceRole` as its type:
```prisma
model Invite {
  role  WorkspaceRole
}
```
When `WorkspaceRole` is renamed (Gap 5.1.1), the `Invite.role` column automatically reflects the new enum values in Prisma's type system. However, at the database level, an ALTER TYPE cannot simply rename values — Prisma handles this by creating a new enum, altering the column, and dropping the old one.

### Why It Matters
- This is a dependency cascade: Gap 5.1.1 cannot be fully resolved without addressing the Invite model's role field, because both the enum definition and all columns using it must be migrated together.
- If the Invite model is overlooked during migration planning, the migration will fail with a foreign-key-type mismatch or, worse, silently succeed with the wrong values in the invite_requests table.
- The invitation system is the entry point for new users. A broken invite flow blocks the entire onboarding funnel.

### Recommended Solution
The fix is automatic in Prisma — when the `WorkspaceRole` enum definition changes, Prisma generates a migration that:
1. Creates a new enum type with the new values.
2. Alters the `Invite.role` column (and `WorkspaceMember.role`) to use the new type.
3. Drops the old enum.

Because no database exists yet, the initial migration handles this cleanly. The migration output should be verified to ensure both `WorkspaceMember.role` and `Invite.role` are included in the ALTER.

### Impact on Database
- No structural change beyond enum type alteration.
- At migration time, both `workspace_members.role` and `invites.role` are updated to use the renamed enum.
- No data loss — enum values map 1:1 from old to new (`ADMIN → OWNER`, `MEMBER → TEAM_MEMBER`, `MANAGER` stays the same).

### Impact on Application Architecture
- Invite creation logic (`/features/team/_actions.ts`) already uses `WorkspaceRole.OWNER` etc. in the TypeScript code. After the rename, no code changes are needed in the invite flow — the enum values match what the code already references.
- Invite acceptance flow reads the token, checks the role, and creates a WorkspaceMember with the same role. The role comparison is direct enum-to-enum, no translation.
- The `Invite.email` lookup for role display in UI templates (e.g., "You've been invited as a MANAGER") reads the enum value directly for display text.
- No special handling needed for existing invites at migration time — since no migration has run, there are zero invites in the database.

---

## Gap 5.1.7 — ClientMember Missing Composite Index on `(workspaceId, userId)`

### Problem
The `ClientMember` model defines a unique constraint on `(clientId, userId)` and indexes on `workspaceId` and `userId` individually, but has no composite index on `(workspaceId, userId)`.

```prisma
model ClientMember {
  @@unique([clientId, userId])
  @@index([workspaceId])
  @@index([userId])
}
```

### Why It Matters
- The most common query pattern for `ClientMember` is: "Find all client portal memberships for a given user in a given workspace." This is a two-column filter: `WHERE workspaceId = ? AND userId = ?`. Without a composite index, Postgres must choose between: (a) using the `workspaceId` index and filtering by `userId` in a Bitmap Heap Scan, or (b) using the `userId` index and filtering by `workspaceId`. Neither is as efficient as a single B-tree walk on `(workspaceId, userId)`.
- Every client portal authentication request performs this query. If a workspace has 10,000 clients, scanning by `workspaceId` alone and then filtering 10,000 rows by `userId` is unnecessarily expensive.
- The `WorkspaceMember` model has the analogous `@@unique([workspaceId, userId])` constraint, which automatically creates a composite index. `ClientMember` is inconsistent — it has the unique on `(clientId, userId)` but no composite for the workspace-scoped lookup.
- As the client portal gains adoption (v1.5), the frequency of this query scales with the number of client portal logins per workspace.

### Recommended Solution
Add a composite index on `(workspaceId, userId)` to the `ClientMember` model. This is additive — it does not change any existing index or constraint.

Decision point: The index on `(workspaceId)` alone becomes redundant after adding `(workspaceId, userId)` because the composite index can serve prefix queries on `workspaceId` alone. However, retaining the single-column index is harmless and may be preferred if there are queries that filter by `workspaceId` only (e.g., "list all portal members in this workspace" for an admin panel). The cost is one additional B-tree write per `ClientMember` insert.

### Impact on Database
- New index: `client_members_workspace_id_user_id_idx` on `(workspaceId, userId)`.
- Insert performance: One additional index write per `ClientMember` row creation. For a table with fewer than 100,000 rows, the impact is negligible.
- Query performance: The most common lookup becomes an index-only scan on a two-column B-tree. At 10,000+ members per workspace, the difference is measurable (single-digit milliseconds vs double-digit).
- Storage overhead: Approximately 24 bytes per row for the new index entry (8-byte workspaceId + 8-byte userId + 8-byte tuple header). For 50,000 rows, roughly 1.2 MB. Negligible.

### Impact on Application Architecture
- No application code changes required. Prisma's query optimizer automatically selects the best index. Adding the index is transparent to all query code.
- The portal auth lookup (`findFirst({ where: { workspaceId, userId } })`) becomes consistently fast regardless of data volume.
- The existing `@@unique([clientId, userId])` constraint continues to enforce the business rule that a user can only be linked to a given client once — unchanged.
- No change to Server Actions, route handlers, or data access patterns.
