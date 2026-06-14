# Projects Feature Implementation Report

## Overview

The complete Projects feature has been implemented: list page with CRUD, detail page with task management. All new code reuses existing backend logic (Prisma models, queries, server actions, Zod schemas, RBAC). No business logic was duplicated; task server actions were the only new backend layer created since none existed.

## Files Created

### `src/features/tasks/_actions.ts`
- Task server actions: `createTask`, `updateTask`, `deleteTask`, `reorderTasks`
- Reuses `createTaskSchema`, `updateTaskSchema`, `reorderTasksSchema` from `src/features/projects/schemas.ts`
- Reuses `findTaskById`, `getMaxSortOrder`, `listTasksByProject`, `findProjectById` from `src/features/projects/queries.ts`
- Uses `createWorkspaceContext` from `src/lib/authorization.ts` for auth
- Respects RBAC: `TaskCreate`/`TaskCreateOwn`, `TaskUpdate`/`TaskUpdateOwn`, `TaskDelete`
- Enforces scoped access for `TEAM_MEMBER` role (own tasks only)
- Validates assignee is a workspace member before assignment

### `src/components/ui/select.tsx`
- Native `<select>` styled to match the existing `Input` component (same border, padding, shadow)
- Used for client dropdown (project create), status dropdowns, assignee dropdowns
- Follows same forwardRef pattern as other UI components

### `src/components/ui/textarea.tsx`
- Native `<textarea>` with matching Input styling (border, padding, shadow, ring)
- Follows same forwardRef pattern

### `src/app/(workspace)/[workspaceSlug]/projects/page.tsx`
- Server component for the projects list route
- Awaits `params` (Next.js 15 requirement)
- Fetches workspace by slug, creates auth context
- Fetches active clients for the project create form dropdown
- Checks `ProjectCreate`, `ProjectUpdate`, `ProjectArchive` permissions
- Passes flags and client list to `ProjectsList` client component

### `src/features/projects/components/projects-list.tsx`
- Client component implementing full projects list with search, create, edit, archive
- **Table columns**: Name (linked to detail page), Client, Status (badge), Budget (hourly rate), Deadline, Task count, Actions
- **Search**: Client-side filtering by name and client name
- **Create dialog**: Fields for name, client (select), description, hourly rate, start/due dates
- **Edit dialog**: Fields for name, description, hourly rate, status (select), start/due dates. Client is read-only (displayed, not changeable)
- **Archive dialog**: Confirmation with note that tasks/time entries are preserved
- **States**: Loading spinner, empty state, empty search state, field-level Zod errors, action-level errors
- **RBAC**: Buttons hidden per `canCreate`/`canEdit`/`canArchive`; edit/archive hidden for `ARCHIVED` projects

### `src/app/(workspace)/[workspaceSlug]/projects/[projectId]/page.tsx`
- Server component for the project detail route
- Fetches project with details (`findProjectWithDetails`), tasks with assignees (`listTasksByProject`), workspace members (for assignee dropdown)
- Scopes tasks to user for `TEAM_MEMBER` role (only tasks they are assigned to)
- Checks project edit/archive and task CRUD permissions
- Passes everything to `ProjectDetail` client component

### `src/features/projects/components/project-detail.tsx`
- Client component for the project detail view
- Displays: project name/description (header), status badge, client info (name, company, email, phone), budget (`/hr`), timeline (start-due), stats (task count, time entry count)
- Includes the `TaskList` component for the tasks section

### `src/features/projects/components/task-list.tsx`
- Client component for managing tasks within a project
- **Table columns**: Order (up/down arrows), Title, Status (inline select), Assignee (inline select), Due Date, Actions (edit, delete)
- **Inline status change**: Select dropdown triggers `updateTask` action immediately; shows loading spinner per row
- **Inline assignee change**: Select dropdown triggers `updateTask` with new assignee; validates member exists server-side
- **Create dialog**: Title, description, assignee (select), due date
- **Edit dialog**: Title, description, due date. Status and assignee are managed inline instead
- **Delete dialog**: Confirmation with title; soft-deletes via `deletedAt`
- **Reorder**: Up/down arrow buttons per row; calls `reorderTasks` action which updates `sortOrder` in a transaction; reorders local state on success
- **States**: Empty state with create button, loading spinner per row during mutations, field-level Zod errors, action-level errors
- **RBAC**: Buttons/dropdowns hidden per `canCreate`/`canUpdate`/`canDelete` flags

### `docs/PROJECTS_IMPLEMENTATION_REPORT.md`
- This file

## Existing Actions Reused

| Action | Source | Used In |
|---|---|---|
| `listProjects` | `src/features/projects/_actions.ts` | Projects list page |
| `createProject` | `src/features/projects/_actions.ts` | Projects list create modal |
| `updateProject` | `src/features/projects/_actions.ts` | Projects list edit modal |
| `archiveProject` | `src/features/projects/_actions.ts` | Projects list archive modal |

## Existing Queries Reused

| Query | Source | Used In |
|---|---|---|
| `listAllProjects` (via `listProjects` action) | `src/features/projects/queries.ts` | Projects list |
| `findProjectWithDetails` | `src/features/projects/queries.ts` | Project detail page |
| `listTasksByProject` | `src/features/projects/queries.ts` | Project detail tasks section |
| `findTaskById` | `src/features/projects/queries.ts` | Task actions (update/delete) |
| `getMaxSortOrder` | `src/features/projects/queries.ts` | Task create action |
| `findProjectById` | `src/features/projects/queries.ts` | Task create/reorder actions |

## Existing Schemas Reused

| Schema | Source | Used In |
|---|---|---|
| `createProjectSchema` | `src/features/projects/schemas.ts` | Project create action + form validation |
| `updateProjectSchema` | `src/features/projects/schemas.ts` | Project edit action + form validation |
| `createTaskSchema` | `src/features/projects/schemas.ts` | Task create action + form validation |
| `updateTaskSchema` | `src/features/projects/schemas.ts` | Task update action + form validation |
| `reorderTasksSchema` | `src/features/projects/schemas.ts` | Task reorder action |

## Existing RBAC Reused

| Permission | Checked In |
|---|---|
| `ProjectCreate` | Projects list page (hide create button) |
| `ProjectUpdate` / `ProjectUpdateOwn` | Projects list page (hide edit button); project detail (hide edit) |
| `ProjectArchive` | Projects list page (hide archive button); project detail (hide archive) |
| `ProjectRead` / `ProjectReadOwn` | Task scoping for TEAM_MEMBER |
| `TaskCreate` / `TaskCreateOwn` | Project detail (hide create task) |
| `TaskUpdate` / `TaskUpdateOwn` | Task list (hide status/assignee/order controls) |
| `TaskDelete` | Task list (hide delete button) |

## Remaining Enhancements

| Enhancement | Reason |
|---|---|
| **Team Members column on projects list** | Requires aggregation of distinct task assignees per project — no existing query for this |
| **Drag-and-drop task reorder** | User requested "No Kanban drag-and-drop yet" — current up/down buttons suffice |
| **Project member management** | Adding/removing team members from a project directly (currently inferred from task assignments) |
| **Task filters** | Filter by status, assignee, due date on the task list |
| **Task search within project** | Search across task titles |
| **Bulk task actions** | Bulk status change, assignee change, or archive |
| **Server-side pagination** | For projects and tasks if lists grow large |
| **Time entry integration** | Log time against tasks directly from the project detail page |

## TypeScript Verification

- `tsc --noEmit` passes with **zero errors** in strict mode
- All new components follow existing patterns and conventions
