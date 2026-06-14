import { prisma } from '@/lib/prisma'
import type { Client, Project } from '@prisma/client'

export type ClientWithRelations = Client & {
  projects?: (Project & {
    _count?: { tasks: number }
  })[]
  _count?: { projects: number; invoices: number }
}

export async function getAccessibleClientIds(
  userId: string,
  workspaceId: string,
): Promise<string[]> {
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      project: { workspaceId },
    },
    select: { project: { select: { clientId: true } } },
    distinct: ['projectId'],
  })

  return [...new Set(tasks.map((t) => t.project.clientId))]
}

export async function findClientById(clientId: string, workspaceId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, workspaceId, deletedAt: null },
  })
}

export async function findClientWithDetails(clientId: string, workspaceId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, workspaceId, deletedAt: null },
    include: {
      projects: {
        where: { deletedAt: null },
        include: { _count: { select: { tasks: true } } },
      },
      _count: { select: { projects: true, invoices: true } },
    },
  })
}

export async function listAllClients(workspaceId: string) {
  return prisma.client.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { projects: true, invoices: true } } },
  })
}

export async function listScopedClients(workspaceId: string, accessibleIds: string[]) {
  if (accessibleIds.length === 0) return []

  return prisma.client.findMany({
    where: { id: { in: accessibleIds }, workspaceId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { projects: true, invoices: true } } },
  })
}
