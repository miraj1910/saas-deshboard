'use server'

import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions, AuthorizationError } from '@/lib/rbac'
import { WorkspaceRole } from '@prisma/client'
import { createNotification } from '@/lib/notifications'
import { sendProjectUpdateEmail } from '@/lib/email'
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '@/features/projects/schemas'
import {
  findProjectById,
  findProjectWithDetails,
  listAllProjects,
  listScopedProjects,
  getAccessibleProjectIds,
  type ProjectWithRelations,
} from '@/features/projects/queries'

export type ProjectActionResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}

function ok<T>(data: T): ProjectActionResult<T> {
  return { success: true, data }
}

function err(error: string): ProjectActionResult<never> {
  return { success: false, error }
}

export async function createProject(
  workspaceId: string,
  input: CreateProjectInput,
): Promise<ProjectActionResult<ProjectWithRelations>> {
  try {
    const parsed = createProjectSchema.parse(input)
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.ProjectCreate)) {
      return err('You do not have permission to create projects')
    }

    const client = await prisma.client.findFirst({
      where: { id: parsed.clientId, workspaceId: ctx.member.workspaceId, deletedAt: null },
    })
    if (!client) return err('Client not found')

    const project = await prisma.project.create({
      data: {
        workspaceId: ctx.member.workspaceId,
        clientId: parsed.clientId,
        name: parsed.name,
        description: parsed.description ?? null,
        hourlyRate: parsed.hourlyRate ?? 0,
        startDate: parsed.startDate ? new Date(parsed.startDate) : null,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        _count: { select: { tasks: true, timeEntries: true } },
      },
    })

    return ok(project)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function updateProject(
  workspaceId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<ProjectActionResult<ProjectWithRelations>> {
  try {
    const parsed = updateProjectSchema.parse(input)
    const ctx = await createWorkspaceContext(workspaceId)

    const project = await findProjectById(projectId, ctx.member.workspaceId)
    if (!project) return err('Project not found')

    const canUpdate = ctx.ability.can(Permissions.ProjectUpdate)
    const canUpdateOwn = ctx.ability.can(Permissions.ProjectUpdateOwn)

    if (!canUpdate && !canUpdateOwn) {
      return err('You do not have permission to update projects')
    }

    if (ctx.member.role === WorkspaceRole.TEAM_MEMBER && !canUpdate) {
      const accessibleIds = await getAccessibleProjectIds(ctx.session.userId, ctx.member.workspaceId)
      if (!accessibleIds.includes(projectId)) {
        return err('You do not have access to this project')
      }
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.description !== undefined && { description: parsed.description }),
        ...(parsed.hourlyRate !== undefined && { hourlyRate: parsed.hourlyRate }),
        ...(parsed.status !== undefined && { status: parsed.status }),
        ...(parsed.startDate !== undefined && { startDate: parsed.startDate ? new Date(parsed.startDate) : null }),
        ...(parsed.dueDate !== undefined && { dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null }),
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        _count: { select: { tasks: true, timeEntries: true } },
      },
    })

    if (parsed.status === 'COMPLETED' && project.status !== 'COMPLETED') {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId, userId: { not: ctx.session.userId } },
        select: { userId: true },
      })

      await Promise.all(
        members.map((m) =>
          createNotification({
            workspaceId: ctx.member.workspaceId,
            userId: m.userId,
            type: 'PROJECT_COMPLETED',
            title: `"${parsed.name ?? project.name}" has been completed`,
            message: `Project completed`,
            link: `/projects/${projectId}`,
            actorId: ctx.session.userId,
          }),
        ),
      )

      const [client, workspace] = await Promise.all([
        prisma.client.findUnique({
          where: { id: project.clientId },
          select: { email: true, name: true },
        }),
        prisma.workspace.findUnique({
          where: { id: ctx.member.workspaceId },
          select: { name: true },
        }),
      ])

      if (client?.email) {
        sendProjectUpdateEmail({
          email: client.email,
          projectName: parsed.name ?? project.name,
          clientName: client.name,
          status: 'Completed',
          projectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000'}/portal/projects/${projectId}`,
          workspaceName: workspace?.name ?? '',
        }).catch(() => {})
      }
    }

    return ok(updated)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function archiveProject(
  workspaceId: string,
  projectId: string,
): Promise<ProjectActionResult<ProjectWithRelations>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    const project = await findProjectById(projectId, ctx.member.workspaceId)
    if (!project) return err('Project not found')

    if (!ctx.ability.can(Permissions.ProjectArchive)) {
      return err('You do not have permission to archive projects')
    }

    if (project.status === 'ARCHIVED') {
      return err('Project is already archived')
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { status: 'ARCHIVED' },
      include: {
        client: { select: { id: true, name: true, company: true } },
        _count: { select: { tasks: true, timeEntries: true } },
      },
    })

    return ok(updated)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function listProjects(
  workspaceId: string,
): Promise<ProjectActionResult<ProjectWithRelations[]>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    const canRead = ctx.ability.can(Permissions.ProjectRead)
    const canReadOwn = ctx.ability.can(Permissions.ProjectReadOwn)

    if (!canRead && !canReadOwn) {
      return err('You do not have permission to view projects')
    }

    if (canRead) {
      const projects = await listAllProjects(ctx.member.workspaceId)
      return ok(projects)
    }

    const accessibleIds = await getAccessibleProjectIds(ctx.session.userId, ctx.member.workspaceId)
    const projects = await listScopedProjects(ctx.member.workspaceId, accessibleIds)
    return ok(projects)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function getProject(
  workspaceId: string,
  projectId: string,
): Promise<ProjectActionResult<ProjectWithRelations | null>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    const canRead = ctx.ability.can(Permissions.ProjectRead)
    const canReadOwn = ctx.ability.can(Permissions.ProjectReadOwn)

    if (!canRead && !canReadOwn) {
      return err('You do not have permission to view projects')
    }

    if (canRead) {
      const project = await findProjectWithDetails(projectId, ctx.member.workspaceId)
      return ok(project)
    }

    const accessibleIds = await getAccessibleProjectIds(ctx.session.userId, ctx.member.workspaceId)
    if (!accessibleIds.includes(projectId)) {
      return err('You do not have access to this project')
    }

    const project = await findProjectWithDetails(projectId, ctx.member.workspaceId)
    return ok(project)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}
