import { prisma } from '@/lib/prisma'
import type { WorkspaceAuthContext } from '@/lib/authorization'
import type {
  AnalyticsData,
  RevenueTrendItem,
  InvoiceStatusItem,
  WeeklyHoursItem,
  ProjectStatusItem,
  TopClient,
  TeamUtilizationMember,
} from './types'

function toNumber(value: { toNumber: () => number } | number | string | null | undefined): number {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  return value.toNumber()
}

function startOfMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function startOfYear(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), 0, 1)
}

function twelveMonthsAgo(): Date {
  const now = new Date()
  return new Date(now.getFullYear() - 1, now.getMonth(), 1)
}

function getWeekStart(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatMonth(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
}

function formatWeek(d: Date): string {
  const start = getWeekStart(d)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const startStr = start.toLocaleString('en-US', { month: 'short', day: 'numeric' })
  const endStr = end.toLocaleString('en-US', { month: 'short', day: 'numeric' })
  return `${startStr} - ${endStr}`
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

function monthLabel(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
}

export async function getAnalyticsData(ctx: WorkspaceAuthContext): Promise<AnalyticsData> {
  const workspaceId = ctx.member.workspaceId

  const [
    revenueMtd,
    revenueYtd,
    outstandingInvoices,
    hoursTracked,
    projectsCompleted,
    activeClients,
    clientGrowth,
    revenueTrend,
    invoiceStatusDistribution,
    weeklyHours,
    projectStatusDistribution,
    topClients,
    teamUtilizationMembers,
  ] = await Promise.all([
    getRevenueMtd(workspaceId),
    getRevenueYtd(workspaceId),
    getOutstandingInvoices(workspaceId),
    getHoursTracked(workspaceId),
    getProjectsCompleted(workspaceId),
    getActiveClients(workspaceId),
    getClientGrowth(workspaceId),
    getRevenueTrend(workspaceId),
    getInvoiceStatusDistribution(workspaceId),
    getWeeklyHours(workspaceId),
    getProjectStatusDistribution(workspaceId),
    getTopClients(workspaceId),
    getTeamUtilization(workspaceId),
  ])

  const teamMemberCount = teamUtilizationMembers.length
  const workingDays = getWorkingDaysThisMonth()
  const totalAvailableHours = teamMemberCount * workingDays * 8
  const totalLoggedHours = teamUtilizationMembers.reduce((s, m) => s + m.hoursLogged, 0)
  const teamUtilizationPct =
    totalAvailableHours > 0
      ? Math.round((totalLoggedHours / totalAvailableHours) * 100)
      : 0

  return {
    revenueMtd,
    revenueYtd,
    outstandingInvoices,
    teamUtilization: teamUtilizationPct,
    hoursTracked,
    projectsCompleted,
    activeClients,
    clientGrowth,
    revenueTrend,
    invoiceStatusDistribution,
    weeklyHours,
    projectStatusDistribution,
    topClients,
    teamUtilizationMembers,
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

async function getRevenueYtd(workspaceId: string): Promise<number> {
  const lineItems = await prisma.invoiceLineItem.findMany({
    where: {
      invoice: {
        workspaceId,
        status: 'PAID',
        paidAt: { gte: startOfYear() },
        deletedAt: null,
      },
    },
    select: { amount: true },
  })

  return lineItems.reduce((sum, item) => sum + toNumber(item.amount), 0)
}

async function getOutstandingInvoices(workspaceId: string): Promise<number> {
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

async function getHoursTracked(workspaceId: string): Promise<number> {
  const result = await prisma.timeEntry.aggregate({
    where: {
      workspaceId,
      status: 'APPROVED',
      deletedAt: null,
    },
    _sum: { durationMinutes: true },
  })

  return Math.round((toNumber(result._sum.durationMinutes) / 60) * 100) / 100
}

async function getProjectsCompleted(workspaceId: string): Promise<number> {
  return prisma.project.count({
    where: { workspaceId, status: 'COMPLETED', deletedAt: null },
  })
}

async function getActiveClients(workspaceId: string): Promise<number> {
  return prisma.client.count({
    where: { workspaceId, status: 'ACTIVE', deletedAt: null },
  })
}

async function getClientGrowth(workspaceId: string): Promise<number> {
  const now = new Date()
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  const [thisMonthCount, lastMonthCount] = await Promise.all([
    prisma.client.count({
      where: {
        workspaceId,
        createdAt: { gte: startThisMonth },
        deletedAt: null,
      },
    }),
    prisma.client.count({
      where: {
        workspaceId,
        createdAt: { gte: startLastMonth, lte: endLastMonth },
        deletedAt: null,
      },
    }),
  ])

  if (lastMonthCount === 0) return thisMonthCount > 0 ? 100 : 0

  return Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
}

async function getRevenueTrend(workspaceId: string): Promise<RevenueTrendItem[]> {
  const startDate = twelveMonthsAgo()
  const endDate = new Date()

  const paidInvoices = await prisma.invoice.findMany({
    where: {
      workspaceId,
      status: 'PAID',
      paidAt: { gte: startDate, lte: endDate },
      deletedAt: null,
    },
    select: { paidAt: true, totalAmount: true },
  })

  const monthBuckets: Map<string, number> = new Map()

  for (let i = 0; i < 12; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
    monthBuckets.set(formatMonth(d), 0)
  }

  for (const inv of paidInvoices) {
    if (!inv.paidAt) continue
    const key = formatMonth(inv.paidAt)
    const current = monthBuckets.get(key) ?? 0
    monthBuckets.set(key, current + toNumber(inv.totalAmount))
  }

  return Array.from(monthBuckets.entries()).map(([month, revenue]) => ({
    month,
    revenue: Math.round(revenue * 100) / 100,
  }))
}

async function getInvoiceStatusDistribution(workspaceId: string): Promise<InvoiceStatusItem[]> {
  const invoices = await prisma.invoice.findMany({
    where: { workspaceId, deletedAt: null },
    select: { status: true, totalAmount: true },
  })

  const buckets: Map<string, { count: number; amount: number }> = new Map()

  for (const inv of invoices) {
    const existing = buckets.get(inv.status) ?? { count: 0, amount: 0 }
    existing.count++
    existing.amount += toNumber(inv.totalAmount)
    buckets.set(inv.status, existing)
  }

  const order = ['DRAFT', 'SENT', 'PAID', 'OVERDUE']

  return order
    .filter((s) => buckets.has(s))
    .map((status) => {
      const b = buckets.get(status)!
      return { status, count: b.count, amount: Math.round(b.amount * 100) / 100 }
    })
}

async function getWeeklyHours(workspaceId: string): Promise<WeeklyHoursItem[]> {
  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

  const entries = await prisma.timeEntry.findMany({
    where: {
      workspaceId,
      status: 'APPROVED',
      startTime: { gte: eightWeeksAgo },
      deletedAt: null,
    },
    select: { startTime: true, durationMinutes: true },
  })

  const weekBuckets: Map<string, number> = new Map()

  const eightWeeksStart = getWeekStart(eightWeeksAgo)
  for (let i = 0; i < 8; i++) {
    const d = new Date(eightWeeksStart)
    d.setDate(d.getDate() + i * 7)
    weekBuckets.set(formatWeek(d), 0)
  }

  for (const entry of entries) {
    const key = formatWeek(entry.startTime)
    const current = weekBuckets.get(key) ?? 0
    weekBuckets.set(key, current + toNumber(entry.durationMinutes) / 60)
  }

  return Array.from(weekBuckets.entries()).map(([week, hours]) => ({
    week,
    hours: Math.round(hours * 100) / 100,
  }))
}

async function getProjectStatusDistribution(
  workspaceId: string,
): Promise<ProjectStatusItem[]> {
  const projects = await prisma.project.findMany({
    where: { workspaceId, deletedAt: null },
    select: { status: true },
  })

  const buckets: Map<string, number> = new Map()

  for (const p of projects) {
    buckets.set(p.status, (buckets.get(p.status) ?? 0) + 1)
  }

  const order = ['ACTIVE', 'COMPLETED', 'ARCHIVED']

  return order
    .filter((s) => buckets.has(s))
    .map((status) => ({ status, count: buckets.get(status)! }))
}

async function getTopClients(workspaceId: string): Promise<TopClient[]> {
  const clients = await prisma.client.findMany({
    where: { workspaceId, deletedAt: null },
    select: {
      id: true,
      name: true,
      projects: {
        where: { deletedAt: null },
        select: { id: true },
      },
      invoices: {
        where: { deletedAt: null },
        select: { totalAmount: true, status: true },
      },
    },
  })

  const result = clients
    .map((c) => {
      const revenue = c.invoices
        .filter((inv) => inv.status === 'PAID')
        .reduce((sum, inv) => sum + toNumber(inv.totalAmount), 0)

      return {
        id: c.id,
        name: c.name,
        revenue: Math.round(revenue * 100) / 100,
        projectCount: c.projects.length,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return result
}

async function getTeamUtilization(workspaceId: string): Promise<TeamUtilizationMember[]> {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: {
      id: true,
      user: {
        select: { id: true, name: true },
      },
    },
  })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const memberIds = members.map((m) => m.user.id)

  const [hoursAgg, taskCounts] = await Promise.all([
    prisma.timeEntry.groupBy({
      by: ['userId'],
      where: {
        workspaceId,
        userId: { in: memberIds },
        status: 'APPROVED',
        startTime: { gte: monthStart },
        deletedAt: null,
      },
      _sum: { durationMinutes: true },
    }),
    prisma.task.groupBy({
      by: ['assigneeId'],
      where: {
        assigneeId: { in: memberIds },
        project: { workspaceId },
        deletedAt: null,
      },
      _count: { id: true },
    }),
  ])

  const hoursByUser = new Map(hoursAgg.map((h) => [h.userId, toNumber(h._sum.durationMinutes) / 60]))
  const tasksByUser = new Map(taskCounts.map((t) => [t.assigneeId, t._count.id]))

  const workingDays = getWorkingDaysThisMonth()
  const availableHours = workingDays * 8

  return members.map((m) => {
    const hoursLogged = Math.round((hoursByUser.get(m.user.id) ?? 0) * 100) / 100
    const assignedTasks = tasksByUser.get(m.user.id) ?? 0
    const utilization = availableHours > 0 ? Math.round((hoursLogged / availableHours) * 100) : 0

    return {
      id: m.id,
      name: m.user.name ?? 'Unknown',
      hoursLogged,
      assignedTasks,
      utilization,
    }
  })
}

export const getReportWorkspacePermission = () => 'report:workspace' as const
