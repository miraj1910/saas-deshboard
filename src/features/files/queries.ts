import { prisma } from '@/lib/prisma'
import type { FileAttachment, User } from '@prisma/client'

export type FileWithUploader = FileAttachment & {
  uploadedBy: Pick<User, 'id' | 'name' | 'avatarUrl'> | null
}

export async function listProjectFiles(projectId: string, workspaceId: string): Promise<FileWithUploader[]> {
  return prisma.fileAttachment.findMany({
    where: { projectId, workspaceId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
    },
  })
}

export async function listClientDeliverables(clientId: string, workspaceId: string): Promise<FileWithUploader[]> {
  return prisma.fileAttachment.findMany({
    where: { clientId, workspaceId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
    },
  })
}

export async function findFileById(fileId: string, workspaceId: string) {
  return prisma.fileAttachment.findFirst({
    where: { id: fileId, workspaceId },
    include: {
      uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
    },
  })
}

export async function findFileByKey(key: string, workspaceId: string) {
  return prisma.fileAttachment.findFirst({
    where: { key, workspaceId },
  })
}
