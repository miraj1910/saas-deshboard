'use server'

import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions, AuthorizationError } from '@/lib/rbac'
import { WorkspaceRole } from '@prisma/client'
import { createNotification } from '@/lib/notifications'
import {
  startTimerSchema,
  stopTimerSchema,
  submitTimeEntrySchema,
  approveTimeEntrySchema,
  rejectTimeEntrySchema,
  type StartTimerInput,
} from '@/features/time-tracking/schemas'
import {
  findTimeEntryById,
  findActiveTimer,
  findRunningTimerForUser,
  listTimeEntries,
  type TimeEntryWithRelations,
} from '@/features/time-tracking/queries'

export type TimeActionResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}

function ok<T>(data: T): TimeActionResult<T> {
  return { success: true, data }
}

function err(error: string): TimeActionResult<never> {
  return { success: false, error }
}

export async function startTimer(
  workspaceId: string,
  input: StartTimerInput,
): Promise<TimeActionResult<TimeEntryWithRelations>> {
  try {
    const parsed = startTimerSchema.parse(input)
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.TimeCreate)) {
      return err('You do not have permission to log time')
    }

    const project = await prisma.project.findFirst({
      where: { id: parsed.projectId, workspaceId: ctx.member.workspaceId, deletedAt: null },
    })
    if (!project) return err('Project not found')

    if (parsed.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: parsed.taskId, projectId: parsed.projectId, deletedAt: null },
      })
      if (!task) return err('Task not found in this project')
    }

    const active = await findActiveTimer(ctx.session.userId, ctx.member.workspaceId)
    if (active) return err('You already have a running timer')

    const entry = await prisma.timeEntry.create({
      data: {
        workspaceId: ctx.member.workspaceId,
        userId: ctx.session.userId,
        projectId: parsed.projectId,
        taskId: parsed.taskId ?? null,
        description: parsed.description ?? null,
        startTime: new Date(),
        durationMinutes: 0,
        status: 'DRAFT',
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    })

    return ok(entry)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function stopTimer(
  workspaceId: string,
  entryId: string,
): Promise<TimeActionResult<TimeEntryWithRelations>> {
  try {
    stopTimerSchema.parse({ entryId })
    const ctx = await createWorkspaceContext(workspaceId)

    const entry = await findTimeEntryById(entryId, ctx.member.workspaceId)
    if (!entry) return err('Time entry not found')

    if (entry.userId !== ctx.session.userId && !ctx.ability.can(Permissions.TimeUpdate)) {
      return err('You do not have permission to stop this timer')
    }

    if (entry.endTime) return err('Timer is already stopped')

    const now = new Date()
    const diffMs = now.getTime() - entry.startTime.getTime()
    const durationMinutes = Math.round(diffMs / 60000)

    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        endTime: now,
        durationMinutes: Math.max(1, durationMinutes),
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    })

    return ok(updated)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function submitTimeEntry(
  workspaceId: string,
  entryId: string,
): Promise<TimeActionResult<TimeEntryWithRelations>> {
  try {
    submitTimeEntrySchema.parse({ entryId })
    const ctx = await createWorkspaceContext(workspaceId)

    const entry = await findTimeEntryById(entryId, ctx.member.workspaceId)
    if (!entry) return err('Time entry not found')

    if (!ctx.ability.can(Permissions.TimeSubmit)) {
      return err('You do not have permission to submit time entries')
    }

    if (entry.status !== 'DRAFT') {
      return err('Only draft entries can be submitted')
    }

    if (entry.userId !== ctx.session.userId) {
      return err('You can only submit your own time entries')
    }

    if (!entry.endTime) {
      return err('Stop the timer before submitting')
    }

    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: { status: 'SUBMITTED' },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    })

    return ok(updated)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function approveTimeEntry(
  workspaceId: string,
  entryId: string,
): Promise<TimeActionResult<TimeEntryWithRelations>> {
  try {
    approveTimeEntrySchema.parse({ entryId })
    const ctx = await createWorkspaceContext(workspaceId)

    const entry = await findTimeEntryById(entryId, ctx.member.workspaceId)
    if (!entry) return err('Time entry not found')

    if (!ctx.ability.can(Permissions.TimeApprove)) {
      return err('You do not have permission to approve time entries')
    }

    if (entry.userId === ctx.session.userId) {
      return err('Self-approval is not permitted')
    }

    if (entry.status !== 'SUBMITTED') {
      return err('Only submitted entries can be approved')
    }

    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        status: 'APPROVED',
        approvedById: ctx.session.userId,
        approvedAt: new Date(),
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    })

    await createNotification({
      workspaceId: ctx.member.workspaceId,
      userId: entry.userId,
      type: 'TIME_ENTRY_APPROVED',
      title: 'Your time entry has been approved',
      message: entry.description
        ? `"${entry.description}" - ${Math.round(entry.durationMinutes / 60)}h`
        : `${Math.round(entry.durationMinutes / 60)}h logged`,
      link: `/time`,
      actorId: ctx.session.userId,
    })

    return ok(updated)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function listWorkspaceTimeEntries(
  workspaceId: string,
): Promise<TimeActionResult<TimeEntryWithRelations[]>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    const canRead = ctx.ability.can(Permissions.TimeRead)
    const canReadOwn = ctx.ability.can(Permissions.TimeReadOwn)

    if (!canRead && !canReadOwn) {
      return err('You do not have permission to view time entries')
    }

    const entries = await listTimeEntries(
      ctx.member.workspaceId,
      canRead ? undefined : ctx.session.userId,
    )

    return ok(entries)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function getProjectTasks(
  workspaceId: string,
  projectId: string,
): Promise<TimeActionResult<{ id: string; title: string }[]>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: ctx.member.workspaceId, deletedAt: null },
    })
    if (!project) return err('Project not found')

    const tasks = await prisma.task.findMany({
      where: { projectId, deletedAt: null },
      select: { id: true, title: true },
      orderBy: { sortOrder: 'asc' },
    })

    return ok(tasks)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function rejectTimeEntry(
  workspaceId: string,
  entryId: string,
): Promise<TimeActionResult<TimeEntryWithRelations>> {
  try {
    rejectTimeEntrySchema.parse({ entryId })
    const ctx = await createWorkspaceContext(workspaceId)

    const entry = await findTimeEntryById(entryId, ctx.member.workspaceId)
    if (!entry) return err('Time entry not found')

    if (!ctx.ability.can(Permissions.TimeApprove)) {
      return err('You do not have permission to reject time entries')
    }

    if (entry.userId === ctx.session.userId) {
      return err('Self-approval is not permitted')
    }

    if (entry.status !== 'SUBMITTED') {
      return err('Only submitted entries can be rejected')
    }

    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: { status: 'REJECTED' },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    })

    return ok(updated)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}
