'use server'

import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions, AuthorizationError } from '@/lib/rbac'
import { WorkspaceRole } from '@prisma/client'
import { UTApi } from 'uploadthing/server'
import {
  listProjectFiles,
  listClientDeliverables,
  findFileById,
  type FileWithUploader,
} from '@/features/files/queries'

const utapi = new UTApi()

export type FileActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function ok<T>(data: T): FileActionResult<T> {
  return { success: true, data }
}

function err(error: string): FileActionResult<never> {
  return { success: false, error }
}

export async function getProjectFiles(
  workspaceId: string,
  projectId: string,
): Promise<FileActionResult<FileWithUploader[]>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    const canDownload = ctx.ability.can(Permissions.FileProjectDownload)
    if (!canDownload) {
      return err('You do not have permission to view project files')
    }

    if (ctx.member.role === WorkspaceRole.TEAM_MEMBER) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, workspaceId, deletedAt: null },
        select: { id: true },
      })
      if (!project) return err('Project not found')
    }

    const files = await listProjectFiles(projectId, ctx.member.workspaceId)
    return ok(files)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function getClientDeliverables(
  workspaceId: string,
  clientId: string,
): Promise<FileActionResult<FileWithUploader[]>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.FileDeliverableDownload)) {
      return err('You do not have permission to view client deliverables')
    }

    const files = await listClientDeliverables(clientId, ctx.member.workspaceId)
    return ok(files)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function deleteProjectFile(
  workspaceId: string,
  fileId: string,
): Promise<FileActionResult<void>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.FileProjectDelete)) {
      return err('You do not have permission to delete files')
    }

    const file = await findFileById(fileId, ctx.member.workspaceId)
    if (!file) return err('File not found')
    if (!file.projectId) return err('File is not a project attachment')

    if (ctx.member.role === WorkspaceRole.TEAM_MEMBER) {
      const project = await prisma.project.findFirst({
        where: { id: file.projectId!, workspaceId, deletedAt: null },
        select: { id: true },
      })
      if (!project) return err('Project not found or access denied')
    }

    await utapi.deleteFiles(file.key)
    await prisma.fileAttachment.delete({ where: { id: fileId } })

    return ok(undefined)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function deleteDeliverableFile(
  workspaceId: string,
  fileId: string,
): Promise<FileActionResult<void>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.FileDeliverableDownload)) {
      return err('You do not have permission to delete deliverables')
    }

    const file = await findFileById(fileId, ctx.member.workspaceId)
    if (!file) return err('File not found')
    if (!file.clientId) return err('File is not a client deliverable')

    await utapi.deleteFiles(file.key)
    await prisma.fileAttachment.delete({ where: { id: fileId } })

    return ok(undefined)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}
