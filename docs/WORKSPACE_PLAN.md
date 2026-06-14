# FlowDesk — Workspace Management Plan

**Status:** Draft
**Target:** Next.js 15 App Router, Prisma, PostgreSQL

---

## 1. Workspace Creation

### Entry Points

| Entry Point | Trigger | What Happens |
|---|---|---|
| `/signup` (credentials or Google) | First-time user signs up | Creates User + Workspace + WorkspaceSettings + Subscription + WorkspaceMember (OWNER) |
| Direct workspace creation from `/account/workspaces` | Existing user wants a second workspace | Creates Workspace + WorkspaceSettings + Subscription + WorkspaceMember (OWNER) — but only on PRO/AGENCY plans |

### Bootstrap Sequence

Every workspace creation follows this exact order:

```
1. Validate plan limits (FREE plan = 1 workspace per user)
2. Generate unique slug from user-provided name
3. Create Workspace (id, name, slug)
4. Create WorkspaceSettings (1:1 — defaults: timezone=UTC, primaryColor=#6366F1)
5. Create Subscription (plan=FREE, status=TRIALING, 14-day trial)
6. Create WorkspaceMember (userId=creator, role=OWNER)
7. If signup flow → sign in via Auth.js, redirect to /onboarding
8. If secondary workspace → redirect to /{slug}/dashboard
```

### Slug Generation Algorithm

```
Input: workspace name string

1. Lowercase and trim
2. Replace whitespace runs with single hyphen
3. Remove all non-alphanumeric characters except hyphens
4. Collapse consecutive hyphens
5. Strip leading/trailing hyphens
6. If empty result → default to "workspace"
7. Truncate to 50 characters
8. Append 4-char random suffix (a-z0-9)
9. Check uniqueness in DB — if collision, retry with new suffix (max 5 attempts)
10. On 5th collision → append timestamp hash
```

**Why suffix:** User-visible slugs improve URL readability ("sarahs-agency-a3f1" vs "uuid-a3f1k2d9"). The suffix guarantees uniqueness without burdening the user to find an unused name.

**Slug immutability:** Slug is set at creation and never changes. If the workspace name is updated, the slug stays the same. This prevents broken bookmarks, shared links, and invite tokens that embed the slug.

### Onboarding Wizard (Post-Creation)

```
Step 1: Welcome → pre-filled workspace name from signup, optional company info
Step 2: Solo or Agency →
  - Solo → skip to step 3
  - Agency → inline team member invites (email + role selector)
Step 3: Done → token.onboardingComplete = true, redirect to /{slug}/dashboard
```

The `onboardingComplete` flag is stored in the Auth.js JWT token and updated via the `update` trigger on the `jwt` callback. The middleware redirects to `/onboarding` until this flag is true.

---

## 2. Workspace Switching

### Current Workspace Resolution

Every authenticated route under `/:slug/*` resolves the workspace from the URL slug. The middleware extracts the slug and injects it as the `X-Workspace-Slug` request header.

### Single-Workspace Users (v1 Default)

Most v1 users have exactly one workspace. On login:
- If user has 1 WorkspaceMember → JWT stores `workspaceSlug`, middleware auto-redirects to `/{slug}/dashboard`
- If user has 0 WorkspaceMember → middleware redirects to `/onboarding`

### Multi-Workspace Users (v2 Feature)

| Scenario | Behavior |
|---|---|
| 1 workspace | Auto-redirect to `/{slug}/dashboard` |
| 2+ workspaces | Show workspace picker at `/account/workspaces` on login |
| Visiting another workspace's slug directly | If user is a member → render; if not → 403 or redirect to default |

### Workspace Picker (`/account/workspaces`)

Displays a list of all workspaces the user belongs to:

```
┌─────────────────────────────────────┐
│  Your Workspaces                     │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ★ FlowDesk Demo        OWNER   ││
│  │  flowdesk-demo                  ││
│  │  [Open] [Settings]              ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ ☆ Personal Projects   MEMBER   ││
│  │  personal-proj                  ││
│  │  [Open]                         ││
│  └─────────────────────────────────┘│
│                                     │
│  [+ Create Workspace]               │
└─────────────────────────────────────┘
```

### Switching Mechanics

1. User navigates to `/{new-slug}/dashboard`
2. Middleware detects slug change from JWT's `workspaceSlug`
3. If user is a member of the new workspace → allow, inject new `X-Workspace-Slug`
4. If not a member → redirect to user's default workspace
5. All subsequent Server Actions read the slug from the request header
6. No full page reload — Next.js client-side navigation handles the transition

### Session Token Update

When switching workspaces, the JWT token is updated via `update` trigger:

```
auth()  // Available in server components via auth()
signIn(undefined, { redirect: false })  // Triggers jwt callback with trigger='update'
```

This refreshes `token.workspaceSlug` for the middleware.

---

## 3. Slug Routing

### URL Structure

```
/{slug}/dashboard
/{slug}/clients
/{slug}/clients/:clientId
/{slug}/projects
/{slug}/projects/:projectId
/{slug}/time
/{slug}/invoices
/{slug}/team
/{slug}/settings
```

### Middleware Slug Handling

```
Request: /acme-corp/clients

1. Extract "acme-corp" from pathname via regex /^\/([^/]+)/
2. Look up user's JWT:
   - If token.workspaceSlug === "acme-corp" → member verified, pass through
   - If different → redirect to token.workspaceSlug dashboard
3. Inject X-Workspace-Slug header for downstream Server Actions
4. Pass to page component which renders workspace-scoped content
```

### Workflow for Resolving workspaceId

Server Actions and data queries need `workspaceId`, not the slug. The resolution chain is:

```
Middleware: slug → header
Server Action: header → prisma.workspace.findUnique({ where: { slug } }) → workspaceId
Prisma Middleware: inject workspaceId into all queries
```

**Caching:** The slug-to-id lookup is cached per-request (React cache) so it only runs once even when multiple Server Actions fire.

### Client Portal Subdomain

```
Host: client.flowdesk.io
→ Middleware rewrites to /(portal)/*  (no slug in URL)
→ Portal pages use clientMember context, not workspace slug
→ Workspace is inferred from the Client record linked to the logged-in user
```

### Edge Cases

| Case | Handling |
|---|---|
| Invalid slug in URL | 404 — workspace not found |
| Valid slug, user not a member | Redirect to user's workspace or workspace picker |
| Slug matches another workspace name | No collision possible — slugs are unique at DB level |
| Slug with special chars | Generated client-side to only contain `[a-z0-9-]`, URL-safe |
| Trailing slash | Next.js normalizes, no special handling needed |

---

## 4. Membership Creation

### Entry Points

| Method | Who Can Do It | How |
|---|---|---|
| Signup (new workspace) | Anyone | Auto-creates OWNER membership during registration |
| Team invite | OWNER only | Send invite email → recipient accepts → WorkspaceMember created |
| Direct invite from team UI | OWNER only | Form: email + role → Invite created → email sent |
| Workspace creation (existing user) | User with PRO/AGENCY plan | Creates OWNER membership for the creator |
| Transfer ownership | Current OWNER | Swaps roles between OWNER and target MANAGER |

### Invite Flow

```
1. OWNER fills invite form: email + role (MANAGER or TEAM_MEMBER)
2. Server Action: inviteMember(workspaceId, email, role)
   a. Check sender has OWNER role
   b. Check plan limits (FREE = 1 user, PRO = 5 users)
   c. Check email not already a member of this workspace
   d. Create Invite record (token=randomHex(32), status=PENDING, expiresAt=7 days)
   e. Send email via Resend with /invite/{token} link
```

### Invite Acceptance

```
Scenario A: Recipient has an existing account
1. Recipient clicks /invite/{token} → if logged in, auto-accept
2. Server Action: acceptInvite(token)
   a. Validate token: exists, status=PENDING, not expired
   b. Check user is not already a member of this workspace
   c. Create WorkspaceMember (role from invite, invitedById=creator)
   d. Mark invite as ACCEPTED, set acceptedAt
   e. Redirect to /{slug}/dashboard

Scenario B: Recipient is new
1. Recipient clicks /invite/{token} → sees workspace name + signup form
2. Server Action: acceptInvite(token, name, password)
   a. Validate token as above
   b. Create User (userType=TEAM)
   c. Create WorkspaceMember + mark invite ACCEPTED
   d. Sign in via Auth.js
   e. Redirect to /{slug}/dashboard

Scenario C: Client portal invite
1. Recipient clicks /invite/{token} → sees client name + set-password form
2. Server Action: acceptClientInvite(token, name, password)
   a. Validate token: has clientId, status=PENDING, not expired
   b. Create User (userType=CLIENT)
   c. Create ClientMember (links User to Client)
   d. Mark invite ACCEPTED
   e. Sign in, redirect to client.flowdesk.io/portal/dashboard
```

### Membership Data

| Field | Source | Notes |
|---|---|---|
| workspaceId | From resolved workspace | Set at creation |
| userId | From accepting user | Set at acceptance |
| role | From Invite record | Set by OWNER at invite time |
| joinedAt | `new Date()` | Auto-set |
| invitedById | From Invite.createdBy | Tracks who invited them |

### Remove Member

```
OWNER removes a member:
1. Validate: target is not the OWNER (cannot remove self without transfer)
2. Delete WorkspaceMember record (not soft-delete — membership removal is permanent)
3. All assigned tasks' assigneeId remain (SetNull on User delete cascades)
4. Time entries remain linked to the User record (not deleted)
5. Audit log: "OWNER removed {name} ({email}) from workspace"
```

**Note:** The User record itself is never deleted — only the WorkspaceMember link. This means the user's time entries, created clients, and audit trail persist. If the user is re-invited, a new WorkspaceMember is created with the same userId.

---

## 5. Ownership Rules

### Invariants

| Rule | Enforcement |
|---|---|
| Exactly one OWNER per workspace | Application-level — checked on role change and transfer |
| OWNER cannot be deleted/removed | Only transferred |
| OWNER cannot change own role | Application-level — checked in role change action |
| First member is always OWNER | Guaranteed by the signup/creation flow |
| Only OWNER can transfer ownership | Checked in transferOwnership action |
| Transfer requires target to be MANAGER | The new owner must already hold MANAGER role |

### Ownership Transfer Flow

```
1. OWNER navigates to /{slug}/team/transfer-ownership
2. Selects target member from list of MANAGERs
3. Confirmation dialog: "Transfer ownership to {name}? You will become a MANAGER."
4. Server Action: transferOwnership(memberId)
   a. Validate sender is OWNER
   b. Validate target is MANAGER
   c. Begin transaction:
      - Update sender's WorkspaceMember: role → MANAGER
      - Update target's WorkspaceMember: role → OWNER
   d. Audit log: "Ownership transferred from {sender} to {target}"
   e. Update JWT token (trigger='update') to refresh roles
```

**Why target must be a MANAGER:** Prevents accidental transfer to a TEAM_MEMBER who hasn't demonstrated the capacity to manage the workspace. The current OWNER should first promote the target to MANAGER if they aren't already.

### What Happens If the Owner Leaves

| Scenario | Handling |
|---|---|
| Owner wants to leave | Must transfer ownership first — no "remove my own membership" action |
| Owner is unresponsive | No automated recovery in v1. Manual intervention via support (v2: email verification flow) |
| Owner deletes their User account | Not possible in v1 (account deletion is a future feature) |
| Owner's subscription expires | Workspace becomes read-only for all members until plan is reactivated |

### Role Change Restrictions

| From | To | Allowed? |
|---|---|---|
| OWNER | MANAGER | Only via ownership transfer |
| OWNER | TEAM_MEMBER | Only via ownership transfer |
| MANAGER | OWNER | Only via ownership transfer initiated by current OWNER |
| MANAGER | TEAM_MEMBER | Yes (OWNER can demote) |
| TEAM_MEMBER | MANAGER | Yes (OWNER can promote) |
| Any | Same role | No-op, rejected |
| Self | Any | Denied — no user can change their own role |

---

## 6. Workspace Deletion Strategy

### Approach: Soft-Delete + Grace Period

Workspaces are never hard-deleted from the database. Instead, a two-phase approach is used:

```
Phase 1: Soft-delete (immediate)
Phase 2: Hard-delete cleanup (async, after grace period)
```

### Phase 1: Soft-Delete

```
Who: OWNER only
Action: POST /{slug}/settings (deleteWorkspace action)

1. Validate sender is OWNER
2. Require confirmation: "Delete {name}? This cannot be undone."
3. Set Workspace.deletedAt = new Date()
4. All cascading entities remain in DB (deletedAt is NOT cascade-set)
5. Audit log: "Workspace {name} ({slug}) deleted by {userId}"
6. Redirect to /account/workspaces
7. Session's workspaceSlug is cleared
```

After soft-delete:
- All existing data is preserved in the database
- Login attempts for users with only this workspace → redirected to create new workspace
- Routes `/{slug}/*` return 410 Gone
- Invite links for this workspace show "Workspace no longer available"
- Client portal for this workspace's clients returns 410

### Phase 2: Grace Period (30 Days)

During the 30-day recovery window:
- Only the previous OWNER can access the workspace (special bypass)
- A "Restore Workspace" button is available on `/account/workspaces`
- Restore action: `Workspace.deletedAt = null`
- All data is immediately available as before
- Audit log: "Workspace {name} ({slug}) restored by {userId}"

### Phase 3: Hard Delete (After 30 Days)

A scheduled job runs daily:

```
SELECT id FROM Workspace WHERE deletedAt < NOW() - INTERVAL '30 days'
```

For each expired workspace:
1. Iterate through all related entities (all cascade-delete relationships)
2. Delete in dependency order (InvoiceLineItem → Invoice → TimeEntry → ...)
3. Delete WorkspaceSettings, Subscription, WorkspaceMember, Client, Invite, AuditLog, Activity
4. Delete Workspace
5. Note: User records are NOT deleted — they survive workspace deletion

### What Persists Forever

| Entity | After Workspace Delete |
|---|---|
| User records | Survive — user can create a new workspace |
| Workspace | Soft-deleted for 30 days, then hard-deleted |
| All workspace-scoped entities | Cascade-deleted with workspace |

### Recovery UI

```
/account/workspaces (for users with deleted workspace):

┌─────────────────────────────────────┐
│  Deleted Workspaces                  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ⚠ Acme Agency                   ││
│  │  Deleted June 5, 2026           ││
│  │  Expires July 5, 2026           ││
│  │  [Restore] [Permanently Delete]  ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### API Key & Subscription Cleanup

On soft-delete:
- Stripe subscription (if active) → canceled
- No new charges processed
- All API keys → revoked (revokedAt set)

On hard-delete:
- Final Stripe webhook cleanup if needed

---

## 7. Multi-Tenant Enforcement

### Database Layer

Every business entity has a `workspaceId` column. Prisma middleware automatically injects `workspaceId` filters:

```
// src/lib/multi-tenant.ts (conceptual)
prisma.$use(async (params, next) => {
  const tenantModels = ['client', 'project', 'timeEntry', 'invoice', /* ... */]
  if (tenantModels.includes(params.model) && params.action.startsWith('find') || params.action === 'create') {
    // workspaceId is extracted from the request context (AsyncLocalStorage or headers)
    params.args.where = { ...params.args.where, workspaceId: getCurrentWorkspaceId() }
  }
  return next(params)
})
```

### Application Layer

- Every Server Action extracts the slug from `X-Workspace-Slug` header
- Resolves to `workspaceId` via `prisma.workspace.findUnique({ where: { slug } })`
- Passes `workspaceId` to all data-access functions
- Role checks verify the user is a WorkspaceMember for the resolved workspace

### Defense in Depth (Future)

PostgreSQL Row-Level Security policies as a second layer:

```
CREATE POLICY tenant_isolation ON client
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid);
```

This ensures that even a malformed query from the application layer cannot leak data across tenants.

---

## 8. Server Actions

| Action | Route | Who | Description |
|---|---|---|---|
| `createWorkspace(name)` | settings | Any user with plan capacity | Creates secondary workspace |
| `updateWorkspace(data)` | settings | OWNER | Updates workspace name |
| `deleteWorkspace()` | settings | OWNER | Soft-deletes workspace |
| `restoreWorkspace(workspaceId)` | account | Previous OWNER | Restores deleted workspace |
| `inviteMember(email, role)` | team | OWNER | Sends team invite |
| `acceptInvite(token, name?, password?)` | auth | Invitee | Joins workspace |
| `changeMemberRole(memberId, role)` | team | OWNER | Changes a member's role |
| `transferOwnership(memberId)` | team | OWNER | Transfers ownership |
| `removeMember(memberId)` | team | OWNER | Removes member from workspace |
| `getWorkspaces()` | account | Any | Lists user's workspaces |

---

## 9. Error Handling

| Scenario | Error | Response |
|---|---|---|
| Signup with existing email | `EMAIL_EXISTS` | Return to signup form with "An account with this email already exists" |
| Invite to existing member | `ALREADY_MEMBER` | Show "User is already a member of this workspace" |
| Invite when at plan limit | `PLAN_LIMIT` | Show "Upgrade to add more team members" |
| Transfer to non-MANAGER | `INVALID_TARGET` | Show "Target must be a MANAGER" |
| Delete workspace with active subscription | `ACTIVE_SUBSCRIPTION` | Show "Cancel your subscription before deleting" (v2) |
| Access deleted workspace | `WORKSPACE_DELETED` | 410 Gone with "This workspace has been deleted" |
| Expired invite token | `INVITE_EXPIRED` | Show "This invite has expired. Ask your workspace owner for a new one." |
| Slug collision (during creation) | Retry automatically | User never sees the error — handled by retry loop |

---

## 10. Open Questions

| Question | Decision Needed By | Notes |
|---|---|---|
| How do we handle the case where the last OWNER leaves without transferring? | v1.5 | Automated transfer after 30-day inactivity? Requires email verification. |
| Should slug be changeable? | v1 | Not in v1 — changing slug would break all existing links. Possible v2 with redirect. |
| Workspace merger? Two workspaces into one? | v2 | Unlikely but asked by users with multiple free accounts. |
| Billing on workspace deletion — refund? | v2 | Prorated refund for remaining subscription days? |
| Multiple owners? | v2 | Current model is single-owner. "Co-owner" role with subset of OWNER permissions? |
| Can a user belong to the same workspace twice? | v1 | No — enforced by unique(workspaceId, userId) constraint. |
