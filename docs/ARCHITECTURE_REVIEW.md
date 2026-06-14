# FlowDesk — Architecture Review

Review against the six specification documents. Severity: **🔴 Critical / 🟡 Major / 🔵 Minor**.

---

## 1. Missing Entities

| # | Entity | Missing From | Severity | Rationale |
|---|---|---|---|---|
| 1.1 | **Invite / Invitation** | DATABASE.md | 🟡 Major | `/invite/:token` route exists but no entity tracks pending invites, expiration, or redemption status. Tokens in URLs with no backing table means no revocation, no expiry, and no audit trail. |
| 1.2 | **Audit Log** | DATABASE.md | 🟡 Major | Financial data (invoices, payments) and permission changes (role assignments, ownership transfer) have zero audit trail. A SaaS handling billing must answer "who did what and when." |
| 1.3 | **Activity Feed / Notification** | DATABASE.md | 🟡 Major | USER_FLOWS and ROUTES reference "recent activity" and client messaging but no entity stores events. Every dashboard view and client notification requires ad-hoc queries across 6+ tables. |
| 1.4 | **Subscription Plan / Pricing Tier** | DATABASE.md | 🟡 Major | Workspace has `subscription_status` but no plan entity. No way to define feature flags per tier (e.g., "team features locked on solo plan"), track payment methods, or store billing provider IDs. |
| 1.5 | **Email Log / Outbound Message** | DATABASE.md | 🔵 Minor | Invoices sent, invites emailed, password resets — no record of delivery status. Hard to debug "I never got the invoice" tickets. |
| 1.6 | **Tag / Label** | DATABASE.md | 🔵 Minor | No way to categorize clients, projects, or tasks with custom tags. Standard CRM feature that will be requested immediately post-MVP. |

---

## 2. Security Risks

| # | Issue | Location | Severity | Detail |
|---|---|---|---|---|
| 2.1 | **Dual auth systems — User vs ClientUser** | DATABASE.md | 🔴 Critical | User and ClientUser are separate tables with independent `password_hash` fields. Two auth systems means doubling the attack surface: different password policies, different session handling, different reset flows. If a single bug in the ClientUser auth bypasses scoping, an attacker can impersonate any client across any workspace. **Fix: unify under a single identity table with a `role` discriminator.** |
| 2.2 | **Cascade deletes on financial data** | DATABASE.md | 🔴 Critical | `Client ON DELETE CASCADE`, `Project ON DELETE CASCADE`, `Invoice ON DELETE CASCADE`. A single `DELETE FROM client WHERE id = $1` can silently destroy projects, tasks, time entries, invoices, and line items — billable data gone permanently. **Fix: soft-delete with a `deleted_at` timestamp on every entity. Never cascade-delete financial records.** |
| 2.3 | **No rate limiting on auth endpoints** | ROUTES.md | 🔴 Critical | `/login`, `/signup`, `/forgot-password`, `/reset-password/:token`, `/invite/:token` are all public POST endpoints with zero rate-limit mentions. Brute-force, credential stuffing, and email enumeration attacks are trivial. |
| 2.4 | **Invite token lacks expiry and single-use** | ROUTES.md, DATABASE.md | 🟡 Major | `/invite/:token` has no backing Invite entity. No token expiration, no max-use count, no revocation. A leaked invite link grants permanent workspace access. |
| 2.5 | **IDOR surface across every parameterized route** | ROUTES.md | 🟡 Major | All routes use UUID path params (`:clientId`, `:projectId`, `:taskId`, `:entryId`, `:invoiceId`). The route guard architecture (ROUTES.md §Route Guard Summary) describes workspace-scoped checks, but there is no mechanism to *enforce* it — no Prisma middleware, no RLS, no base query wrapper. A single missed `.where({ workspace_id: session.workspaceId })` leaks data across tenants. |
| 2.6 | **No break-glass for Owner lockout** | PERMISSIONS.md | 🟡 Major | "One OWNER per workspace" with no recovery mechanism. If the Owner loses credentials, 2FA device, or leaves the company, the entire workspace is unrecoverable. No support-escrow role or ownership recovery flow. |
| 2.7 | **API keys not designed for** | PRD.md (future), DATABASE.md | 🔵 Minor | Future Zapier/API access is mentioned but no API key entity or auth scheme exists. Retrofitting API auth into a Server Action–only architecture is painful. An `ApiKey` entity should be designed now even if not implemented. |

---

## 3. RBAC Issues

| # | Issue | Location | Severity | Detail |
|---|---|---|---|---|
| 3.1 | **Manager can self-approve timesheets** | PERMISSIONS.md | 🔴 Critical | MANAGER has both "Submit timesheet for approval" and "Approve/reject submitted entries." A MANAGER can submit a timesheet with inflated hours and immediately approve it with no second pair of eyes. Standard practice: managers must not self-approve. **Fix: add a constraint — `approved_by != user_id`.** |
| 3.2 | **Team Member can delete tasks with time entries** | PERMISSIONS.md | 🟡 Major | A TEAM_MEMBER can delete their own tasks. If a task has linked TimeEntry rows (which use `ON DELETE SET NULL`), the time entries become orphaned from their task context but remain billable. This creates audit gaps: "9 hours logged to what?" |
| 3.3 | **"Own / assigned only" is undefined for clients** | PERMISSIONS.md | 🟡 Major | TEAM_MEMBER sees "assigned only" clients but there is no direct client-to-member assignment. The indirect path (member → assigned projects → client) means a member suddenly loses client visibility when their last project ends. Confusing UX. **Fix: add an explicit `ClientAssignment` join table or define the scope calculation formally.** |
| 3.4 | **No deny-by-default semantics** | PERMISSIONS.md | 🔵 Minor | The matrix defines what each role *can* do but never states that unlisted actions are denied. As new entities are added (e.g., expenses, proposals), the lack of an explicit deny default makes it easy to introduce unauthorized access. |
| 3.5 | **MANAGER sees all team time entries but cannot edit** | PERMISSIONS.md | 🔵 Minor | MANAGER can view team time entries and request revision but cannot directly edit them. In practice, "request revision" without edit capability creates ping-pong workflows. Consider allowing manager edits with an `edited_by` audit field. |

---

## 4. Scaling Issues

| # | Issue | Location | Severity | Detail |
|---|---|---|---|---|
| 4.1 | **No database indexes defined** | DATABASE.md | 🟡 Major | Zero indexes beyond PKs and unique constraints. At 500 workspaces with daily time entries, queries on `workspace_id`, `status`, `client_id`, `project_id`, `user_id`, `due_date`, and `created_at` will degrade rapidly. Particularly: TimeEntry date-range queries (the most common dashboard query) and Invoice status-filter queries. |
| 4.2 | **Hard deletes prevent recovery** | DATABASE.md | 🟡 Major | Every DELETE is permanent. No soft-delete, no recycle bin, no data retention policy. A single accidental delete (owner removes wrong client) means data loss. Post-MVP, adding soft-delete to every table is a painful migration. |
| 4.3 | **No pagination model for TimeEntry** | DATABASE.md, ROUTES.md | 🟡 Major | TimeEntry is the highest-volume table. ROUTES.md lists "Paginated list" as a feature but there is no cursor field, no offset strategy, and no composite index for cursor-based pagination in the entity design. Without it, page N+1 queries become full table scans. |
| 4.4 | **Integer sort_order on Task** | DATABASE.md | 🟡 Major | Reordering tasks requires updating every task in a project. With >100 tasks, a single drag-and-drop triggers 100+ UPDATE statements. A fractional index (e.g., `FLOAT sort_order = AVG(neighbors)`) or a lexorank string column would reduce this to 1–2 updates per reorder. |
| 4.5 | **Invoice number collision risk** | DATABASE.md | 🟡 Major | `UNIQUE(workspace_id, invoice_number)` relies on the application generating unique numbers. Without a database sequence or an auto-increment per workspace, invoice number generation is a bottleneck and collision risk at scale. |
| 4.6 | **Single User + ClientUser query complexity** | DATABASE.md | 🔵 Minor | Every feature that needs to show "who is this person" must query User OR ClientUser depending on context. As the product grows, this dual-table pattern multiplies query complexity. A unified `Identity` table with a polymorphic `role` field would simplify every join. |

---

## 5. Multi-Tenancy Problems

| # | Issue | Location | Severity | Detail |
|---|---|---|---|---|
| 5.1 | **workspace_id scoping is entirely manual** | DATABASE.md | 🔴 Critical | Every repository call must include `.where({ workspace_id: session.workspaceId })`. There is no Prisma middleware, no Postgres Row-Level Security, and no base repository class that auto-applies the filter. One developer error per 1000 queries is enough for a data leak. **Fix: implement Prisma middleware or RLS that injects `workspace_id` on every query automatically.** |
| 5.2 | **ClientUser bypasses workspace_id** | DATABASE.md, ROUTES.md | 🔴 Critical | ClientUser has no `workspace_id` column. Scoping requires a two-join path: `ClientUser → Client → Workspace`. The route guard for client portal routes does not validate workspace membership at all — "no workspace slug is needed because the ClientUser record is linked to a single Client." This means a compromised client portal session cannot be scoped to a workspace at the query level. If a bug in the portal serves data from the wrong client, there is no defensive layer. |
| 5.3 | **No tenant isolation defense in depth** | DATABASE.md, FILE_TREE.md | 🟡 Major | The architecture relies on application-level filtering alone. No mention of: Postgres RLS policies per tenant, separate database schemas, or connection pooling per tenant. For a SaaS targeting 500+ paying workspaces with financial data, a single SQL injection or ORM bug is catastrophic. |
| 5.4 | **Slug squatting and vanity URLs** | DATABASE.md | 🔵 Minor | Workspace slugs are globally unique with no reservation system. Nothing prevents squatting `acme-consulting` before the legitimate owner signs up. No slug change / vanity URL mechanism exists either. |
| 5.5 | **No workspace deletion / data export flow** | PRD.md, DATABASE.md | 🟡 Major | Subscription cancellation is listed but there is no grace period, no data export flow, and no workspace deletion/archival process. A cancelled workspace's data lives in the database indefinitely with no cleanup policy — liability and cost issue at scale. |

---

## Summary by Severity

| Severity | Count | Key Actions |
|---|---|---|
| 🔴 Critical | 6 | Unify auth identity, implement soft-deletes on financial data, add rate limiting, enforce workspace_id via Prisma middleware/RLS, add ClientUser workspace_id, prevent manager self-approval |
| 🟡 Major | 13 | Invite entity, audit log, activity feed, subscription plans, IDOR defense, break-glass Owner recovery, task/client scope definition, indexes, cursor pagination, fractional sort, invoice sequences, tenant data export, tenant isolation defense |
| 🔵 Minor | 4 | Email log, tags, deny-by-default, API key schema |

---

## Recommended Remediation Priority

1. **Unify User + ClientUser into a single identity table** — eliminates an entire attack surface and simplifies every future feature.
2. **Add soft-delete + Prisma middleware for workspace_id injection** — prevents catastrophic data loss and closes the biggest multi-tenancy gap simultaneously.
3. **Introduce an AuditLog entity and an Invite entity** — required for compliance and before any customer-facing billing launch.
4. **Implement rate limiting and token expiry** — minimum security baseline before any production deployment.
5. **Define database indexes and pagination strategy** — before the first 10 beta users hit the time-tracking dashboard.
