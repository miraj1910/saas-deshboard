# FlowDesk — Prisma Schema Plan

**Final database specification.** Intended to be the direct source for the Prisma schema file.

---

## Enums

### UserType
Discriminates the unified User identity.

- `TEAM` — workspace member (OWNER, MANAGER, TEAM_MEMBER)
- `CLIENT` — client portal user

### WorkspaceRole
RBAC role within a workspace.

- `OWNER` — full access, billing, team management, ownership transfer
- `MANAGER` — full operational access except billing and team changes
- `TEAM_MEMBER` — individual contributor, scoped to own projects and tasks

### Plan
Subscription tier.

- `FREE` — solo freelancer, 1 user, 5 clients, 3 active projects
- `PRO` — up to 5 team members, unlimited clients/projects, portal
- `AGENCY` — unlimited team members, all features, priority support

### SubscriptionStatus
Lifecycle state of a workspace subscription.

- `TRIALING` — active trial period (maps to Stripe `trialing`)
- `ACTIVE` — paid subscription in good standing
- `PAST_DUE` — payment failed, grace period active
- `CANCELED` — user-initiated cancellation
- `EXPIRED` — natural end of lifecycle (trial ended, period ended without renewal)

### ClientStatus
CRM pipeline status.

- `LEAD` — prospective client
- `ACTIVE` — current client with active projects
- `INACTIVE` — past client, no current projects
- `ARCHIVED` — permanently archived

### ProjectStatus
Project lifecycle.

- `ACTIVE` — ongoing work
- `COMPLETED` — finished, billable
- `ARCHIVED` — closed

### TaskStatus
Task progress state.

- `TODO` — not started
- `IN_PROGRESS` — actively worked on
- `DONE` — completed

### TimeEntryStatus
Timesheet approval workflow.

- `DRAFT` — timer running or unsaved entry
- `SUBMITTED` — awaiting approval
- `APPROVED` — approved by MANAGER or OWNER
- `REJECTED` — sent back for revision

### InvoiceStatus
Invoice lifecycle.

- `DRAFT` — editable, not yet sent
- `SENT` — delivered to client
- `PAID` — payment received
- `OVERDUE` — past due date, unpaid
- `CANCELED` — voided

### InviteStatus
Invitation lifecycle.

- `PENDING` — sent, awaiting acceptance
- `ACCEPTED` — redeemed
- `EXPIRED` — past expiry date
- `REVOKED` — canceled by sender

---

## Models

### Workspace

**Purpose:** Multi-tenant container. Every piece of business data is scoped to a workspace. Stripped to pure identity — branding, subscription, and company info live in separate entities.

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Human-readable workspace name |
| `slug` | String | Globally unique URL identifier. Used in `/:slug/*` routes. Mutable with 301 redirect. |
| `deletedAt` | DateTime? | Soft-delete timestamp |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Settings | One-to-one | WorkspaceSettings | Cascade |
| Subscriptions | One-to-many | Subscription | Cascade |
| Members | One-to-many | WorkspaceMember | Cascade |
| Clients | One-to-many | Client | Cascade |
| Projects | One-to-many | Project | Cascade |
| Time entries | One-to-many | TimeEntry | Cascade |
| Invoices | One-to-many | Invoice | Cascade |
| Invites | One-to-many | Invite | Cascade |
| Audit logs | One-to-many | AuditLog | Cascade |
| Activities | One-to-many | Activity | Cascade |
| API keys | One-to-many | ApiKey | Cascade |

---

### WorkspaceSettings

**Purpose:** 1:1 configuration extension of Workspace. Stores branding, company info, and preferences that are read less frequently than the workspace identity.

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspaceId` | UUID | FK to Workspace. One-to-one enforced via unique constraint. |
| `logoUrl` | String? | S3 URL for workspace logo |
| `primaryColor` | String? | Hex color (#RRGGBB) for UI theming |
| `timezone` | String | IANA timezone string (e.g., "America/New_York"). Default "UTC". |
| `companyName` | String? | Legal business name for invoices |
| `companyAddress` | String? | Street address for invoices |
| `companyTaxId` | String? | VAT number, EIN, or local tax identifier |
| `theme` | Json? | Flexible JSON for UI theme preferences (dark mode, accent colors) |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Workspace | Belongs to | Workspace | Cascade |

---

### Subscription

**Purpose:** Billing record for a workspace. One workspace can have many subscriptions over time; the latest non-expired one is the active plan. Enables subscription history, Stripe integration readiness, and plan-based feature gating.

**Phase:** v1 (schema only), v2 (Stripe integration)

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspaceId` | UUID | FK to Workspace |
| `stripeSubscriptionId` | String? | Stripe subscription ID (populated in v2) |
| `stripeCustomerId` | String? | Stripe customer ID (populated in v2) |
| `plan` | Enum (Plan) | FREE, PRO, or AGENCY |
| `status` | Enum (SubscriptionStatus) | TRIALING, ACTIVE, PAST_DUE, CANCELED, EXPIRED |
| `currentPeriodStart` | DateTime | Start of current billing period |
| `currentPeriodEnd` | DateTime | End of current billing period |
| `trialEndsAt` | DateTime? | End of trial period. Null if not in trial. |
| `cancelAtPeriodEnd` | Boolean | True if user requested cancellation at period end. Default false. |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Workspace | Belongs to | Workspace | Cascade |

**Notes:**
- Application enforces at most one active subscription per workspace
- Active means status is TRIALING or ACTIVE
- Stripe fields are nullable until v2 integration is built

---

### User

**Purpose:** Unified identity for every person who logs in — workspace owners, managers, team members, and client portal users. Discriminated by `userType` (TEAM vs CLIENT). Eliminates the dual-auth security risk of separate User and ClientUser tables.

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | String | Globally unique. Used for login and notifications. |
| `passwordHash` | String | Bcrypt hash (via Auth.js) |
| `name` | String | Display name |
| `avatarUrl` | String? | S3 URL for profile photo |
| `userType` | Enum (UserType) | TEAM for workspace members, CLIENT for portal users. Default TEAM. |
| `deletedAt` | DateTime? | Soft-delete timestamp |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Workspace memberships | One-to-many | WorkspaceMember | Cascade |
| Client memberships | One-to-many | ClientMember | Cascade |
| Assigned tasks | One-to-many | Task (as assignee) | Set null |
| Time entries | One-to-many | TimeEntry (as owner) | Cascade |
| Approved entries | One-to-many | TimeEntry (as approver) | Set null |
| Invited members | One-to-many | WorkspaceMember (as inviter) | Set null |
| Created invites | One-to-many | Invite (as creator) | Set null |
| Audit log entries | One-to-many | AuditLog | Set null |
| Activity entries | One-to-many | Activity | Set null |
| API keys | One-to-many | ApiKey | Cascade |

---

### WorkspaceMember

**Purpose:** Join table that assigns a User to a Workspace with a role. The RBAC system reads this entity to determine permissions. Only TEAM-type users are linked via this table.

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspaceId` | UUID | FK to Workspace |
| `userId` | UUID | FK to User |
| `role` | Enum (WorkspaceRole) | OWNER, MANAGER, or TEAM_MEMBER |
| `joinedAt` | DateTime | When the user accepted the invite or was added |
| `invitedById` | UUID? | FK to User who sent the invite |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Workspace | Belongs to | Workspace | Cascade |
| User | Belongs to | User | Cascade |
| Invited by | Belongs to | User (optional) | Set null |

---

### Client

**Purpose:** CRM record — a company or individual the workspace does business with. The root of the client → project → task hierarchy. All billing and project work traces back to a client.

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspaceId` | UUID | FK to Workspace |
| `name` | String | Client name or company name |
| `email` | String? | Primary contact email |
| `phone` | String? | Primary contact phone |
| `company` | String? | Company name (if individual contact differs from company) |
| `status` | Enum (ClientStatus) | LEAD → ACTIVE → INACTIVE → ARCHIVED |
| `notes` | String? | Free-text internal notes |
| `deletedAt` | DateTime? | Soft-delete timestamp |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Workspace | Belongs to | Workspace | Cascade |
| Portal members | One-to-many | ClientMember | Cascade |
| Projects | One-to-many | Project | Restrict |
| Invoices | One-to-many | Invoice | Restrict |

---

### ClientMember

**Purpose:** Links a CLIENT-type User to a Client record for portal access. Enables the client portal authentication flow: a client user logs in, is scoped to their client record, and sees only their own projects and invoices.

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `clientId` | UUID | FK to Client |
| `userId` | UUID | FK to User (must have userType = CLIENT) |
| `workspaceId` | UUID | FK to Workspace. Denormalized for direct workspace-scoped queries. |
| `joinedAt` | DateTime | When the portal invite was accepted |
| `invitedById` | UUID? | FK to User who invited (TEAM-type) |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Client | Belongs to | Client | Cascade |
| User | Belongs to | User | Cascade |
| Workspace | Belongs to | Workspace | Cascade |
| Invited by | Belongs to | User (optional) | Set null |

---

### Project

**Purpose:** Work container nested under a Client. Holds tasks and time entries. The billing unit — hourly rate is set at the project level and inherited by unbilled time entries during invoice generation.

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspaceId` | UUID | FK to Workspace |
| `clientId` | UUID | FK to Client |
| `name` | String | Project name |
| `description` | String? | Free-text description |
| `hourlyRate` | Decimal (10,2) | Default rate for time entries. Non-negative. |
| `status` | Enum (ProjectStatus) | ACTIVE → COMPLETED → ARCHIVED |
| `startDate` | Date? | Project start |
| `dueDate` | Date? | Project deadline |
| `deletedAt` | DateTime? | Soft-delete timestamp |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Workspace | Belongs to | Workspace | Cascade |
| Client | Belongs to | Client | Restrict |
| Tasks | One-to-many | Task | Cascade |
| Time entries | One-to-many | TimeEntry | Restrict |

---

### Task

**Purpose:** Individual work item within a project. Assignable to one team member. Float-based sort order enables O(1) drag-and-drop reordering (insert between neighbors by averaging their sort values).

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `projectId` | UUID | FK to Project |
| `assigneeId` | UUID? | FK to User (TEAM-type). Nullable for unassigned tasks. |
| `title` | String | Task name |
| `description` | String? | Free-text details |
| `status` | Enum (TaskStatus) | TODO → IN_PROGRESS → DONE |
| `dueDate` | Date? | Task deadline |
| `sortOrder` | Float | Ordering within project. Float allows O(1) insertion. Default 0. |
| `deletedAt` | DateTime? | Soft-delete timestamp |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Project | Belongs to | Project | Cascade |
| Assignee | Belongs to | User (optional) | Set null |
| Time entries | One-to-many | TimeEntry | Cascade |

---

### TimeEntry

**Purpose:** Logged time against a project, optionally linked to a specific task. The atomic unit of billing — invoice line items are generated from approved time entries. Has a submission and approval workflow.

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspaceId` | UUID | FK to Workspace |
| `userId` | UUID | FK to User who logged the time |
| `projectId` | UUID | FK to Project |
| `taskId` | UUID? | FK to Task (optional) |
| `description` | String? | What the time was spent on |
| `startTime` | DateTime | When work started |
| `endTime` | DateTime? | When work stopped. Null if timer is running. Must be greater than startTime when set. |
| `durationMinutes` | Int | Calculated duration. Non-negative. |
| `status` | Enum (TimeEntryStatus) | DRAFT → SUBMITTED → APPROVED / REJECTED |
| `approvedById` | UUID? | FK to User who approved. Cannot equal userId (self-approval prohibited). |
| `approvedAt` | DateTime? | When approval occurred |
| `deletedAt` | DateTime? | Soft-delete timestamp |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Workspace | Belongs to | Workspace | Cascade |
| User | Belongs to | User | Cascade |
| Project | Belongs to | Project | Restrict |
| Task | Belongs to | Task (optional) | Set null |
| Approved by | Belongs to | User (optional) | Set null |
| Invoice items | One-to-many | InvoiceLineItem | Set null |

---

### Invoice

**Purpose:** Billing document sent to a client. Generated by grouping unbilled, approved time entries. Each invoice has a unique number per workspace and a lifecycle status that the audit log tracks.

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspaceId` | UUID | FK to Workspace |
| `clientId` | UUID | FK to Client |
| `invoiceNumber` | String | Unique per workspace. Format: `{slug}-{YYYYMM}-{sequential}`. |
| `status` | Enum (InvoiceStatus) | DRAFT → SENT → PAID / OVERDUE / CANCELED |
| `totalAmount` | Decimal (12,2) | Sum of all line item amounts. Non-negative. |
| `issuedDate` | Date | Date the invoice was created/sent |
| `dueDate` | Date | Payment deadline. Must be >= issuedDate. |
| `paidAt` | DateTime? | When payment was received |
| `notes` | String? | Internal notes or client-facing message |
| `deletedAt` | DateTime? | Soft-delete timestamp |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Workspace | Belongs to | Workspace | Cascade |
| Client | Belongs to | Client | Restrict |
| Line items | One-to-many | InvoiceLineItem | Cascade |

---

### InvoiceLineItem

**Purpose:** Individual line on an invoice. May link back to the originating time entry for audit traceability. Not soft-deleted because its parent invoice controls lifecycle.

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `invoiceId` | UUID | FK to Invoice |
| `timeEntryId` | UUID? | FK to originating TimeEntry (optional for manual line items) |
| `description` | String | Line item description |
| `quantity` | Decimal (10,2) | Hours or units. Must be > 0. |
| `unitPrice` | Decimal (10,2) | Rate per unit. Must be >= 0. |
| `amount` | Decimal (12,2) | Calculated: quantity × unitPrice. Must be >= 0. |
| `sortOrder` | Int | Display order on invoice. Default 0. |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Invoice | Belongs to | Invoice | Cascade |
| Time entry | Belongs to | TimeEntry (optional) | Set null |

---

### Invite

**Purpose:** Pending invitation sent via email. Supports two flows: (1) inviting a TEAM user to join the workspace with a role, and (2) inviting a CLIENT user to access the client portal. Token is single-use, hashed, and expires after 7 days.

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspaceId` | UUID | FK to Workspace |
| `email` | String | Recipient email |
| `role` | Enum (WorkspaceRole) | Intended role (OWNER/MANAGER/TEAM_MEMBER for team invites) |
| `token` | String | Unique, hashed invite token |
| `status` | Enum (InviteStatus) | PENDING → ACCEPTED / EXPIRED / REVOKED |
| `expiresAt` | DateTime | Token expiration. 7 days from creation. |
| `acceptedAt` | DateTime? | When the invite was redeemed |
| `createdById` | UUID? | FK to User who sent the invite |
| `clientId` | UUID? | Set when inviting a client portal user (links to Client record) |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Workspace | Belongs to | Workspace | Cascade |
| Created by | Belongs to | User (optional) | Set null |
| Client | Belongs to | Client (optional) | Cascade |

---

### AuditLog

**Purpose:** Immutable compliance trail for sensitive mutations. Every invoice status transition, role change, and entity deletion is recorded. Long-lived, never deleted. Separate from Activity because retention and access patterns differ.

**Phase:** v1

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspaceId` | UUID | FK to Workspace |
| `userId` | UUID? | FK to User who performed the action |
| `action` | String | Machine-readable action name (e.g., "invoice.sent", "member.role_changed") |
| `entityType` | String | Target entity name (e.g., "Invoice", "WorkspaceMember") |
| `entityId` | String? | UUID of the affected entity |
| `metadata` | Json? | Free-form context (old/new values, reason, IP, user agent) |
| `ipAddress` | String? | Request origin IP |
| `createdAt` | DateTime | Timestamp of the action. No updatedAt — immutable. |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Workspace | Belongs to | Workspace | Cascade |
| User | Belongs to | User (optional) | Set null |

---

### Activity

**Purpose:** In-app feed events for dashboards. Shorter-lived than AuditLog. Displays on personal and workspace dashboards to show recent activity (task completed, invoice sent, member joined).

**Phase:** v1.5

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspaceId` | UUID | FK to Workspace |
| `userId` | UUID? | FK to User who performed the action |
| `action` | String | Machine-readable event name (e.g., "task.completed", "invoice.paid") |
| `description` | String | Human-readable event summary for display |
| `entityType` | String | Target entity name |
| `entityId` | String? | UUID of the related entity |
| `metadata` | Json? | Optional extra context |
| `createdAt` | DateTime | Event timestamp. No updatedAt — immutable. |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Workspace | Belongs to | Workspace | Cascade |
| User | Belongs to | User (optional) | Set null |

---

### ApiKey

**Purpose:** API keys for external integrations (Zapier, custom scripts, third-party tools). Schema is designed now to avoid a painful retrofit; actual enforcement comes in v2.

**Phase:** v2

**Fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspaceId` | UUID | FK to Workspace |
| `userId` | UUID | FK to User who owns the key |
| `name` | String | Human-readable label (e.g., "Zapier Integration") |
| `keyHash` | String | Unique, hashed API key value. Plaintext key is shown once at creation. |
| `lastUsedAt` | DateTime? | Last authentication timestamp |
| `expiresAt` | DateTime? | Optional key expiration |
| `revokedAt` | DateTime? | If set, key is invalid |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Relationships:**

| Relation | Type | Target | On Delete |
|---|---|---|---|
| Workspace | Belongs to | Workspace | Cascade |
| User | Belongs to | User | Cascade |

---

## Constraints

### Unique Constraints

| Entity | Constraint | Type |
|---|---|---|
| User | `email` | Single-column unique |
| Workspace | `slug` | Single-column unique |
| WorkspaceSettings | `workspaceId` | Single-column unique (enforces 1:1) |
| WorkspaceMember | `(workspaceId, userId)` | Composite unique (one membership per user per workspace) |
| ClientMember | `(clientId, userId)` | Composite unique (one portal user per client) |
| Invoice | `(workspaceId, invoiceNumber)` | Composite unique (invoice numbers scoped to workspace) |
| Invite | `token` | Single-column unique |
| ApiKey | `keyHash` | Single-column unique |

### Check Constraints (Application-Level)

These are enforced in Server Actions and Zod validation, not as database CHECK constraints (Prisma does not natively support CHECK on Postgres enums; implement as application logic):

| Entity | Constraint | Enforcement |
|---|---|---|
| TimeEntry | `endTime > startTime` when both set | Zod schema + Server Action guard |
| Invoice | `dueDate >= issuedDate` | Zod schema + Server Action guard |
| InvoiceLineItem | `quantity > 0` | Zod schema |
| InvoiceLineItem | `unitPrice >= 0` | Zod schema |
| InvoiceLineItem | `amount >= 0` | Zod schema |
| InvoiceLineItem | `amount = quantity × unitPrice` | Application logic during invoice creation |
| TimeEntry | `approvedById != userId` (no self-approval) | Server Action guard in `approveTimeEntry()` |
| WorkspaceMember | Exactly one OWNER per workspace | Server Action guard in `transferOwnership()` and `changeMemberRole()` |
| Subscription | At most one active (TRIALING or ACTIVE) per workspace | Application enforcement in subscription creation |

---

## Delete Strategy

### CASCADE
Applied when the child entity has no independent value without its parent.

| Parent | Child | Rationale |
|---|---|---|
| Workspace | WorkspaceSettings | Settings are meaningless without the workspace |
| Workspace | Subscription | Subscription history belongs to the workspace lifecycle |
| Workspace | WorkspaceMember | Membership ends when workspace is deleted |
| Workspace | Client | CRM records belong to the workspace |
| Workspace | Project | Projects are workspace-scoped |
| Workspace | TimeEntry | Time entries are workspace-scoped |
| Workspace | Invoice | Invoices are workspace-scoped |
| Workspace | Invite | Invites belong to the workspace |
| Workspace | AuditLog | Audit trail is workspace-scoped |
| Workspace | Activity | Activity feed is workspace-scoped |
| Workspace | ApiKey | API keys are workspace-scoped |
| Client | ClientMember | Portal access ends when client record is deleted |
| Project | Task | Tasks have no meaning outside their project |
| Invoice | InvoiceLineItem | Line items are meaningless without their invoice |
| User | WorkspaceMember | User deletion removes all memberships |
| User | TimeEntry | User's time entries deleted with their account |

### RESTRICT
Applied when the child has financial or audit value that must survive the parent.

| Parent | Child | Rationale |
|---|---|---|
| Client | Project | Projects must be re-assigned or archived, not silently destroyed when client is deleted |
| Client | Invoice | Invoices are financial records that must persist even if client is deleted |
| Project | TimeEntry | Time entries are financial evidence — logged hours must survive project deletion |

### SET NULL
Applied when the reference is optional and the relationship should not block deletion.

| Parent | Child Field | Rationale |
|---|---|---|
| User | Task.assigneeId | Unassign tasks when a member is removed |
| User | TimeEntry.approvedById | Clear approval reference when approver is deleted |
| User | TimeEntry.approvedById | Clear approval reference when approver is deleted |
| Task | TimeEntry.taskId | Keep time entry but remove task link when task is deleted |
| TimeEntry | InvoiceLineItem.timeEntryId | Keep line item but remove time entry link when entry is deleted |
| User | WorkspaceMember.invitedById | Keep membership record but clear inviter reference |
| User | ClientMember.invitedById | Keep portal membership but clear inviter reference |
| User | Invite.createdById | Keep invite record but clear sender reference |

---

## Indexes

### Single-Column Indexes

| Entity | Column | Purpose |
|---|---|---|
| Workspace | `slug` | Tenant resolution in middleware. Unique, so also serves as lookup key. |
| Workspace | `deletedAt` | Soft-delete purge queries |
| User | `email` | Auth lookup, invite by email |
| User | `deletedAt` | Soft-delete purge queries |
| WorkspaceMember | `workspaceId` | List members by workspace |
| WorkspaceMember | `userId` | Find all workspaces for a user |
| WorkspaceMember | `role` | Role-based filtering (e.g., count OWNERs) |
| Client | `workspaceId` | List clients by workspace |
| Client | `deletedAt` | Soft-delete purge queries |
| ClientMember | `workspaceId` | List portal members by workspace |
| ClientMember | `userId` | Find portal memberships for a user |
| Project | `workspaceId` | List projects by workspace |
| Project | `deletedAt` | Soft-delete purge queries |
| Task | `projectId` | List tasks by project |
| Task | `assigneeId` | Find tasks assigned to a user |
| Task | `deletedAt` | Soft-delete purge queries |
| TimeEntry | `workspaceId` | List time entries by workspace |
| TimeEntry | `deletedAt` | Soft-delete purge queries |
| Invoice | `workspaceId` | List invoices by workspace |
| Invoice | `deletedAt` | Soft-delete purge queries |
| Invite | `workspaceId` | List invites by workspace |
| Invite | `token` | Invite acceptance lookup (unique) |
| Invite | `email` | Find pending invites by email |
| Invite | `status` | Expired invite cleanup queries |
| AuditLog | `workspaceId` | List audit logs by workspace |
| AuditLog | `action` | Filter audit logs by action type |
| Activity | `workspaceId` | List activity by workspace |
| ApiKey | `workspaceId` | List keys by workspace |
| ApiKey | `keyHash` | API key authentication lookup (unique) |

### Composite Indexes

| Entity | Columns | Purpose |
|---|---|---|
| Client | `(workspaceId, status)` | Filter clients by workspace + status (most common CRM query) |
| Client | `(workspaceId, createdAt)` | List clients by workspace sorted by creation date |
| ClientMember | `(workspaceId, userId)` | Portal auth lookup — find user's membership in a workspace (Gap 5.1.7 resolution) |
| Project | `(workspaceId, clientId)` | List projects by workspace scoped to a client |
| Project | `(workspaceId, status)` | Filter projects by workspace + status (dashboard query) |
| Task | `(projectId, sortOrder)` | Task ordering and reordering queries |
| TimeEntry | `(workspaceId, userId)` | Find all time entries for a user in a workspace |
| TimeEntry | `(workspaceId, projectId)` | Find all time entries for a project in a workspace |
| TimeEntry | `(workspaceId, startTime, endTime)` | Date-range queries (time dashboard, reports) |
| TimeEntry | `(workspaceId, status)` | Filter by approval status (approval queue) |
| TimeEntry | `(userId, startTime)` | Personal time history sorted by date |
| Invoice | `(workspaceId, clientId)` | List invoices for a client |
| Invoice | `(workspaceId, status)` | Filter invoices by status (overdue tracking) |
| Invoice | `(workspaceId, dueDate)` | Overdue invoice queries (scheduled checks) |
| Invite | `(workspaceId, status)` | Find pending/expired invites for a workspace |
| AuditLog | `(workspaceId, createdAt)` | Audit feed sorted by time |
| AuditLog | `(workspaceId, entityType, entityId)` | Find all audit entries for a specific entity |
| Activity | `(workspaceId, createdAt)` | Activity feed sorted by time |
| Activity | `(workspaceId, entityType)` | Filter activity by entity type |
| Subscription | `(workspaceId, status)` | Find active subscription for a workspace |
| Subscription | `(workspaceId, currentPeriodEnd)` | Upcoming expiry queries (scheduled checks) |

---

## Multi-Tenant Rules

### Workspace Isolation

Every business entity carries a `workspaceId` foreign key that references `Workspace.id`. This is the fundamental isolation mechanism.

| Entity | Has workspaceId? | Notes |
|---|---|---|
| WorkspaceSettings | Yes | Direct FK |
| Subscription | Yes | Direct FK |
| WorkspaceMember | Yes | Direct FK |
| Client | Yes | Direct FK |
| ClientMember | Yes | Direct FK (denormalized for query efficiency) |
| Project | Yes | Direct FK |
| Task | No | Scoped via `Project.workspaceId` chain |
| TimeEntry | Yes | Direct FK |
| Invoice | Yes | Direct FK |
| InvoiceLineItem | No | Scoped via `Invoice.workspaceId` chain |
| Invite | Yes | Direct FK |
| AuditLog | Yes | Direct FK |
| Activity | Yes | Direct FK |
| ApiKey | Yes | Direct FK |

### Enforcement Layers

**Layer 1 — Prisma Middleware (Primary):**
A global Prisma middleware intercepts every `findMany`, `findFirst`, `findUnique`, `update`, `updateMany`, `delete`, `deleteMany`, `create`, `createMany`, `count`, `aggregate`, and `groupBy` operation. It injects `where.workspaceId` from the current session context. This is the defense against human error — even if a developer forgets to filter, the middleware applies the scope automatically.

The middleware is stored in `src/lib/multi-tenant.ts` and applied in `src/lib/prisma.ts` when creating the Prisma client singleton. For entities without a direct `workspaceId` (Task, InvoiceLineItem), the middleware must resolve the ID through the parent chain (Project or Invoice).

**Layer 2 — Route-Level Role Verification (Secondary):**
After the middleware scopes data to the workspace, route guards and Server Actions verify the user's role within that workspace via the `WorkspaceMember` table. A user may belong to multiple workspaces; the middleware scopes to the active workspace, and the role check determines which operations are permitted.

**Layer 3 — Postgres Row-Level Security (Future, Defense-in-Depth):**
RLS policies are planned but not implemented in v1. They would mirror the middleware logic at the database level, providing protection even if an application bug bypasses the middleware.

### Client Portal Isolation

Client portal users (userType = CLIENT) are NOT scoped via `WorkspaceMember`. Instead, they are scoped via `ClientMember`, which links a User to a specific Client record. This means:
- A CLIENT user can only see data belonging to their linked Client
- The portal middleware resolves client access via `ClientMember` not `WorkspaceMember`
- Even if a CLIENT user authenticates, they cannot access workspace-level data or any other client's data
- The `ClientMember.workspaceId` denormalized field enables direct workspace-scoped queries without joining through Client

### Soft-Delete Rule

No entity is ever hard-deleted. All entities have a `deletedAt` timestamp:
- A query with a value in `deletedAt` is considered deleted
- All user-facing queries filter `WHERE deletedAt IS NULL`
- A background purge job (configurable retention period, default 90 days) performs the actual DELETE
- Financial records (Invoice, InvoiceLineItem, TimeEntry) have indefinite retention — never purged

---

## Audit Requirements

### Entities Requiring Audit Logging

Every mutation to the following entities must write an `AuditLog` record. The audit log captures the action, the acting user, the affected entity, and contextual metadata.

| Entity | Audited Actions | Metadata Captured |
|---|---|---|
| **Invoice** | `invoice.created`, `invoice.sent`, `invoice.marked_paid`, `invoice.voided`, `invoice.overdue_flag`, `invoice.deleted` | Previous status, new status, total amount |
| **WorkspaceMember** | `member.invited`, `member.role_changed`, `member.removed`, `ownership.transferred` | Previous role, new role, target user ID |
| **Client** | `client.deleted` (soft), `client.status_changed` | Previous status, new status |
| **Project** | `project.deleted` (soft) | Project name, client name |
| **User** | `user.signed_up`, `user.invite_accepted` | Signup method (email/Google) |
| **Subscription** | `subscription.plan_changed`, `subscription.canceled`, `subscription.expired` | Previous plan, new plan, reason |

### Non-Audited Mutations

The following are intentionally NOT audited to avoid log noise:

| Entity | Rationale |
|---|---|
| **Task** CRUD | High frequency, low compliance value. Covered by Activity feed instead. |
| **TimeEntry** CRUD | High volume (daily time tracking). Status transitions (submit/approve/reject) may be audited in a future iteration if compliance requirements emerge. |
| **Client** create/update | Lower sensitivity. Only deletion and status changes are audited. |
| **Project** create/update | Lower sensitivity. Only deletion is audited. |

### Audit Log Characteristics

| Property | Value |
|---|---|
| Retention | Indefinite (never purged) |
| Mutability | Immutable — no update, no delete |
| Index | `(workspaceId, createdAt)` for feed queries, `(workspaceId, entityType, entityId)` for per-entity history |
| Size limit | `metadata` JSON field — consider max 4KB per entry |
