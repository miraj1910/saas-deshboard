# File Management Implementation Report

## Overview

Implemented a complete file management system for FlowDesk using UploadThing as the storage provider. The system supports project attachments, client deliverables, and file downloads with workspace scoping and RBAC enforcement.

## Storage Provider

**UploadThing v7.7.4** — Serverless file upload service that handles S3 storage, CDN delivery, and presigned URLs. No direct AWS S3 integration was needed.

## Supported File Types

| Category | MIME Types | Max Size |
|---|---|---|
| PDF | `application/pdf` | 32 MB |
| Images | `image/*` (JPEG, PNG, GIF, WebP, SVG) | 16 MB |
| ZIP Archives | `application/zip` | 128 MB |
| Word Documents | `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword` | 32 MB |
| Excel Spreadsheets | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel` | 32 MB |
| Presentations | `application/vnd.openxmlformats-officedocument.presentationml.presentation` | 32 MB |
| Text/CSV | `text/plain`, `text/csv` | 16 MB |

## Architecture

### File Upload Flow

```
Client Component (UploadButton)
  │
  ├─ headers: { x-workspace-id, x-project-id/x-client-id }
  │
  ▼
UploadThing Client ──POST──► UploadThing API (/api/uploadthing)
                                  │
                                  ▼
                          UploadThing Core (middleware)
                            ├─ Authenticate (NextAuth session)
                            ├─ Verify workspace membership
                            ├─ Check RBAC permission
                            │
                            ▼
                          UploadThing Storage (S3/CDN)
                                  │
                                  ▼
                          UploadThing Core (onUploadComplete)
                            └─ Save FileAttachment record to DB
```

### File Download Flow

```
Client ──GET──► /api/files/[id]/download
                  │
                  ▼
                Download Route
                  ├─ Authenticate (NextAuth session)
                  ├─ Fetch FileAttachment from DB
                  ├─ Verify workspace membership
                  ├─ Check RBAC permission (TEAM or CLIENT)
                  │
                  ▼
         302 Redirect ──► UploadThing CDN URL
```

## Files Modified

| File | Change |
|---|---|
| `package.json` | Added `uploadthing`, `@uploadthing/react` |
| `.env` | Added `UPLOADTHING_APP_ID`, `UPLOADTHING_SECRET` |
| `.env.example` | Added UploadThing env template |
| `src/lib/rbac.ts` | Added 5 file permissions |

## Files Created

| File | Purpose |
|---|---|
| `src/app/api/uploadthing/core.ts` | UploadThing file router with middleware and upload completion handlers |
| `src/app/api/uploadthing/route.ts` | UploadThing API route (GET/POST) |
| `src/lib/uploadthing.ts` | Typed UploadButton/UploadDropzone exports |
| `src/features/files/schemas.ts` | FileAttachment Zod schemas and types |
| `src/features/files/queries.ts` | Prisma queries for files (list, find) |
| `src/features/files/_actions.ts` | Server actions (get files, delete files) |
| `src/app/api/files/[id]/download/route.ts` | Download API route with RBAC |
| `src/features/files/components/project-files-section.tsx` | Project files UI component |
| `src/features/files/components/deliverables-section.tsx` | Client deliverables UI component |

## RBAC Permissions

| Permission | OWNER | MANAGER | TEAM_MEMBER | CLIENT |
|---|---|---|---|---|
| `file:project-upload` | ✓ | ✓ | ✓ | ✗ |
| `file:project-download` | ✓ | ✓ | ✓ | ✓ |
| `file:project-delete` | ✓ | ✓ | ✓ | ✗ |
| `file:deliverable-upload` | ✓ | ✓ | ✓ | ✗ |
| `file:deliverable-download` | ✓ | ✓ | ✓ | ✓ |

- **OWNER / MANAGER**: Full access to all file operations across all projects/clients.
- **TEAM_MEMBER**: Full access but functionally scoped to projects they're assigned to via tasks. Client portal deliverables are accessible.
- **CLIENT**: Read-only access — can download project files and client deliverables scoped to their own client record.

## API Routes

### `POST /api/uploadthing`
UploadThing upload endpoint. Accepts multipart file upload. Handles both project files and client deliverables via `UploadButton` with different `endpoint` values.

### `GET /api/files/[id]/download`
Secure download endpoint. Validates authentication, workspace membership, and RBAC before redirecting to the UploadThing CDN URL.

## Server Actions

| Action | Description |
|---|---|
| `getProjectFiles(workspaceId, projectId)` | List all files for a project |
| `getClientDeliverables(workspaceId, clientId)` | List all deliverables for a client |
| `deleteProjectFile(workspaceId, fileId)` | Delete a project file (DB + UploadThing storage) |
| `deleteDeliverableFile(workspaceId, fileId)` | Delete a client deliverable (DB + UploadThing storage) |

## Database Model

The existing `FileAttachment` Prisma model is used as-is:

```
FileAttachment {
  id           String   @id @default(uuid())
  workspaceId  String
  projectId    String?   // Set for project attachments
  clientId     String?   // Set for client deliverables
  uploadedById String?
  name         String
  originalName String
  size         Int
  type         String
  key          String    // UploadThing file key
  url          String    // UploadThing CDN URL
  createdAt    DateTime
  updatedAt    DateTime
}
```

Project files are identified by `projectId` being set; client deliverables by `clientId` being set. The model is workspace-scoped via `workspaceId`.

## Workspace Scoping

Every file operation enforces workspace isolation:
- The `x-workspace-id` header carries the workspace context during upload
- Download route verifies the file belongs to the user's workspace
- All Prisma queries filter by `workspaceId`
- Cross-workspace access is prevented at the authentication level

## Client Portal Access

Client users (`userType: CLIENT`) can download files through the portal. The download route validates:
1. The client user is linked to the client record via `ClientMember`
2. The client has `file:deliverable-download` permission
3. The file's `clientId` matches the client's record

## Environment Setup

Required environment variables:

```env
UPLOADTHING_APP_ID=project_xxx
UPLOADTHING_SECRET=sk_live_xxx
```

Get these from [uploadthing.com/dashboard](https://uploadthing.com/dashboard).

## Usage

### Project Files (Team Side)

```tsx
<ProjectFilesSection
  projectId={project.id}
  workspaceId={workspace.id}
  workspaceSlug={workspace.slug}
  initialFiles={files}
  canUpload={canUpload}
  canDelete={canDelete}
/>
```

### Client Deliverables (Team Side)

```tsx
<DeliverablesSection
  clientId={client.id}
  workspaceId={workspace.id}
  initialFiles={files}
  canUpload={canUpload}
  canDownload={canDownload}
/>
```

## Next Steps / Recommendations

1. **Integration**: Wire the `ProjectFilesSection` and `DeliverablesSection` components into the existing project detail and client detail pages.
2. **File Previews**: Add inline previews for images and PDFs before download.
3. **Drag & Drop**: Use `UploadDropzone` instead of `UploadButton` for a richer upload experience.
4. **Notifications**: Send in-app notifications when files are uploaded to shared projects.
5. **Audit Trail**: Log file uploads and deletions to the `AuditLog` table.
6. **Custom Branding**: Use UploadThing's theming API to match the FlowDesk design system.
