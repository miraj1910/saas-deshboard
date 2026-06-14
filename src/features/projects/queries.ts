import { prisma } from '@/lib/prisma'
import type { Project, Client, Task } from '@prisma/client'

export type ProjectWithRelations = Project & {
  client?: Pick<Client, 'id' | 'name' | 'company'> | null
  _count?: { tasks: number; timeEntries: number }
}

export type TaskWithProject = Task & {
  project?: Pick<Project, 'id' | 'name' | 'workspaceId'> | null
}

export async function findTaskById(taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: { project: { select: { id: true, name: true, workspaceId: true } } },
  })
}

export async function getAccessibleProjectIds(
  userId: string,
  workspaceId: string,
): Promise<string[]> {
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      project: { workspaceId },
    },
    select: { projectId: true },
    distinct: ['projectId'],
  })

  return tasks.map((t) => t.projectId)
}

export async function findProjectById(projectId: string, workspaceId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, workspaceId, deletedAt: null },
  })
}

export async function findProjectWithDetails(projectId: string, workspaceId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, workspaceId, deletedAt: null },
    include: {
      client: { select: { id: true, name: true, company: true } },
      _count: { select: { tasks: true, timeEntries: true } },
    },
  })
}

export async function listAllProjects(workspaceId: string) {
  return prisma.project.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true, company: true } },
      _count: { select: { tasks: true, timeEntries: true } },
    },
  })
}

export async function listScopedProjects(workspaceId: string, accessibleIds: string[]) {
  if (accessibleIds.length === 0) return []

  return prisma.project.findMany({
    where: { id: { in: accessibleIds }, workspaceId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true, company: true } },
      _count: { select: { tasks: true, timeEntries: true } },
    },
  })
}

export async function userHasProjectAccess(
  userId: string,
  projectId: string,
  workspaceId: string,
): Promise<boolean> {
  const count = await prisma.task.count({
    where: {
      assigneeId: userId,
      projectId,
      project: { workspaceId },
    },
  })
  return count > 0
}

export async function taskAssignedToUser(
  taskId: string,
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      assigneeId: userId,
      project: { workspaceId },
    },
  })
  return task !== null
}

export async function getMaxSortOrder(projectId: string): Promise<number> {
  const last = await prisma.task.findFirst({
    where: { projectId, deletedAt: null },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return last?.sortOrder ?? 0
}

export async function listTasksByProject(
  projectId: string,
  workspaceId: string,
  userId?: string,
  teamMemberScoped?: boolean,
) {
  const where: any = {
    projectId,
    project: { workspaceId },
    deletedAt: null,
  }

  if (teamMemberScoped && userId) {
    where.assigneeId = userId
  }

  return prisma.task.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
    },
  })
}
