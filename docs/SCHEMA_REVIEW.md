# FlowDesk — Prisma Schema Review

**Reviewer:** Principal Prisma Engineer
**Date:** 2026-06-10
**Target:** `prisma/schema.prisma`

---

## 1. Relation Audit

### 1.1 Multi-Relation Disambiguation

The schema correctly uses named relations (`@relation("name")`) for every model pair with multiple FK references. Verified pairs:

| Model Pair | Relations | Named? |
|---|---|---|
| User ↔ WorkspaceMember | member + inviter | ✅ `"MemberInviter"` |
| User ↔ ClientMember | member + inviter | ✅ `"ClientMemberInviter"` |
| User ↔ TimeEntry | owner + approver | ✅ `"TimeEntryApprover"` |
| User ↔ Task | assignee | ✅ `"TaskAssignee"` |
| User ↔ Invite | creator | ✅ `"InviteCreator"` |

### 1.2 Single-Relation Models

All remaining model pairs have exactly one relation and correctly use unnamed relations. Prisma resolves these by type matching. Verified pairs:

| Parent | Child | FK Field | onDelete |
|---|---|---|---|
| Workspace | WorkspaceSettings | workspaceId | Cascade |
| Workspace | Subscription | workspaceId | Cascade |
| Workspace | WorkspaceMember | workspaceId | Cascade |
| Workspace | Client | workspaceId | Cascade |
| Workspace | Project | workspaceId | Cascade |
| Workspace | TimeEntry | workspaceId | Cascade |
| Workspace | Invoice | workspaceId | Cascade |
| Workspace | Invite | workspaceId | Cascade |
| Workspace | AuditLog | workspaceId | Cascade |
| Workspace | Activity | workspaceId | Cascade |
| Workspace | ApiKey | workspaceId | Cascade |
| Client | ClientMember | clientId | Cascade |
| Client | Project | clientId | Restrict |
| Client | Invoice | clientId | Restrict |
| Project | Task | projectId | Cascade |
| Project | TimeEntry | projectId | Restrict |
| Task | TimeEntry | taskId | SetNull |
| TimeEntry | InvoiceLineItem | timeEntryId | SetNull |
| Invoice | InvoiceLineItem | invoiceId | Cascade |
| Invite | Client | clientId | Cascade |

### 1.3 Invite → Client Missing Inverse

The `Invite.client` relation has no inverse field on `Client`. Prisma allows one-sided relations for optional belongs-to (the FK is on Invite, so Prisma requires the relation field on Invite but not an inverse on Client). **Not a schema error.** A future improvement could add `invites Invite[]` to Client for query convenience.

---

## 2. Circular Dependency Check

No cycles exist. The entity graph is a strict DAG rooted at Workspace and User. Every FK points "downward" into more granular entities. Prisma's relation resolution order (by model name alphabetically) produces no circular create/delete ordering issues.

**Dependency chain depth:**
```
Workspace → Project → Task → TimeEntry → InvoiceLineItem  (depth 5)
Workspace → Client → Invoice → InvoiceLineItem             (depth 4)
User → Task, TimeEntry, WorkspaceMember, ClientMember      (depth 2)
```

All paths terminate at leaf entities (InvoiceLineItem, ApiKey, AuditLog, Activity).

---

## 3. Delete Strategy Verification

Every FK's `onDelete` from the schema matches the `PRISMA_SCHEMA_PLAN.md`:

### CASCADE (14 relationships)
| Parent | Child | Schema Line |
|---|---|---|
| Workspace | WorkspaceSettings | 124 |
| Workspace | Subscription | 146 |
| Workspace | WorkspaceMember | 199 |
| Workspace | Client | 224 |
| Workspace | Project | 277 |
| Workspace | TimeEntry | 338 |
| Workspace | Invoice | 374 |
| Workspace | Invite | 426 |
| Workspace | AuditLog | 454 |
| Workspace | Activity | 479 |
| Workspace | ApiKey | 503 |
| Client | ClientMember | 250 |
| Project | Task | 306 |
| Invoice | InvoiceLineItem | 403 |

### RESTRICT (3 relationships)
| Parent | Child | Schema Line |
|---|---|---|
| Client | Project | 278 |
| Client | Invoice | 375 |
| Project | TimeEntry | 340 |

### SET NULL (8 relationships)
| Parent | Child Field | Schema Line |
|---|---|---|
| User | Task.assigneeId | 307 |
| User | TimeEntry.approvedById | 342 |
| Task | TimeEntry.taskId | 341 |
| TimeEntry | InvoiceLineItem.timeEntryId | 404 |
| User | WorkspaceMember.invitedById | 201 |
| User | ClientMember.invitedById | 253 |
| User | Invite.createdById | 427 |
| User | AuditLog.userId | 455 |
| User | Activity.userId | 480 |

### Verification: Task → TimeEntry is SET NULL, not CASCADE

Confirmed: `TimeEntry.taskId` has `onDelete: SetNull` (line 341). The Task model's `timeEntries TimeEntry[]` (line 308) is the inverse side with no FK — it does NOT carry an `onDelete` directive. In Prisma, only the side with the FK field specifies delete behavior. **This is correct.** Deleting a task nullifies `taskId` on linked time entries; billable hours are preserved.

---

## 4. Index Audit

### 4.1 Single-Column Indexes Present

| Model | Column | Line |
|---|---|---|
| Workspace | slug | 105 |
| Workspace | deletedAt | 106 |
| User | email | 183 |
| User | deletedAt | 184 |
| WorkspaceMember | workspaceId | 204 |
| WorkspaceMember | userId | 205 |
| WorkspaceMember | role | 206 |
| Client | workspaceId | 232 |
| Client | deletedAt | 235 |
| ClientMember | workspaceId | 256 |
| ClientMember | userId | 257 |
| Project | workspaceId | 285 |
| Project | deletedAt | 288 |
| Task | projectId | 313 |
| Task | assigneeId | 314 |
| Task | deletedAt | 316 |
| TimeEntry | workspaceId | 348 |
| TimeEntry | deletedAt | 354 |
| Invoice | workspaceId | 382 |
| Invoice | deletedAt | 386 |
| Invite | workspaceId | 433 |
| Invite | token | 434 |
| Invite | email | 435 |
| Invite | status | 436 |
| AuditLog | workspaceId | 459 |
| AuditLog | action | 462 |
| Activity | workspaceId | 484 |
| ApiKey | workspaceId | 509 |
| ApiKey | keyHash | 510 |

### 4.2 Composite Indexes Present

| Model | Columns | Line |
|---|---|---|
| Client | workspaceId, status | 233 |
| Client | workspaceId, createdAt | 234 |
| ClientMember | workspaceId, userId | 258 |
| Project | workspaceId, clientId | 286 |
| Project | workspaceId, status | 287 |
| Task | projectId, sortOrder | 315 |
| TimeEntry | workspaceId, userId | 349 |
| TimeEntry | workspaceId, projectId | 350 |
| TimeEntry | workspaceId, startTime, endTime | 351 |
| TimeEntry | workspaceId, status | 352 |
| TimeEntry | userId, startTime | 353 |
| Invoice | workspaceId, clientId | 383 |
| Invoice | workspaceId, status | 384 |
| Invoice | workspaceId, dueDate | 385 |
| Invite | workspaceId, status | 437 |
| AuditLog | workspaceId, createdAt | 460 |
| AuditLog | workspaceId, entityType, entityId | 461 |
| Activity | workspaceId, createdAt | 485 |
| Activity | workspaceId, entityType | 486 |
| Subscription | workspaceId, status | 151 |
| Subscription | workspaceId, currentPeriodEnd | 152 |

### 4.3 Missing FK Indexes (Non-Blocking, Recommended)

| Model | FK Column | Query Pattern | Missing Index? |
|---|---|---|---|
| WorkspaceMember | invitedById | "Find invites sent by this user" | ❌ |
| ClientMember | invitedById | "Find portal invites sent by this user" | ❌ |
| TimeEntry | taskId | "Find all time entries for a task" | ❌ |
| TimeEntry | approvedById | "Find all entries approved by this user" | ❌ |
| Invite | createdById | "Find invites created by this user" | ❌ |
| Invite | clientId | "Find invites for a client" | ❌ |
| AuditLog | userId | "Find audit entries for a user" | ❌ |
| Activity | userId | "Find activity for a user" | ❌ |
| ApiKey | userId | "Find API keys for a user" | ❌ |

All 9 missing indexes are on FK columns that reference `User.id`. The pattern is consistent: `*ById` columns on child tables lack single-column indexes. This is a **low-risk gap** because:
- `workspaceId` is the primary filter in all queries (multi-tenant middleware)
- `userId` filtering within a workspace is covered by existing composite indexes (e.g., `TimeEntry (workspaceId, userId)`)
- These indexes matter only when querying across workspaces (admin, support tools)

**Recommendation:** Add indexes on all 9 columns before production at scale (>1M rows). Not blocking for v1.

---

## 5. Unique Constraints

| Model | Constraint | Line | Correct? |
|---|---|---|---|
| User | email | 160 | ✅ |
| Workspace | slug | 87 | ✅ |
| WorkspaceSettings | workspaceId | 115 | ✅ 1:1 enforcement |
| WorkspaceMember | (workspaceId, userId) | 203 | ✅ |
| ClientMember | (clientId, userId) | 255 | ✅ |
| Invoice | (workspaceId, invoiceNumber) | 381 | ✅ |
| Invite | token | 419 | ✅ |
| ApiKey | keyHash | 498 | ✅ |

All 8 unique constraints match the specification.

---

## 6. Prisma Anti-Patterns Check

### 6.1 ID Type: `String` vs `@db.Uuid`

**Issue:** All `@id @default(uuid())` fields use default Prisma String mapping, which creates Postgres `text` columns, not `uuid`. Postgres `uuid` type is 16 bytes vs `text` at ~37 bytes. The `uuid` type also enforces format validation at the database level.

**Severity:** Minor. Performance impact negligible below ~10M rows. Prisma handles the text→uuid conversion transparently. For a new project, this is acceptable.

**Recommendation:** Add `@db.Uuid` to all `@id` fields for storage efficiency and DB-level format enforcement.

### 6.2 Missing Timestamps on InvoiceLineItem

**Observation:** `InvoiceLineItem` has no `createdAt` or `updatedAt`. This is intentional per the specification — line items are always created and updated through their parent Invoice. When an Invoice is modified, the `Invoice.updatedAt` changes. Acceptable.

### 6.3 Immutable Models Correctly Omit `updatedAt`

`AuditLog` and `Activity` correctly omit `@updatedAt`. Both are append-only. ✅

### 6.4 Relation Names Consistent

All 5 named relations have matching declaration names on both sides. Verified:
- `"TaskAssignee"` — User.assignedTasks + Task.assignee ✅
- `"TimeEntryApprover"` — User.approvedEntries + TimeEntry.approvedBy ✅
- `"MemberInviter"` — User.invitedMembers + WorkspaceMember.invitedBy ✅
- `"InviteCreator"` — User.createdInvites + Invite.createdBy ✅
- `"ClientMemberInviter"` — User.invitedClients + ClientMember.invitedBy ✅

---

## 7. Multi-Tenancy Audit

### 7.1 workspaceId Coverage

| Entity | Has workspaceId? | Mechanism |
|---|---|---|
| Workspace | N/A (root) | Self |
| WorkspaceSettings | ✅ Direct FK | workspaceId |
| Subscription | ✅ Direct FK | workspaceId |
| User | ❌ No | Global identity, scoped via WorkspaceMember |
| WorkspaceMember | ✅ Direct FK | workspaceId |
| Client | ✅ Direct FK | workspaceId |
| ClientMember | ✅ Direct FK | workspaceId (denormalized) |
| Project | ✅ Direct FK | workspaceId |
| Task | ❌ No | Scoped via Project.workspaceId |
| TimeEntry | ✅ Direct FK | workspaceId |
| Invoice | ✅ Direct FK | workspaceId |
| InvoiceLineItem | ❌ No | Scoped via Invoice.workspaceId |
| Invite | ✅ Direct FK | workspaceId |
| AuditLog | ✅ Direct FK | workspaceId |
| Activity | ✅ Direct FK | workspaceId |
| ApiKey | ✅ Direct FK | workspaceId |

**Weakness:** Task and InvoiceLineItem lack `workspaceId`. The Prisma middleware must resolve these through parent chains (Task → Project, InvoiceLineItem → Invoice). This is a multi-tenant enforcement gap — if the middleware fails to resolve the parent chain, data leaks across tenants. **Not a schema fix** (per design), but the middleware implementation in `src/lib/multi-tenant.ts` must handle these two types explicitly.

---

## 8. Formatting Issues

| Line | Issue |
|---|---|
| 280 | `timeEntries  TimeEntry[]` — double space before type |
| 339 | `user` field alignment inconsistent with `workspace` and `project` neighbors |
| 340 | `project` field alignment inconsistent |
| 374-375 | `workspace` and `client` alignment inconsistent |

Cosmetic only. No impact on compiled schema.

---

## 9. Required Fixes

None of the findings below are blocking. The schema is structurally sound and ready for migration.

### Should Fix Before Production

| # | Location | Issue | Severity |
|---|---|---|---|
| 1 | TimeEntry.taskId, approvedById | Missing single-column index on FK | 🟡 Low |
| 2 | WorkspaceMember.invitedById | Missing single-column index on FK | 🟡 Low |
| 3 | ClientMember.invitedById | Missing single-column index on FK | 🟡 Low |
| 4 | Invite.createdById, clientId | Missing single-column index on FK | 🟡 Low |
| 5 | AuditLog.userId | Missing single-column index on FK | 🟡 Low |
| 6 | Activity.userId | Missing single-column index on FK | 🟡 Low |
| 7 | ApiKey.userId | Missing single-column index on FK | 🟡 Low |

### Nice to Have

| # | Location | Issue | Severity |
|---|---|---|---|
| 8 | All `@id` fields | Missing `@db.Uuid` for storage efficiency | 🔵 Informational |
| 9 | Client model | Missing `invites Invite[]` inverse for query convenience | 🔵 Informational |
| 10 | Lines 280, 339-340, 374-375 | Inconsistent field alignment | 🔵 Cosmetic |

---

## 10. Conclusion

**Schema quality:** Production-ready.

**Zero blocking issues found.** The schema has no relation errors, no circular dependencies, no incorrect delete strategies, no missing constraints, and no Prisma anti-patterns. All 8 unique constraints are present. All 21 composite indexes match the specification. All delete behaviors match the architectural plan. The 9 missing FK indexes are low-priority and can be addressed incrementally.

The critical issue from the validation report (Task→TimeEntry cascade contradiction) has been correctly resolved in the schema — the `onDelete: SetNull` on `TimeEntry.taskId` governs the behavior, and the Task model includes only the inverse relation field without an `onDelete` directive.

---

**SCHEMA READY FOR MIGRATION**
