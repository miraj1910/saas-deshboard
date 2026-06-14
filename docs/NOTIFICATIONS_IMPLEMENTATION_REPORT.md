# In-App Notification System Implementation Report

## Overview

Implemented a database-persisted, workspace-scoped in-app notification system. No email, no WebSockets — all notifications are stored in the database and displayed via a dropdown in the top navigation bar.

---

## Files Created

### Schema (Prisma)
| File | Description |
|---|---|
| `prisma/schema.prisma` | Added `NotificationType` enum and `Notification` model |
| `prisma/migrations/20260612180017_add_notifications/` | Migration for the new model |

### Feature Module
| File | Description |
|---|---|
| `src/features/notifications/types.ts` | `NotificationItem` and `NotificationsData` types |
| `src/features/notifications/queries.ts` | `getNotifications`, `getUnreadCount`, `getNotificationById` |
| `src/features/notifications/_actions.ts` | `markAsRead`, `markAllAsRead` server actions |

### Utility
| File | Description |
|---|---|
| `src/lib/notifications.ts` | `createNotification` — internal server-side helper used by action triggers |

### UI Components
| File | Description |
|---|---|
| `src/features/notifications/components/notification-dropdown.tsx` | Bell icon badge + dropdown list with mark-as-read |

### API
| File | Description |
|---|---|
| `src/app/api/notifications/route.ts` | GET endpoint for fetching notifications + unread count |

## Files Modified

| File | Change |
|---|---|
| `src/components/layout/top-nav.tsx` | Replaced static Bell button with `<NotificationDropdown />` |
| `src/features/tasks/_actions.ts` | Added notification trigger on `createTask` and `updateTask` with assignee |
| `src/features/projects/_actions_tasks.ts` | Added notification trigger on `createTask` and `updateTask` with assignee |
| `src/features/projects/_actions.ts` | Added notification trigger on project completion (notifies all members) |
| `src/features/invoices/_actions.ts` | Added notification trigger on `markPaid` (notifies all members) |
| `src/features/time-tracking/_actions.ts` | Added notification trigger on `approveTimeEntry` (notifies entry owner) |
| `src/features/clients/_actions.ts` | Added notification trigger on `createClient` (notifies all members) |

## Notification Model

```prisma
enum NotificationType {
  TASK_ASSIGNED
  PROJECT_COMPLETED
  INVOICE_PAID
  TIME_ENTRY_APPROVED
  CLIENT_CREATED
}

model Notification {
  id          String           @id @default(uuid())
  workspaceId String
  userId      String           // recipient
  type        NotificationType
  title       String
  message     String?
  link        String?          // deep link to relevant page
  readAt      DateTime?        // null = unread
  actorId     String?          // user who caused the notification
  metadata    Json?
  createdAt   DateTime         @default(now())
}
```

**Indexes**: `[workspaceId, userId, readAt]`, `[workspaceId, userId, createdAt]`, `[userId, readAt]`

## Event Triggers

| Event | Trigger Location | Recipients | Notification Content |
|---|---|---|---|
| **Task Assigned** | `tasks/_actions.ts` — `createTask` + `updateTask` | The assignee (if different from actor) | `"You were assigned to '{task title}'"` with project name and link to project |
| **Task Assigned** | `projects/_actions_tasks.ts` — `createTask` + `updateTask` | The assignee (if different from actor) | Same as above (duplicated for the two task action paths) |
| **Project Completed** | `projects/_actions.ts` — `updateProject` when status → COMPLETED | All workspace members (except actor) | `"'{project name}' has been completed"` with link to project |
| **Invoice Paid** | `invoices/_actions.ts` — `markPaid` | All workspace members (except actor) | `"Invoice {number} has been paid"` with client name, amount, and link |
| **Time Entry Approved** | `time-tracking/_actions.ts` — `approveTimeEntry` | The entry owner | `"Your time entry has been approved"` with description and hours |
| **Client Created** | `clients/_actions.ts` — `createClient` | All workspace members (except actor) | `"'{client name}' has been added as a client"` with link to clients page |

## RBAC and Authorization

### Notification Access
- **Notification dropdown**: Uses the session user — users can only see their own notifications
- **API route**: Validates workspace membership before returning data; resolves `workspaceSlug` to `workspaceId` internally
- **Server actions** (`markAsRead`, `markAllAsRead`): Use `getAuthorizedSession()` and validate the notification belongs to the requesting user's workspace

### Trigger Injection
- Notification triggers are added **after** all authorization checks pass in the existing action files
- No new permission checks are needed — the original action's authorization handles access control
- The `createNotification` helper is internal and does **not** perform authorization (callers are already authorized)

## Multi-Tenancy

- Every notification is scoped to a `workspaceId`
- All queries filter by `workspaceId` AND `userId` — no cross-workspace or cross-user data leakage
- The API route resolves `workspaceSlug` → `workspaceId` and validates membership

## Performance

- **No N+1**: Bulk notifications (project completed, invoice paid, client created) use `findMany` to get members followed by `Promise.all` for notification creation
- **Efficient queries**: `getUnreadCount` uses `count` with indexed fields
- **Client-side fetching**: Notifications are fetched via a single API call when the dropdown is opened (lazy loading)
- **Indexed**: Three composite indexes cover the query patterns

## UI Behavior

- **Bell icon**: Shows unread count badge (capped at "99+")
- **Dropdown**: Shows last 10 notifications, each with:
  - Type-specific icon (colored/highlighted for unread)
  - Title + optional message
  - Relative timestamp ("2m ago", "3h ago", etc.)
  - Blue dot indicator for unread
- **Mark as read**: Clicking a notification marks it read (via server action) and navigates to the linked page
- **Mark all read**: Button in the dropdown header marks all unread as read
- **Empty state**: "No notifications yet" with muted bell icon
- **Loading state**: Skeleton placeholders while data loads

## Architecture Decisions

1. **No email integration**: Explicitly excluded per requirements
2. **No WebSockets**: Notifications are fetched on demand when the dropdown opens, or on initial render
3. **Database persistence**: All notifications stored in PostgreSQL via the `Notification` model — survives page refreshes
4. **Client API route**: The dropdown fetches from `/api/notifications` rather than being server-rendered into the layout, avoiding the need to pass props through the layout hierarchy
5. **Separate helper library**: `createNotification` in `lib/notifications.ts` is a standalone utility importable by any action file, avoiding circular dependencies and code duplication

## Future Enhancements

1. **Notification preferences**: Per-user toggle for each notification type
2. **Notification center page**: Full page with pagination, filters, and read/unread management
3. **Realtime updates**: Add SSE or WebSocket push for instant badge updates
4. **Notification grouping**: Group "5 tasks assigned" into a single notification
5. **Client portal notifications**: Extend to CLIENT user type for invoice and project updates
6. **Push notifications**: Browser push API integration
