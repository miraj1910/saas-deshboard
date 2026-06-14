import { prisma } from '@/lib/prisma'
import { WorkspaceRole } from '@prisma/client'
import type { WorkspaceAuthContext } from '@/lib/authorization'
import type { DashboardData, ActivityItem, DeadlineItem, QuickStats } from './types'

function startOfMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function startOfDay(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function sevenDaysFromNow(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d
}

function toNumber(value: { toNumber: () => number } | number | string | null | undefined): number {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  return value.toNumber()
}

export async function getDashboardData(ctx: WorkspaceAuthContext): Promise<DashboardData> {
  const isScoped = ctx.member.role === WorkspaceRole.TEAM_MEMBER
  const userId = ctx.session.userId
  const workspaceId = ctx.member.workspaceId

  const [revenueMtd, activeClients, activeProjects, pendingInvoices, recentActivity, upcomingDeadlines, quickStats] =
    await Promise.all([
      getRevenueMtd(workspaceId),
      getActiveClientCount(workspaceId, isScoped, userId),
      getActiveProjectCount(workspaceId, isScoped, userId),
      getPendingInvoiceCount(workspaceId),
      getRecentActivity(workspaceId, isScoped, userId),
      getUpcomingDeadlines(workspaceId, isScoped, userId),
      getQuickStats(workspaceId, isScoped, userId),
    ])

  return {
    revenueMtd,
    activeClients,
    activeProjects,
    pendingInvoices,
    recentActivity,
    upcomingDeadlines,
    quickStats,
  }
}

async function getRevenueMtd(workspaceId: string): Promise<number> {
  const lineItems = await prisma.invoiceLineItem.findMany({
    where: {
      invoice: {
        workspaceId,
        status: 'PAID',
        paidAt: { gte: startOfMonth() },
        deletedAt: null,
      },
    },
    select: { amount: true },
  })

  return lineItems.reduce((sum, item) => sum + toNumber(item.amount), 0)
}

async function getActiveClientCount(
  workspaceId: string,
  scoped: boolean,
  userId: string,
): Promise<number> {
  if (scoped) {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId, project: { workspaceId } },
      select: { project: { select: { clientId: true } } },
      distinct: ['projectId'],
    })
    const clientIds = [...new Set(tasks.map((t) => t.project.clientId))]
    if (clientIds.length === 0) return 0

    return prisma.client.count({
      where: { id: { in: clientIds }, workspaceId, status: 'ACTIVE', deletedAt: null },
    })
  }

  return prisma.client.count({
    where: { workspaceId, status: 'ACTIVE', deletedAt: null },
  })
}

async function getActiveProjectCount(
  workspaceId: string,
  scoped: boolean,
  userId: string,
): Promise<number> {
  if (scoped) {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId, project: { workspaceId } },
      select: { projectId: true },
      distinct: ['projectId'],
    })
    const projectIds = tasks.map((t) => t.projectId)
    if (projectIds.length === 0) return 0

    return prisma.project.count({
      where: { id: { in: projectIds }, workspaceId, status: 'ACTIVE', deletedAt: null },
    })
  }

  return prisma.project.count({
    where: { workspaceId, status: 'ACTIVE', deletedAt: null },
  })
}

async function getPendingInvoiceCount(workspaceId: string): Promise<number> {
  return prisma.invoice.count({
    where: {
      workspaceId,
      status: { in: ['DRAFT', 'SENT', 'OVERDUE'] },
      deletedAt: null,
    },
  })
}

async function getRecentActivity(
  workspaceId: string,
  scoped: boolean,
  userId: string,
): Promise<ActivityItem[]> {
  const where: any = { workspaceId }

  if (scoped) {
    where.userId = userId
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: { select: { name: true, avatarUrl: true } },
    },
  })

  return activities.map((a) => ({
    id: a.id,
    action: a.action,
    description: a.description,
    entityType: a.entityType,
    userName: a.user?.name ?? null,
    userAvatar: a.user?.avatarUrl ?? null,
    createdAt: a.createdAt,
  }))
}

async function getUpcomingDeadlines(
  workspaceId: string,
  scoped: boolean,
  userId: string,
): Promise<DeadlineItem[]> {
  const where: any = {
    dueDate: { gte: startOfDay(), lte: sevenDaysFromNow() },
    status: { not: 'DONE' },
    project: { workspaceId, deletedAt: null },
    deletedAt: null,
  }

  if (scoped) {
    where.assigneeId = userId
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { dueDate: 'asc' },
    take: 10,
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { name: true } },
    },
  })

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    projectName: t.project.name,
    projectId: t.project.id,
    dueDate: t.dueDate!,
    assigneeName: t.assignee?.name ?? null,
    status: t.status,
  }))
}

async function getQuickStats(
  workspaceId: string,
  scoped: boolean,
  userId: string,
): Promise<QuickStats> {
  const [
    hoursLoggedToday,
    tasksCompletedThisMonth,
    outstandingInvoicesAmount,
    teamMemberCount,
  ] = await Promise.all([
    getHoursLoggedToday(workspaceId, scoped, userId),
    getTasksCompletedThisMonth(workspaceId, scoped, userId),
    getOutstandingInvoiceAmount(workspaceId),
    getTeamMemberCount(workspaceId),
  ])

  const workingDays = getWorkingDaysThisMonth()
  const expectedHours = workingDays * 8
  const utilizationRate =
    expectedHours > 0
      ? Math.round((hoursLoggedToday / expectedHours) * 100)
      : null

  return {
    hoursLoggedToday,
    tasksCompletedThisMonth,
    utilizationRate,
    outstandingInvoicesAmount,
    teamMemberCount,
  }
}

function getWorkingDaysThisMonth(): number {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let workingDays = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dayOfWeek = date.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++
    }
  }

  return workingDays
}

async function getHoursLoggedToday(
  workspaceId: string,
  scoped: boolean,
  userId: string,
): Promise<number> {
  const where: any = {
    workspaceId,
    startTime: { gte: startOfDay() },
    deletedAt: null,
  }

  if (scoped) {
    where.userId = userId
  }

  const result = await prisma.timeEntry.aggregate({
    where,
    _sum: { durationMinutes: true },
  })

  return Math.round((toNumber(result._sum.durationMinutes) / 60) * 100) / 100
}

async function getTasksCompletedThisMonth(
  workspaceId: string,
  scoped: boolean,
  userId: string,
): Promise<number> {
  const where: any = {
    status: 'DONE',
    project: { workspaceId, deletedAt: null },
    deletedAt: null,
  }

  if (scoped) {
    where.assigneeId = userId
  }

  return prisma.task.count({
    where: {
      ...where,
      updatedAt: { gte: startOfMonth() },
    },
  })
}

async function getOutstandingInvoiceAmount(workspaceId: string): Promise<number> {
  const invoices = await prisma.invoice.findMany({
    where: {
      workspaceId,
      status: { in: ['SENT', 'OVERDUE'] },
      deletedAt: null,
    },
    select: { totalAmount: true },
  })

  return invoices.reduce((sum, inv) => sum + toNumber(inv.totalAmount), 0)
}

async function getTeamMemberCount(workspaceId: string): Promise<number> {
  return prisma.workspaceMember.count({
    where: { workspaceId },
  })
}
