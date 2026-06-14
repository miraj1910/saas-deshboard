# FlowDesk — RBAC Plan

**Defines roles, permissions, guards, middleware, and the access matrix for the FlowDesk authorization system.**

---

## Roles

Four roles govern access within a single workspace. Roles are stored on `WorkspaceMember` for team users (`OWNER`, `MANAGER`, `TEAM_MEMBER`) and on `User.userType` for the `CLIENT` role (which uses `ClientMember` instead of `WorkspaceMember`).

| Role | Enum Value | Scope | Max per Workspace |
|---|---|---|---|
| **OWNER** | `WorkspaceRole.OWNER` | Full workspace | Exactly 1 |
| **MANAGER** | `WorkspaceRole.MANAGER` | Workspace-wide, no billing | Unlimited |
| **TEAM_MEMBER** | `WorkspaceRole.TEAM_MEMBER` | Self-scoped (own projects, tasks, time) | Unlimited |
| **CLIENT** | `UserType.CLIENT` | Own client record only | Unlimited per client |

---

## Permission Definitions

Each permission is a string constant used in guards and middleware. Named as `<entity>:<action>`.

### Team & Workspace

| Permission | Description |
|---|---|
| `workspace:read` | View workspace settings (name, slug, branding) |
| `workspace:update` | Update workspace name, branding, timezone, company info |
| `workspace:delete` | Permanently delete the workspace |
| `team:read` | View team member list |
| `team:invite` | Create team invitations |
| `team:change-role` | Change another member's role |
| `team:remove` | Remove a team member |
| `team:transfer-ownership` | Transfer OWNER role to another member |

### Client CRM

| Permission | Description |
|---|---|
| `client:create` | Create a client record |
| `client:read` | View a client record (full details) |
| `client:read-own` | View own client record (CLIENT portal) |
| `client:update` | Update client fields |
| `client:archive` | Transition client status to ARCHIVED |
| `client:delete` | Soft-delete a client record |
| `client:invite-portal` | Invite a user to the client portal |

### Project

| Permission | Description |
|---|---|
| `project:create` | Create a project |
| `project:read` | View any project in the workspace |
| `project:read-own` | View projects you created or are assigned to |
| `project:read-client` | View projects where your client record is the billing party |
| `project:update` | Update any project |
| `project:update-own` | Update projects you created |
| `project:archive` | Transition project status |
| `project:delete` | Soft-delete a project |

### Task

| Permission | Description |
|---|---|
| `task:create` | Create a task on any project |
| `task:create-own` | Create a task on projects you own or are assigned to |
| `task:read` | View any task |
| `task:read-own` | View tasks assigned to you |
| `task:read-client` | View tasks on accessible projects (CLIENT) |
| `task:update` | Update any task |
| `task:update-own` | Update tasks assigned to you |
| `task:delete` | Soft-delete a task |

### Time Entry

| Permission | Description |
|---|---|
| `time:create` | Log time (timer or manual) |
| `time:read` | View any time entry in the workspace |
| `time:read-own` | View own time entries |
| `time:update` | Update any time entry (draft) |
| `time:update-own` | Update own time entries (draft) |
| `time:submit` | Submit own entries for approval |
| `time:approve` | Approve or reject submitted entries |
| `time:delete` | Delete any time entry |
| `time:delete-own` | Delete own draft entries |

### Invoice

| Permission | Description |
|---|---|
| `invoice:create` | Generate invoice from unbilled time entries |
| `invoice:read` | View any invoice |
| `invoice:read-own` | View own invoices (TEAM_MEMBER) |
| `invoice:read-client` | View invoices billed to your client record (CLIENT) |
| `invoice:update` | Edit draft invoice |
| `invoice:send` | Mark invoice as SENT |
| `invoice:mark-paid` | Mark invoice as PAID |
| `invoice:void` | Void/cancel an invoice |
| `invoice:delete` | Soft-delete a draft invoice |
| `invoice:download-pdf` | Download invoice PDF |

### Reports

| Permission | Description |
|---|---|
| `report:personal` | View personal dashboard (own tasks, time, invoices) |
| `report:workspace` | View workspace-wide revenue, utilization reports |
| `report:profitability` | View project profitability drilldown |
| `report:team-utilization` | View team utilization per member |

### Subscription & Billing

| Permission | Description |
|---|---|
| `subscription:read` | View current plan and billing history |
| `subscription:manage` | Change plan, update payment method, cancel |

### Invite

| Permission | Description |
|---|---|
| `invite:create` | Create an invitation |
| `invite:read` | View pending/sent invitations |
| `invite:revoke` | Revoke a pending invitation |

### Audit Log

| Permission | Description |
|---|---|
| `audit:read` | View audit logs for the workspace |

### Activity

| Permission | Description |
|---|---|
| `activity:read` | View in-app activity feed |

### ApiKey (v2)

| Permission | Description |
|---|---|
| `api-key:create` | Generate API keys |
| `api-key:read` | List/view API keys |
| `api-key:revoke` | Revoke API keys |

---

## Permission-to-Role Mapping

| Entity | Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|---|
| **Workspace** | read | ✓ | ✓ | ✓ | — |
| | update | ✓ | — | — | — |
| | delete | ✓ | — | — | — |
| **Team** | read | ✓ | ✓ | ✓ (own only) | — |
| | invite | ✓ | — | — | — |
| | change-role | ✓ | — | — | — |
| | remove | ✓ | — | — | — |
| | transfer-ownership | ✓ | — | — | — |
| **Client** | create | ✓ | ✓ | ✓ | — |
| | read | ✓ | ✓ | ✓ (own scope) | — |
| | read-own | — | — | — | ✓ |
| | update | ✓ | ✓ | ✓ (own scope) | — |
| | archive | ✓ | ✓ | — | — |
| | delete | ✓ | — | — | — |
| | invite-portal | ✓ | ✓ | — | — |
| **Project** | create | ✓ | ✓ | ✓ | — |
| | read | ✓ | ✓ | — | — |
| | read-own | — | — | ✓ | — |
| | read-client | — | — | — | ✓ |
| | update | ✓ | ✓ | — | — |
| | update-own | — | — | ✓ | — |
| | archive | ✓ | ✓ | — | — |
| | delete | ✓ | — | — | — |
| **Task** | create | ✓ | ✓ | — | — |
| | create-own | — | — | ✓ | — |
| | read | ✓ | ✓ | — | — |
| | read-own | — | — | ✓ | — |
| | read-client | — | — | — | ✓ |
| | update | ✓ | ✓ | — | — |
| | update-own | — | — | ✓ | — |
| | delete | ✓ | ✓ | — | — |
| **Time Entry** | create | ✓ | ✓ | ✓ | — |
| | read | ✓ | ✓ | — | — |
| | read-own | — | — | ✓ | — |
| | update | ✓ | ✓ (own only) | — | — |
| | update-own | ✓ | ✓ | ✓ | — |
| | submit | ✓ | ✓ | ✓ | — |
| | approve | ✓ | ✓ | — | — |
| | delete | ✓ | — | — | — |
| | delete-own | ✓ | ✓ | ✓ | — |
| **Invoice** | create | ✓ | — | — | — |
| | read | ✓ | ✓ | — | — |
| | read-own | — | — | ✓ | — |
| | read-client | — | — | — | ✓ |
| | update | ✓ | — | — | — |
| | send | ✓ | — | — | — |
| | mark-paid | ✓ | — | — | — |
| | void | ✓ | — | — | — |
| | delete | ✓ | — | — | — |
| | download-pdf | ✓ | ✓ | ✓ | ✓ |
| **Reports** | personal | ✓ | ✓ | ✓ | ✓ |
| | workspace | ✓ | ✓ | — | — |
| | profitability | ✓ | ✓ | — | — |
| | team-utilization | ✓ | ✓ | — | — |
| **Subscription** | read | ✓ | — | — | — |
| | manage | ✓ | — | — | — |
| **Invite** | create | ✓ | ✓ (portal only) | — | — |
| | read | ✓ | ✓ | — | — |
| | revoke | ✓ | — | — | — |
| **Audit Log** | read | ✓ | — | — | — |
| **Activity** | read | ✓ | ✓ | ✓ | — |
| **ApiKey** | create | ✓ | — | — | — |
| | read | ✓ | — | — | — |
| | revoke | ✓ | — | — | — |

### Global Rules (not role-specific)

- **Deny-by-default**: any action without an explicit ✓ is forbidden.
- **Self-approval prohibited**: no user, regardless of role, can approve their own time entry. Enforced at the application layer.
- **OWNER cannot self-demote**: must transfer ownership to another member first. Enforced at the mutation layer.
- **No self-role-change**: no user can modify their own `WorkspaceMember.role`.
- **TEAM_MEMBER visibility scoped**: sees only projects they created or are assigned to, and clients linked to those projects. Not enforced by a separate permission — enforced at the query layer via `createdBy`/`assigneeId` filters.
- **CLIENT portal isolation**: CLIENT users are authenticated on a separate subdomain. They have no session in the main workspace app.

---

## Guards

Guards are boolean functions that check whether the current user can perform a given action on a given resource. They compose role checks with ownership/scope checks.

### Core Guard Patterns

```
can(user, action, resource?) → boolean
```

### Guard Definitions

| Guard | Logic | Used By |
|---|---|---|
| `requireRole(role)` | `session.user.role === role` | Page layouts, layout-level access |
| `requireAnyRole(...roles)` | `session.user.role in [roles]` | Page layouts with multiple allowed roles |
| `canAccessWorkspace(member)` | `member exists AND not deleted` | All workspace routes |
| `can(action)` | `permissions[role].includes(action)` | All Server Actions |
| `canManageResource(resource, ownerId)` | `can(action) AND (resource.workspaceId === session.workspaceId) AND (ownerId === session.userId OR role === OWNER)` | Own-scoped mutations (TEAM_MEMBER) |
| `canSelfApprove(entryUserId, sessionUserId)` | `entryUserId !== sessionUserId` | Time entry approval |
| `canOwnershipTransfer(currentOwner, targetMember)` | `currentOwner.role === OWNER AND targetMember.role !== OWNER` | Ownership transfer |
| `isSameWorkspace(memberOrResource)` | `memberOrResource.workspaceId === session.activeWorkspaceId` | Tenant isolation, all queries |
| `isOwnClientRecord(client, clientMember)` | `clientMember.clientId === client.id AND clientMember.userId === session.userId` | CLIENT portal access |
| `canEditTimeEntry(entry, user)` | `entry.status === DRAFT AND (can('time:update-own', user) OR can('time:update', user))` | Time entry editing |
| `canDeleteEntity(entity)` | `entity.deletedAt === null AND can(entity:delete)` | Before soft-delete |

### Guard Composition — Server Action Example

```
function createProject(data):
  guard(can('project:create'))
  guard(isSameWorkspace({ workspaceId: data.workspaceId }))
  // … continue with mutation
```

---

## Middleware

Middleware runs at two layers: **Edge Middleware** (`middleware.ts` in the Next.js edge runtime) and **Prisma Middleware** (`src/lib/multi-tenant.ts` in the Node.js runtime).

### 1. Edge Middleware (Request Pipeline)

Runs on every request before it reaches the page or API handler.

```
Request → [Middleware] → Page/Action
```

**Middleware Steps:**

1. **Subdomain detection**
   - If host is `client.flowdesk.io` → rewrite to `/(portal)` routes
   - If host is `app.flowdesk.io` or custom domain → continue normally
   - Apply workspace slug routing

2. **Auth check**
   - If session exists → attach `session.user` and `session.activeWorkspaceId`
   - If no session and route requires auth → redirect to `/login`
   - If no session and route is public (login, signup, landing) → allow

3. **Workspace resolution**
   - Extract `:slug` from URL path
   - Look up workspace by slug
   - If workspace not found → 404
   - Validate user is a member (`WorkspaceMember` for TEAM roles, `ClientMember` for CLIENT roles)
   - Attach `workspaceId` to the request context

4. **Client portal guard**
   - If route is under `/(portal)`:
     - Ensure session.userType === `CLIENT`
     - Ensure ClientMember links user to the requested client record
     - Ensure route matches allowed portal routes list
   - If any check fails → 403 or redirect to portal login

5. **Route-level role guard**
   - Page-level access is enforced in the workspace layout via `requireRole` / `requireAnyRole`
   - Layout reads session and renders an error state if the user lacks page-level permission

### 2. Prisma Middleware (Data Access Layer)

Runs on every Prisma query to enforce tenant isolation.

```
Query → [Prisma Middleware] → Database
```

**Middleware Logic:**

1. **Read/Find operations:** Inject `workspaceId` filter if the model has a `workspaceId` field (or reaches one through a relation — Task → Project, InvoiceLineItem → Invoice).
2. **Create operations:** Ensure the created record's `workspaceId` matches the session's `activeWorkspaceId`.
3. **Update/Delete operations:** Validate the record belongs to the correct workspace before allowing mutation.
4. **Soft-delete awareness:** For queries that should exclude soft-deleted records, inject `deletedAt: null` filter automatically.
5. **Scope enforcement for TEAM_MEMBER:** For models where access is scoped (Project, Task, Client), inject additional filters (`createdById`, `assigneeId`) when the session role is `TEAM_MEMBER`.

### 3. Server Action Guard Layer (Application Layer)

Executed inside each Server Action before any business logic.

```
Action → [Guard Functions] → [Business Logic] → Database
```

Each Server Action calls one or more guard functions (defined above) before proceeding. This is the primary enforcement point for fine-grained permissions.

---

## Access Matrix

Consolidated view of which role can access each route group and perform each major operation.

### Page-Level Access (by route group)

| Route Group | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| `/(marketing)/*` | ✓ (no auth) | ✓ (no auth) | ✓ (no auth) | ✓ (no auth) |
| `/(auth)/*` | ✓ (no auth) | ✓ (no auth) | ✓ (no auth) | ✓ (no auth) |
| `/:slug/dashboard` | ✓ | ✓ | ✓ | — |
| `/:slug/dashboard/reports` | ✓ | ✓ | — | — |
| `/:slug/clients/*` | ✓ | ✓ | ✓ (own only) | — |
| `/:slug/projects/*` | ✓ | ✓ | ✓ (own only) | — |
| `/:slug/time/*` | ✓ | ✓ | ✓ | — |
| `/:slug/time/approvals/*` | ✓ | ✓ | — | — |
| `/:slug/invoices/*` | ✓ | ✓ | — | — |
| `/:slug/team/*` | ✓ | ✓ (view only) | — | — |
| `/:slug/settings/*` | ✓ | — | — | — |
| `/account/*` | ✓ | ✓ | ✓ | ✓ |
| `/(portal)/*` | — | — | — | ✓ |

### Mutation-Level Access (by Server Action)

| Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| signup | ✓ | — | — | — |
| acceptInvite | ✓ | ✓ | ✓ | ✓ |
| createClient | ✓ | ✓ | ✓ | — |
| updateClient | ✓ | ✓ | ✓ (own scope) | — |
| archiveClient | ✓ | ✓ | — | — |
| deleteClient | ✓ | — | — | — |
| invitePortalUser | ✓ | ✓ | — | — |
| createProject | ✓ | ✓ | ✓ | — |
| updateProject | ✓ | ✓ | ✓ (own scope) | — |
| changeProjectStatus | ✓ | ✓ | — | — |
| deleteProject | ✓ | — | — | — |
| createTask | ✓ | ✓ | ✓ (own projects) | — |
| updateTask | ✓ | ✓ | ✓ (own) | — |
| reorderTasks | ✓ | ✓ | ✓ (own projects) | — |
| deleteTask | ✓ | ✓ | — | — |
| startTimer | ✓ | ✓ | ✓ | — |
| stopTimer | ✓ | ✓ | ✓ | — |
| createTimeEntry | ✓ | ✓ | ✓ | — |
| updateTimeEntry | ✓ | ✓ (own) | ✓ (own draft) | — |
| deleteTimeEntry | ✓ | — | ✓ (own draft) | — |
| submitTimeEntry | ✓ | ✓ | ✓ | — |
| approveTimeEntry | ✓ | ✓ | — | — |
| rejectTimeEntry | ✓ | ✓ | — | — |
| createInvoice | ✓ | — | — | — |
| updateInvoice | ✓ | — | — | — |
| sendInvoice | ✓ | — | — | — |
| markInvoicePaid | ✓ | — | — | — |
| voidInvoice | ✓ | — | — | — |
| deleteInvoice | ✓ | — | — | — |
| inviteMember | ✓ | — | — | — |
| changeMemberRole | ✓ | — | — | — |
| removeMember | ✓ | — | — | — |
| transferOwnership | ✓ | — | — | — |
| updateWorkspace | ✓ | — | — | — |
| updateWorkspaceSettings | ✓ | — | — | — |
| updateProfile | ✓ | ✓ | ✓ | ✓ |
| changePassword | ✓ | ✓ | ✓ | ✓ |
| updateClientProfile | — | — | — | ✓ |

---

## Implementation Notes

### Authorization Flow Diagram

```
                    ┌──────────────────────┐
                    │   Edge Middleware      │
                    │  • subdomain check     │
                    │  • session check       │
                    │  • workspace resolve   │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Workspace Layout    │
                    │  • role-based guard  │
                    │  • 403 if denied     │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Server Action       │
                    │  • can() guard        │
                    │  • isSameWorkspace()  │
                    │  • ownership check    │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Prisma Middleware     │
                    │  • workspaceId inject  │
                    │  • scope filters      │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │      Database         │
                    └──────────────────────┘
```

### Key Enforcement Points

| Layer | Technology | Enforces |
|---|---|---|
| Edge | `middleware.ts` | Subdomain routing, auth session, workspace resolution |
| Layout | React Server Component | Page-level role gating (visible/hidden routes) |
| Action | Guard functions in `src/lib/rbac.ts` | Fine-grained permission checks per mutation |
| Data | Prisma middleware | Tenant isolation (`workspaceId`), TEAM_MEMBER scope |
| Database | PostgreSQL (future RLS) | Defense-in-depth — row-level security policies |

### Self-Approval Prohibition

Hard-coded in the `approveTimeEntry` Server Action:

```
guard(can('time:approve'))
guard(entry.userId !== session.userId, 'Self-approval is not permitted')
```

This is enforced at the application layer, not just the data layer, to provide clear error messaging.

### Ownership Transfer Constraint

The `transferOwnership` action:
1. Verifies the requesting user's role is OWNER
2. Verifies the target member exists in the same workspace and is not already OWNER
3. In a single transaction: set current OWNER to MANAGER, set target to OWNER
4. Writes an AuditLog entry

### CLIENT vs TEAM Authorization Paths

| Aspect | TEAM (OWNER/MANAGER/TEAM_MEMBER) | CLIENT |
|---|---|---|
| Auth table | `WorkspaceMember` | `ClientMember` + `User.userType` |
| Session type | Workspace session | Portal session |
| Subdomain | `app.flowdesk.io/:slug` | `client.flowdesk.io` |
| Tenant scope | Entire workspace | Single client record |
| Page routes | `/(workspace)/*` | `/(portal)/*` |
| Data scope | Workspace-wide or own-scoped | Own client, projects, invoices |

### Permission Cache Strategy

- Permissions are derived from `WorkspaceMember.role` at session creation time
- Role is stored in the session JWT and checked against the database for critical mutations
- A separate `permissions` utility in `src/lib/rbac.ts` maps role → set of permission strings
- This mapping is a plain object — no database call required for permission checks
- For TEAM_MEMBER scope checks, the resource's `createdById` or `assigneeId` is queried alongside the permission

### Audit Log Triggers

The following actions always write to `AuditLog`:

| Action | Entity | Detail |
|---|---|---|
| Role change | WorkspaceMember | Old role → new role, who changed it |
| Member removed | WorkspaceMember | Member ID, by whom |
| Ownership transfer | Workspace | Previous OWNER → new OWNER |
| Invoice sent | Invoice | Invoice ID, timestamp |
| Invoice paid | Invoice | Amount, who recorded payment |
| Invoice voided | Invoice | Who voided, reason |
| Client deleted | Client | Client ID, who deleted |
| Invite revoked | Invite | Invite ID, who revoked |
| Workspace deleted | Workspace | Who deleted, timestamp |
| API key created/revoked (v2) | ApiKey | Key name, who acted |

### Scope Enforcement for TEAM_MEMBER

TEAM_MEMBER has "own scope" access to clients, projects, and tasks. This is implemented as:

- **Client**: TEAM_MEMBER can read/update clients linked to projects they created or are assigned to. Query filter: `client.projects.some(project => project.createdById === userId OR project.tasks.some(task => task.assigneeId === userId))`.
- **Project**: TEAM_MEMBER can read/update projects they created or are assigned to. Query filter: `project.createdById === userId OR project.tasks.some(task => task.assigneeId === userId)`.
- **Task**: TEAM_MEMBER can read/update tasks assigned to them. Query filter: `task.assigneeId === userId`.

For create operations, TEAM_MEMBER can create clients and projects freely (they become the "owner" by default), but can only create tasks on projects they own or are assigned to.

---

## Summary

| Concern | Implementation |
|---|---|
| Role storage | `WorkspaceMember.role` (OWNER, MANAGER, TEAM_MEMBER), `User.userType` (CLIENT) |
| Permission mapping | `src/lib/rbac.ts` — plain object: `Record<Role, Set<Permission>>` |
| Guard functions | `src/lib/rbac.ts` — composable boolean functions |
| Edge middleware | `middleware.ts` — subdomain, auth, workspace resolution |
| Route guards | Workspace layout — `requireRole` / `requireAnyRole` |
| Data layer isolation | Prisma middleware — auto-inject `workspaceId` |
| Server Action enforcement | Guard calls at top of each action |
| Scope (TEAM_MEMBER) | Query-level filters on `createdById` / `assigneeId` |
| Scope (CLIENT) | Separate subdomain, `ClientMember` join, portal-only routes |
| Hard rules | Self-approval blocked, self-role-change blocked, single OWNER |
