# Client Portal Implementation Report

## Overview

Implemented a professional client-facing portal at `/portal`. No subdomains. Clients can view projects, deliverables (tasks), invoices, and submit/ track requests. All data is scoped to the client's workspace and client record.

---

## Files Created

### Schema
| File | Change |
|---|---|
| `prisma/schema.prisma` | Added `RequestStatus` enum and `ClientRequest` model |

### Feature Module
| File | Description |
|---|---|
| `src/features/portal/types.ts` | `PortalProject`, `PortalTask`, `PortalInvoice`, `PortalRequest`, `PortalDashboardData` |
| `src/features/portal/queries.ts` | Client-scoped queries: `getPortalDashboardData`, `getClientProjects`, `getClientProjectById`, `getClientProjectTasks`, `getClientInvoices`, `getClientRequests` |
| `src/features/portal/actions.ts` | `createClientRequest` server action |
| `src/features/portal/components/portal-nav.tsx` | Sidebar navigation (Dashboard, Projects, Invoices, Requests) |

### Portal Layout
| File | Description |
|---|---|
| `src/app/portal/layout.tsx` | Portal layout with sidebar + content area |

### Portal Pages
| File | Description |
|---|---|
| `src/app/portal/page.tsx` | Redirects to `/portal/dashboard` |
| `src/app/portal/dashboard/page.tsx` | Dashboard with KPI cards, recent invoices, recent projects |
| `src/app/portal/dashboard/portal-dashboard.tsx` | Dashboard client component |
| `src/app/portal/projects/page.tsx` | Projects list with cards |
| `src/app/portal/projects/portal-projects-list.tsx` | Projects list client component |
| `src/app/portal/projects/[projectId]/page.tsx` | Project detail with deliverables/tasks |
| `src/app/portal/projects/[projectId]/portal-project-detail.tsx` | Project detail client component |
| `src/app/portal/invoices/page.tsx` | Invoices list with table + outstanding balance |
| `src/app/portal/invoices/portal-invoices-list.tsx` | Invoices list client component |
| `src/app/portal/requests/page.tsx` | Requests list + create form |
| `src/app/portal/requests/portal-requests-page.tsx` | Requests client component with form |

## Files Modified

| File | Change |
|---|---|
| `prisma/schema.prisma` | Added `RequestStatus` enum, `ClientRequest` model, relations on Workspace/Client |
| `src/lib/rbac.ts` | Added `RequestCreate`, `RequestRead`, `RequestUpdate` permissions to all roles |
| `middleware.ts` | Fixed broken template literal; added `/portal` path exemption from workspace slug enforcement |

---

## New Database Model

```prisma
enum RequestStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

model ClientRequest {
  id          String        @id @default(uuid())
  workspaceId String
  clientId    String
  title       String
  description String?
  status      RequestStatus @default(OPEN)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([workspaceId, clientId])
  @@index([workspaceId, clientId, status])
  @@map("client_requests")
}
```

## Portal Pages

### Dashboard (`/portal/dashboard`)
- Welcome message with client name and company
- 4 KPI stat cards: Active Projects, Open Invoices (with amount), Open Requests, Total Projects
- Recent Invoices card (last 5 with status badges)
- Recent Projects card (last 5 with status badges)

### Projects (`/portal/projects`)
- Grid of project cards with name, description, status badge, and due date
- Click through to project detail

### Project Detail (`/portal/projects/[projectId]`)
- Project header with name, description, status
- "Deliverables" section showing tasks (title, description, due date, status badge)
- Back button to projects list

### Invoices (`/portal/invoices`)
- Outstanding balance card (if any SENT/OVERDUE invoices)
- Full table: invoice number, issued date, due date, amount, status badge
- Empty state for no invoices

### Requests (`/portal/requests`)
- "New Request" button to open inline form (title + description)
- Requests displayed as cards with status badges and submission date
- Optimistic UI update after submission
- Empty state with prompt to create first request

---

## RBAC and Authorization

### Client Role Permissions (new additions)
```typescript
CLIENT: [
  R.ClientReadOwn,
  R.ProjectReadClient,
  R.TaskReadClient,
  R.InvoiceReadClient, R.InvoiceDownloadPdf,
  R.RequestCreate, R.RequestRead,        // NEW
  R.ReportPersonal,
],
```

### Authorization Flow
1. Portal pages call `auth()` to get the session
2. Look up `ClientMember` by `userId` to get `workspaceId` and `clientId`
3. All queries filter by both `workspaceId` and `clientId`
4. Project scoping: Clients see only projects where `clientId` matches their record
5. Task scoping: Clients see tasks on their projects (no assignee info exposed)
6. Invoice scoping: Clients see invoices for their client only

### Restrictions Implemented
- **No internal tasks**: Clients see tasks only on their own projects
- **No team data**: Task queries exclude `assignee` info — no team member names or assignments
- **No workspace dashboard**: Portal is entirely separate from the `/[workspaceSlug]` routes
- **No cross-client data**: All queries filter by `clientId`

---

## Middleware Changes

### Bug Fix
Fixed the portal subdomain rewrite template literal (line 20):
```typescript
// BEFORE (broken):
req.nextUrl.pathname = '/(portal)${pathname}'

// AFTER (fixed):
req.nextUrl.pathname = `/(portal)${pathname}`
```

### Portal Path Exemption
Added `/portal` path exemption from the workspace slug enforcement:
```typescript
if (pathname.startsWith('/portal')) {
  if (!session) redirect to login
  return NextResponse.next()  // skip slug enforcement
}
```

This prevents CLIENT users without `workspaceSlug` in their JWT from being redirected by the workspace slug check.

---

## Multi-Tenancy

- All queries filter by `workspaceId` from the client's `ClientMember` record
- All queries additionally filter by `clientId` (the specific client record)
- No cross-workspace or cross-client data leakage

---

## Performance

- **Server components**: All portal pages are server-rendered
- **Parallel queries**: Dashboard runs 3 queries in parallel (`Promise.all`)
- **Client request creation**: Optimistic UI update — new request appears immediately
- **Scoped queries**: Every query filters by `workspaceId` and `clientId` early

---

## Design System

- Uses existing `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- Uses existing `Badge` with status variants (default, success, warning, secondary, outline)
- Uses existing `Button`, `Input`, `Textarea`
- Uses existing `cn()` utility
- Uses `lucide-react` icons: `LayoutDashboard`, `FolderKanban`, `FileText`, `MessageSquare`, `ArrowLeft`, `Plus`, `Loader2`
- Clean sidebar navigation matching the main app's sidebar style

---

## Future Enhancements

1. **Client invite flow**: Build UI for team members to invite CLIENT users (permission `ClientInvitePortal` already exists)
2. **Invoice PDF download**: Wire up `InvoiceDownloadPdf` permission with a download button
3. **Request updates**: Allow clients to add comments/updates to their requests
4. **Project progress**: Show percentage completion based on task status
5. **File attachments**: Allow clients and team members to attach files to requests
6. **Activity feed**: Show recent activity on the client's projects/invoices
7. **Multiple client records**: Handle CLIENT users linked to multiple clients via ClientMember
