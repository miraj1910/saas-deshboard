import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Permissions, defineAbilityFor } from '@/lib/rbac'

const f = createUploadthing()

async function authMiddleware(req: Request, requireProject?: boolean, requireClient?: boolean) {
  const session = await auth()
  if (!session?.user?.id) throw new UploadThingError('Unauthorized')

  const workspaceId = req.headers.get('x-workspace-id')
  if (!workspaceId) throw new UploadThingError('Missing workspace context')

  if (requireProject) {
    const projectId = req.headers.get('x-project-id')
    if (!projectId) throw new UploadThingError('Missing project context')
  }

  if (requireClient) {
    const clientId = req.headers.get('x-client-id')
    if (!clientId) throw new UploadThingError('Missing client context')
  }

  if (session.user.userType !== 'TEAM') {
    throw new UploadThingError('Only team members can upload files')
  }

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  })
  if (!member) throw new UploadThingError('Not a member of this workspace')

  const ability = defineAbilityFor(member.role)
  const isProjectFile = !!requireProject
  const permission = isProjectFile ? Permissions.FileProjectUpload : Permissions.FileDeliverableUpload

  if (!ability.can(permission)) {
    throw new UploadThingError('You do not have permission to upload files')
  }

  return {
    userId: session.user.id,
    workspaceId,
    projectId: req.headers.get('x-project-id') ?? null,
    clientId: req.headers.get('x-client-id') ?? null,
  }
}

export const ourFileRouter = {
  projectFile: f({
    pdf: { maxFileSize: '32MB', maxFileCount: 10 },
    image: { maxFileSize: '16MB', maxFileCount: 20 },
    'application/zip': { maxFileSize: '128MB', maxFileCount: 5 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { maxFileSize: '32MB', maxFileCount: 10 },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { maxFileSize: '32MB', maxFileCount: 10 },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { maxFileSize: '32MB', maxFileCount: 10 },
    'application/msword': { maxFileSize: '32MB', maxFileCount: 10 },
    'application/vnd.ms-excel': { maxFileSize: '32MB', maxFileCount: 10 },
    'text/plain': { maxFileSize: '16MB', maxFileCount: 10 },
    'text/csv': { maxFileSize: '16MB', maxFileCount: 10 },
  })
    .middleware(async ({ req }) => authMiddleware(req, true, false))
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.fileAttachment.create({
        data: {
          workspaceId: metadata.workspaceId,
          projectId: metadata.projectId,
          uploadedById: metadata.userId,
          name: file.name,
          originalName: file.name,
          size: file.size,
          type: file.type,
          key: file.key,
          url: file.url,
        },
      })
    }),

  deliverableFile: f({
    pdf: { maxFileSize: '32MB', maxFileCount: 10 },
    image: { maxFileSize: '16MB', maxFileCount: 20 },
    'application/zip': { maxFileSize: '128MB', maxFileCount: 5 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { maxFileSize: '32MB', maxFileCount: 10 },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { maxFileSize: '32MB', maxFileCount: 10 },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { maxFileSize: '32MB', maxFileCount: 10 },
    'application/msword': { maxFileSize: '32MB', maxFileCount: 10 },
    'application/vnd.ms-excel': { maxFileSize: '32MB', maxFileCount: 10 },
    'text/plain': { maxFileSize: '16MB', maxFileCount: 10 },
    'text/csv': { maxFileSize: '16MB', maxFileCount: 10 },
  })
    .middleware(async ({ req }) => authMiddleware(req, false, true))
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.fileAttachment.create({
        data: {
          workspaceId: metadata.workspaceId,
          clientId: metadata.clientId,
          uploadedById: metadata.userId,
          name: file.name,
          originalName: file.name,
          size: file.size,
          type: file.type,
          key: file.key,
          url: file.url,
        },
      })
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
