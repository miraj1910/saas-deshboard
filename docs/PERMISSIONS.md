# FlowDesk — RBAC Permission Matrix

Four roles within a workspace. Permissions are scoped to the workspace the user belongs to — no cross-tenant access.

---

## Legend

| Symbol | Meaning |
|---|---|
| **C** | Create |
| **R** | Read |
| **U** | Update |
| **D** | Delete |
| **•** | Full access (all 4) |
| • | Specific action (annotated) |
| — | No access |

---

## Matrix

### Workspace

| Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| View settings | R | R | — | — |
| Update branding (name, logo, color) | U | — | — | — |
| Delete workspace | D | — | — | — |
| Manage subscription/billing | U | — | — | — |

### WorkspaceMember (Team)

| Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| List members | R | R | — | — |
| Invite new member | C | — | — | — |
| Change member role | U | — | — | — |
| Remove member | D | — | — | — |
| View own membership | R | R | R | — |

### Client (CRM)

| Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| Create client | C | C | C | — |
| View all clients | R | R | R (assigned only) | — |
| View own client record | — | — | — | R |
| Update client details | U | U | U (own) | — |
| Archive/delete client | D | U (archive only) | — | — |
| Change client status | U | U | — | — |

### ClientUser (Portal Users)

| Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| Invite client to portal | C | C | — | — |
| List portal users | R | R | — | — |
| Deactivate portal user | U | — | — | — |
| Manage own portal profile | — | — | — | U |

### Project

| Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| Create project | C | C | C | — |
| View all projects | R | R | R (assigned/own) | — |
| View own projects | — | — | — | R |
| Update project details | U | U | U (own) | — |
| Update hourly rate | U | — | — | — |
| Change project status | U | U | U (own) | — |
| Delete project | D | — | — | — |

### Task

| Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| Create task | C | C | C (own projects) | — |
| View all tasks | R | R | R (assigned/own projects) | — |
| View project tasks | — | — | — | R |
| Update any task | U | U | — | — |
| Update own assigned task | — | — | U | — |
| Assign task to any member | U | U | — | — |
| Delete task | D | D | D (own) | — |

### TimeEntry

| Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| Start/stop timer | C | C | C | — |
| Manually log time | C | C | C | — |
| View own time entries | R | R | R | — |
| View team time entries | R | R | — | — |
| Submit timesheet for approval | U | U | U | — |
| Approve/reject submitted entries | U | U | — | — |
| Request revision | U | U | — | — |
| Edit own draft entries | U | U | U | — |
| Edit/delete any entry | U/D | — | — | — |

### Invoice

| Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| Generate invoice from time | C | — | — | — |
| Send invoice to client | U | — | — | — |
| Mark as paid | U | — | — | — |
| View all invoices | R | R | — | — |
| View own invoices | — | — | R | — |
| View invoices billed to me | — | — | — | R |
| Void/cancel invoice | U | — | — | — |
| Delete draft invoice | D | — | — | — |

### InvoiceLineItem

| Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| Add line items | C | — | — | — |
| View invoice breakdown | R | R | R (own) | R |
| Update line items (draft only) | U | — | — | — |
| Remove line items (draft only) | D | — | — | — |

### Reports & Dashboard

| Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| View personal dashboard | R | R | R | R |
| View workspace dashboard (revenue, utilization) | R | R | — | — |
| View project profitability report | R | R | — | — |
| View team utilization report | R | R | — | — |

### Permissions Management

| Action | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| View role of self | R | R | R | R |
| View role of others | R | R | — | — |
| Change own role | — | — | — | — |
| Change other's role | U | — | — | — |

---

## Permission Inheritance & Isolation Rules

1. **Scoped visibility** — TEAM_MEMBER sees only projects they created or are assigned to, and clients linked to those projects.
2. **Manager elevation** — MANAGER permission is additive to TEAM_MEMBER; a Manager retains the ability to log their own time and create their own projects.
3. **Ownership override** — OWNER bypasses all scope restrictions within their workspace. There are no immutable records for the Owner.
4. **Client isolation** — CLIENT sees only projects and invoices where their Client record is the billing party. They cannot see other clients, team members, time entries, or internal notes.
5. **Delete protection** — Only OWNER can permanently delete entities. MANAGER and TEAM_MEMBER actions are limited to status transitions (archive, cancel, complete).

---

## Role Assignment Rules

| Rule | Detail |
|---|---|
| One OWNER per workspace | The user who creates the workspace is the initial OWNER. Ownership can be transferred to another workspace member. |
| OWNER demotion | An OWNER can demote themselves to MANAGER only after transferring ownership. |
| MANAGER promotion | Only OWNER can promote a TEAM_MEMBER to MANAGER. |
| Self-service | No user can change their own role. |
| Client role | CLIENT role is assigned via ClientUser creation — it is not a WorkspaceMember role. Client accounts are scoped to a single Client record. |
| Maximum roles | One user can hold only one role per workspace but may belong to multiple workspaces with different roles. |

---

## Permission Enforcement Boundaries

```
Workspace A                    Workspace B
┌─────────────────────┐       ┌─────────────────────┐
│  OWNER   → full         │       │  MANAGER     → limited  │
│  MANAGER → elevated     │       │  TEAM_MEMBER → own only │
│  TEAM_MEMBER → own only │       │  CLIENT      → read     │
│  CLIENT  → read     │       └─────────────────────┘
└─────────────────────┘
        ⇡                         ⇡
   No cross-tenant            No cross-tenant
   access allowed             access allowed
```

All authorization checks must verify both the user's role and the resource's `workspace_id` before granting access.
