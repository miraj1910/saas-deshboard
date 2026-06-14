import { prisma } from '@/lib/prisma'
import type { PortalDashboardData, PortalProject, PortalTask, PortalInvoice, PortalRequest } from './types'

function toNumber(value: { toNumber: () => number } | number | string | null | undefined): number {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  return value.toNumber()
}

export async function getPortalDashboardData(
  workspaceId: string,
  clientId: string,
): Promise<PortalDashboardData> {
  const [projects, invoices, requests] = await Promise.all([
    prisma.project.findMany({
      where: { workspaceId, clientId, deletedAt: null },
      select: { id: true, name: true, status: true, description: true, startDate: true, dueDate: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.findMany({
      where: { workspaceId, clientId, deletedAt: null },
      select: {
        id: true, invoiceNumber: true, status: true, totalAmount: true,
        issuedDate: true, dueDate: true, paidAt: true, notes: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.clientRequest.findMany({
      where: { workspaceId, clientId },
      select: { id: true, status: true },
    }),
  ])

  return {
    projectCount: projects.length,
    activeProjectCount: projects.filter((p) => p.status === 'ACTIVE').length,
    invoiceCount: invoices.length,
    outstandingInvoiceCount: invoices.filter((i) => i.status === 'SENT' || i.status === 'OVERDUE').length,
    outstandingInvoiceAmount: invoices
      .filter((i) => i.status === 'SENT' || i.status === 'OVERDUE')
      .reduce((sum, i) => sum + toNumber(i.totalAmount), 0),
    requestCount: requests.length,
    openRequestCount: requests.filter((r) => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length,
    recentInvoices: invoices.slice(0, 5).map((i) => ({
      ...i,
      totalAmount: toNumber(i.totalAmount),
      issuedDate: i.issuedDate.toISOString(),
      dueDate: i.dueDate.toISOString(),
      paidAt: i.paidAt?.toISOString() ?? null,
    })),
    recentProjects: projects.slice(0, 5).map((p) => ({
      ...p,
      hourlyRate: 0,
      startDate: p.startDate?.toISOString() ?? null,
      dueDate: p.dueDate?.toISOString() ?? null,
    })),
  }
}

export async function getClientProjects(
  workspaceId: string,
  clientId: string,
): Promise<PortalProject[]> {
  const projects = await prisma.project.findMany({
    where: { workspaceId, clientId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    hourlyRate: toNumber(p.hourlyRate),
    startDate: p.startDate?.toISOString() ?? null,
    dueDate: p.dueDate?.toISOString() ?? null,
  }))
}

export async function getClientProjectById(
  workspaceId: string,
  clientId: string,
  projectId: string,
): Promise<PortalProject | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId, clientId, deletedAt: null },
  })

  if (!project) return null

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    hourlyRate: toNumber(project.hourlyRate),
    startDate: project.startDate?.toISOString() ?? null,
    dueDate: project.dueDate?.toISOString() ?? null,
  }
}

export async function getClientProjectTasks(
  workspaceId: string,
  clientId: string,
  projectId: string,
): Promise<PortalTask[]> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId, clientId, deletedAt: null },
    select: { id: true },
  })

  if (!project) return []

  const tasks = await prisma.task.findMany({
    where: { projectId: project.id, deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, title: true, description: true, status: true, dueDate: true },
  })

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    dueDate: t.dueDate?.toISOString() ?? null,
  }))
}

export async function getClientInvoices(
  workspaceId: string,
  clientId: string,
): Promise<PortalInvoice[]> {
  const invoices = await prisma.invoice.findMany({
    where: { workspaceId, clientId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  return invoices.map((i) => ({
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    status: i.status,
    totalAmount: toNumber(i.totalAmount),
    issuedDate: i.issuedDate.toISOString(),
    dueDate: i.dueDate.toISOString(),
    paidAt: i.paidAt?.toISOString() ?? null,
    notes: i.notes,
  }))
}

export async function getClientRequests(
  workspaceId: string,
  clientId: string,
): Promise<PortalRequest[]> {
  const requests = await prisma.clientRequest.findMany({
    where: { workspaceId, clientId },
    orderBy: { createdAt: 'desc' },
  })

  return requests.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))
}
