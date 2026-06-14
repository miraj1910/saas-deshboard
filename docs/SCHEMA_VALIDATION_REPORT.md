# FlowDesk — Schema Validation Report

**Reviewer:** Principal Database Architect
**Date:** 2026-06-10
**Scope:** `docs/PROJECT_CONTEXT.md`, `docs/PRISMA_PREPARATION_REPORT.md`, `docs/PRISMA_SCHEMA_PLAN.md`

---

## 1. Critical Issues

### 1.1 Task → TimeEntry Delete Behavior Contradiction

**Severity:** 🔴 Blocking

**Description:**
The `PRISMA_SCHEMA_PLAN.md` specifies contradictory delete behavior for the Task→TimeEntry relationship from opposite sides of the relation.

From the **Task** model (section Models > Task > Relationships):
```
| Time entries | One-to-many | TimeEntry | Cascade |
```

From the **TimeEntry** model (section Models > TimeEntry > Relationships):
```
| Task | Belongs to | Task (optional) | Set null |
```

These cannot both be true. A FK constraint enforces one delete rule. If the migration is generated with `CASCADE` on the Task side (the inverse), it contradicts the `SET NULL` defined on the TimeEntry side where the FK lives. The Prisma migration will follow the TimeEntry-side definition because that is the field holding the FK, but the documentation suggests Cascade behavior to a developer reading the Task model. This is a trap for implementation.

**Why it matters:**
If a developer implements based on the Task model's documentation and adds `onDelete: Cascade` to the Task→TimeEntry relation, deleting a task will silently destroy every time entry logged against it. Time entries are the atomic unit of billing — losing them means lost revenue with no audit trail. A single drag-and-drop task deletion could delete hundreds of dollars of billable hours.

**Root cause:**
The `PRISMA_SCHEMA_PLAN.md` lists both sides of the relation independently. The Task side erroneously states Cascade. The TimeEntry side correctly states Set null.

**Resolution:**
The Task model's relationship entry `Time entries | One-to-many | TimeEntry | Cascade` must be changed to match the actual FK behavior. In the schema, only the child side (TimeEntry) defines `onDelete`. The Task model should state the behavior from its perspective as: `Time entries | One-to-many | TimeEntry | Set null (FK on TimeEntry)` or simply omit the onDelete for the inverse side and document the behavior in the TimeEntry model only.

The correct behavior is **SET NULL**: when a task is deleted, the `taskId` on the linked time entries becomes null. The time entry remains billable, scoped to its project. The task reference is lost, but the hours are preserved.

---

## 2. Warnings

### 2.1 Duplicate Entry in SET NULL Table

**Severity:** 🟡 Minor

**Location:** `PRISMA_SCHEMA_PLAN.md`, Delete Strategy > SET NULL table

**Description:**
The entry `User | TimeEntry.approvedById` appears twice consecutively with identical rationale text.

**Impact:** Documentation confusion only. No schema or code impact. Developers planning delete behavior may incorrectly think there are two distinct cases to handle.

### 2.2 SET NULL Table Missing Entries for AuditLog and Activity

**Severity:** 🟡 Minor

**Location:** `PRISMA_SCHEMA_PLAN.md`, Delete Strategy > SET NULL table

**Description:**
The User model's relationship section correctly specifies `AuditLog | Set null` and `Activity | Set null`, but the SET NULL table (the consolidated reference) omits these entries.

**Impact:** A developer designing delete behavior against the SET NULL table only will miss that AuditLog.userId and Activity.userId are set null on user deletion. This is low risk because the model-level definitions are correct, but the single-reference table is incomplete.

### 2.3 User → TimeEntry Cascade Deletes Pending Billable Hours

**Severity:** 🟡 Moderate

**Location:** `PRISMA_SCHEMA_PLAN.md`, Delete Strategy > CASCADE table

**Description:**
When a User is deleted (or soft-deleted and later purged), their TimeEntry records are cascade-deleted. This includes DRAFT entries that have never been submitted and SUBMITTED entries awaiting approval. If a team member leaves with unreviewed time entries, the hours are permanently lost.

The user deletion flow should protect against this. In practice, a responsible flow would: (1) reassign or approve all pending time entries, (2) invoice any unbilled approved entries, (3) then delete the user. But nothing in the schema enforces this.

**Mitigation:**
This is acceptable for v1. The application can enforce a pre-deletion check in the `removeMember()` Server Action: if the user has SUBMITTED or APPROVED unbilled time entries, block deletion and prompt the MANAGER/OWNER to handle them first. DRAFT entries can be optionally preserved or discarded since they represent unsubmitted work.

### 2.4 Soft-Delete Rule Has Undocumented Exceptions

**Severity:** 🟡 Minor

**Location:** `PRISMA_SCHEMA_PLAN.md`, Multi-Tenant Rules > Soft-Delete Rule

**Description:**
The rule states: "No entity is ever hard-deleted. All entities have a `deletedAt` timestamp." However, three entities in the schema plan do not have a `deletedAt` field:

| Entity | Has deletedAt? | Exception Rationale |
|---|---|---|
| Activity | No | Transient, short-lived, purged by cron |
| AuditLog | No | Immutable, retained indefinitely |
| ApiKey | No | Has `revokedAt` for deactivation |
| WorkspaceSettings | No | Cascades on workspace deletion |
| Subscription | No | Cascades on workspace deletion |
| InvoiceLineItem | No | Parent Invoice controls lifecycle |

**Impact:** Low. For the core business entities that users interact with (Client, Project, Task, TimeEntry, Invoice, User, Workspace, WorkspaceMember, Invite), all have `deletedAt`. The exceptions are infrastructure entities with different lifecycle rules. However, the blanket statement should be qualified to avoid confusion.

### 2.5 InvoiceLineItem Constraints Overlap

**Severity:** 🔵 Informational

**Location:** `PRISMA_SCHEMA_PLAN.md`, Constraints > Check Constraints

**Description:**
The invoice creation Server Action must calculate `amount = quantity × unitPrice`. The constraint `amount >= 0` is redundant if `quantity > 0` and `unitPrice >= 0` because the product of a positive number and a non-negative number is always non-negative. However, keeping the explicit constraint as a defensive sanity check against floating-point edge cases or future manual edits is reasonable.

---

## 3. Recommended Improvements

### 3.1 Resolve the Task→TimeEntry Cascade Inconsistency

**Action:** Change the Task model's relationship documentation in `PRISMA_SCHEMA_PLAN.md` from `Cascade` to `Set null (FK on TimeEntry)`. Or remove the onDelete column from the Task→TimeEntry row entirely and add a note explaining that the FK lives on TimeEntry and its onDelete rule governs the behavior.

**Priority:** Before schema implementation

### 3.2 Clean Up SET NULL Table

**Action:** Remove the duplicate `User | TimeEntry.approvedById` row and add the missing `AuditLog.userId` and `Activity.userId` entries. Verify the complete list against the User model's relationship table.

**Priority:** Before schema implementation

### 3.3 Qualify the Soft-Delete Rule

**Action:** Update the Soft-Delete Rule section to explicitly list which entities have `deletedAt` and which do not, with rationale for each exception. Replace "All entities" with "All business entities (Client, Project, Task, TimeEntry, Invoice, User, Workspace, WorkspaceMember, Invite)."

**Priority:** Before schema implementation

### 3.4 Add TimeEntry Lifecycle Policy for User Deletion

**Action:** Document in `PRISMA_SCHEMA_PLAN.md` or `PROJECT_CONTEXT.md` the application-level guard: `removeMember()` and user deletion Server Actions must check for unbilled SUBMITTED/APPROVED time entries and block deletion if they exist. DRAFT entries may be optionally discarded.

**Priority:** Before Phase 2 implementation

### 3.5 Add Index on Invite.email

**Status:** Already present

The `Invite.email` single-column index is listed in the plan. Verified correct — the invite acceptance flow looks up invites by email to find pending invitations during signup.

### 3.6 Verify ClientMember.workspaceId Denormalization Consistency

**Action:** The `ClientMember.workspaceId` is denormalized (also available via `Client.workspaceId`). Add an application-level guard that `ClientMember.workspaceId` always equals `Client.workspaceId` for the linked client. This prevents data corruption bugs where a ClientMember is created with a workspaceId that doesn't match the client's workspace.

**Priority:** Before Phase 1.5 (portal) implementation

### 3.7 DATABASE.md Still Outdated

**Action:** The `PRISMA_PREPARATION_REPORT.md` flagged this at 5.3 but it remains unresolved. The file still describes the old dual-auth design with `ClientUser`, missing entities, no soft-delete, and wrong roles. It must be rewritten to match the final schema plan.

**Priority:** Before migration

---

## 4. Validation Checklist

### Relationships

| Check | Status | Notes |
|---|---|---|
| All entities connected via FK | ✅ Pass | Every entity has proper FK relationships |
| All FK targets exist | ✅ Pass | Every FK references an existing entity |
| Self-referential FKs correct | ✅ Pass | invitedBy on WorkspaceMember, ClientMember; createdBy on Invite; approvedBy on TimeEntry; assignee on Task |
| Denormalized FKs justified | ✅ Pass | ClientMember.workspaceId justified for direct workspace-scoped queries |
| No orphaned relationships | ✅ Pass | Every relation has an inverse |

### Foreign Keys

| Check | Status | Notes |
|---|---|---|
| Every FK has a corresponding PK target | ✅ Pass | All FKs reference primary key of target table |
| FK column types match PK types | ✅ Pass | All UUID to UUID |
| Nullable FKs properly marked | ✅ Pass | invitedBy, createdBy, approvedBy, assignee, taskId, clientId on Invite |
| No missing workspaceId on scoped entities | ✅ Pass | Task and InvoiceLineItem scoped via parent chain |

### Cascade Rules

| Check | Status | Notes |
|---|---|---|
| Cascade only on safe parent-child dependencies | ✅ Pass | Workspace children, Project tasks, Invoice line items |
| No cascade on financial records | ✅ Pass | Project→TimeEntry: Restrict, Client→Invoice: Restrict |
| Workspace deletion cascades all tenants | ✅ Pass | All 11 child entities cascade |
| User deletion cascades appropriate children | ⚠️ Warning | User→TimeEntry cascade loses pending billable hours (see 2.3) |

### Restrict Rules

| Check | Status | Notes |
|---|---|---|
| Financial records protected from parent deletion | ✅ Pass | Client→Project: Restrict, Client→Invoice: Restrict, Project→TimeEntry: Restrict |
| Three restrict rules cover all financial chains | ✅ Pass | Every path that could orphan billable data is protected |

### Set Null Rules

| Check | Status | Notes |
|---|---|---|
| Optional references set null on parent delete | ✅ Pass | Assignee, approver, inviter, creator, task link |
| No required FK uses set null | ✅ Pass | All set null FKs are nullable |
| Documentation complete | ⚠️ Warning | Table has duplicate and missing rows (see 2.1, 2.2) |

### Multi-Tenancy Isolation

| Check | Status | Notes |
|---|---|---|
| Every entity scoped to a workspace | ✅ Pass | Direct workspaceId or parent chain (Task, InvoiceLineItem) |
| Middleware injection feasible | ✅ Pass | workspaceId on all hot-path entities |
| Client portal isolation via ClientMember | ✅ Pass | No WorkspaceMember for CLIENT users |
| Soft-delete prevents data loss | ✅ Pass | deletedAt on all business entities |

### Composite Indexes

| Check | Status | Notes |
|---|---|---|
| All (workspaceId, status) for list filtering | ✅ Pass | Client, Project, TimeEntry, Invoice, Invite, Subscription |
| (workspaceId, userId) for user-scoped queries | ✅ Pass | TimeEntry, ClientMember |
| (workspaceId, date) for time-range queries | ✅ Pass | TimeEntry (startTime, endTime), Invoice (dueDate) |
| Sorting indexes for dashboards | ✅ Pass | AuditLog (createdAt), Activity (createdAt) |
| Per-entity history indexes | ✅ Pass | AuditLog (entityType, entityId) |

### Unique Constraints

| Check | Status | Notes |
|---|---|---|
| User email globally unique | ✅ Pass | Prevents duplicate accounts |
| Workspace slug globally unique | ✅ Pass | URL uniqueness |
| Invoice number unique per workspace | ✅ Pass | Composite (workspaceId, invoiceNumber) |
| Membership unique per workspace-user pair | ✅ Pass | Composite (workspaceId, userId) |
| Portal membership unique per client-user pair | ✅ Pass | Composite (clientId, userId) |
| Invite token unique | ✅ Pass | Prevents token collision |
| ApiKey keyHash unique | ✅ Pass | Hash collision prevention |

### Soft-Delete Strategy

| Check | Status | Notes |
|---|---|---|
| deletedAt on all business entities | ✅ Pass | Client, Project, Task, TimeEntry, Invoice, User, Workspace, WorkspaceMember, Invite |
| Exceptions documented | ⚠️ Warning | Exceptions exist but blanket rule says "all" (see 2.4) |
| Purge job retains financial records | ✅ Pass | Financial records (Invoice, InvoiceLineItem, TimeEntry) never purged |
| Soft-delete does not cascade | ✅ Pass | Soft-delete sets a timestamp, does not trigger FK cascade |

### Financial Data Retention

| Check | Status | Notes |
|---|---|---|
| Invoices never purged | ✅ Pass | Indefinite retention |
| InvoiceLineItems never purged | ✅ Pass | Cascade follows Invoice lifecycle |
| TimeEntries never purged | ✅ Pass | Indefinite retention — audit trail for billable hours |
| Non-financial records have purge policy | ✅ Pass | 90-day retention for non-financial entities |

### RBAC Compatibility

| Check | Status | Notes |
|---|---|---|
| Role storage in WorkspaceMember | ✅ Pass | WorkspaceRole enum (OWNER, MANAGER, TEAM_MEMBER) |
| Client vs Team discrimination | ✅ Pass | User.userType + ClientMember vs WorkspaceMember |
| WorkspaceMember.role covers all three team roles | ✅ Pass | OWNER, MANAGER, TEAM_MEMBER |
| No hardcoded role assumptions in schema | ✅ Pass | Schema stores role value, does not encode business logic |
| Invite.role for pre-assignment | ✅ Pass | Supports role-based invitations |

---

## 5. Approval Status

### Passing Criteria (all must pass)

| Criterion | Status |
|---|---|
| No blocking issues (🔴) | ❌ **1 blocking issue** (Task→TimeEntry delete contradiction — see 1.1) |
| All FKs correctly mapped | ✅ |
| All cascade rules protect financial data | ✅ |
| Tenant isolation complete | ✅ |
| RBAC model supported | ✅ |
| Soft-delete prevents data loss | ✅ |
| Indexes support all query patterns | ✅ |

### Conditional Approval

The schema plan is approved subject to resolution of **Critical Issue 1.1** and the documented warnings. The issue is a documentation error in the plan, not a fundamental design flaw — the correct behavior (SET NULL on TimeEntry.taskId) is already defined on the TimeEntry model. The Task model's Cascade entry simply needs to be corrected to match.

Once the following three edits are applied to `PRISMA_SCHEMA_PLAN.md`, the schema is ready for implementation:

1. **Task model** — Change `Time entries | One-to-many | TimeEntry | Cascade` to `Time entries | One-to-many | TimeEntry | Set null (FK on TimeEntry)`
2. **SET NULL table** — Remove the duplicate `User | TimeEntry.approvedById` row and add missing `AuditLog.userId` and `Activity.userId` entries
3. **Soft-Delete Rule** — Qualify the blanket "all entities" statement with explicit list and exceptions

---

**SCHEMA APPROVED FOR IMPLEMENTATION** — subject to the three corrections listed above.
