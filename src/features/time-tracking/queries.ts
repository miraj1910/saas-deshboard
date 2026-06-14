import { prisma } from '@/lib/prisma'
import type { TimeEntry, Project, User } from '@prisma/client'

export type TimeEntryWithRelations = TimeEntry & {
  project?: Pick<Project, 'id' | 'name'> | null
  task?: { id: string; title: string } | null
  user?: Pick<User, 'id' | 'name'> | null
}

export async function findTimeEntryById(entryId: string, workspaceId: string) {
  return prisma.timeEntry.findFirst({
    where: { id: entryId, workspaceId, deletedAt: null },
    include: {
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      user: { select: { id: true, name: true } },
    },
  })
}

export async function findActiveTimer(userId: string, workspaceId: string) {
  return prisma.timeEntry.findFirst({
    where: {
      userId,
      workspaceId,
      endTime: null,
      deletedAt: null,
    },
  })
}

export async function findRunningTimerForUser(userId: string, workspaceId: string) {
  return prisma.timeEntry.findFirst({
    where: {
      userId,
      workspaceId,
      endTime: null,
      deletedAt: null,
    },
    include: {
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  })
}

const timeEntryListInclude = {
  project: { select: { id: true, name: true } },
  task: { select: { id: true, title: true } },
  user: { select: { id: true, name: true } },
} as const

export async function listTimeEntries(
  workspaceId: string,
  userId?: string,
): Promise<TimeEntryWithRelations[]> {
  const where: { workspaceId: string; deletedAt: null; userId?: string } = {
    workspaceId,
    deletedAt: null,
  }
  if (userId) where.userId = userId

  return prisma.timeEntry.findMany({
    where,
    orderBy: { startTime: 'desc' },
    include: timeEntryListInclude,
  })
}
