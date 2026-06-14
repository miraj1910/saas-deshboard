import { prisma } from '@/lib/prisma'
import type { Invoice, InvoiceLineItem, Client } from '@prisma/client'

export type InvoiceWithRelations = Invoice & {
  client?: Pick<Client, 'id' | 'name' | 'company'> | null
  lineItems?: (InvoiceLineItem & {
    timeEntry?: { id: string; description: string | null; durationMinutes: number } | null
  })[]
  _count?: { lineItems: number }
}

export async function findInvoiceById(invoiceId: string, workspaceId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, workspaceId, deletedAt: null },
    include: {
      client: { select: { id: true, name: true, company: true } },
      lineItems: {
        orderBy: { sortOrder: 'asc' },
        include: {
          timeEntry: { select: { id: true, description: true, durationMinutes: true } },
        },
      },
      _count: { select: { lineItems: true } },
    },
  })
}

export async function listInvoices(workspaceId: string) {
  return prisma.invoice.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true, company: true } },
      _count: { select: { lineItems: true } },
    },
  })
}

export async function getNextInvoiceNumber(workspaceId: string): Promise<string> {
  const last = await prisma.invoice.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: { invoiceNumber: true },
  })

  if (!last) return 'INV-0001'

  const num = parseInt(last.invoiceNumber.replace('INV-', ''), 10)
  const next = num + 1
  return `INV-${String(next).padStart(4, '0')}`
}

export async function getApprovedTimeEntriesForClient(
  clientId: string,
  workspaceId: string,
  timeEntryIds?: string[],
) {
  const where: any = {
    workspaceId,
    project: { clientId },
    status: 'APPROVED',
    invoiceItems: { none: {} },
    deletedAt: null,
  }

  if (timeEntryIds) {
    where.id = { in: timeEntryIds }
  }

  return prisma.timeEntry.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, hourlyRate: true } },
      task: { select: { id: true, title: true } },
      user: { select: { id: true, name: true } },
      invoiceItems: { select: { id: true } },
    },
  })
}

export async function getUnbilledTimeEntryIds(
  timeEntryIds: string[],
  workspaceId: string,
): Promise<string[]> {
  const billed = await prisma.invoiceLineItem.findMany({
    where: {
      timeEntryId: { in: timeEntryIds },
      invoice: { workspaceId },
    },
    select: { timeEntryId: true },
  })

  const billedIds = new Set(billed.map((b) => b.timeEntryId))
  return timeEntryIds.filter((id) => !billedIds.has(id))
}
