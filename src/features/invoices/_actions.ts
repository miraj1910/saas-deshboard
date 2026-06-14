'use server'

import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions, AuthorizationError } from '@/lib/rbac'
import { createNotification } from '@/lib/notifications'
import { sendInvoiceSentEmail } from '@/lib/email'
import { config } from '@/lib/config'
import {
  createInvoiceSchema,
  sendInvoiceSchema,
  markPaidSchema,
  voidInvoiceSchema,
  type CreateInvoiceInput,
} from '@/features/invoices/schemas'
import {
  findInvoiceById,
  listInvoices,
  getNextInvoiceNumber,
  getApprovedTimeEntriesForClient,
  type InvoiceWithRelations,
} from '@/features/invoices/queries'

export type InvoiceActionResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}

function ok<T>(data: T): InvoiceActionResult<T> {
  return { success: true, data }
}

function err(error: string): InvoiceActionResult<never> {
  return { success: false, error }
}

export async function listWorkspaceInvoices(
  workspaceId: string,
): Promise<InvoiceActionResult<InvoiceWithRelations[]>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    const canRead = ctx.ability.can(Permissions.InvoiceRead)
    const canReadOwn = ctx.ability.can(Permissions.InvoiceReadOwn)

    if (!canRead && !canReadOwn) {
      return err('You do not have permission to view invoices')
    }

    const invoices = await listInvoices(ctx.member.workspaceId)
    return ok(invoices)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function getInvoice(
  workspaceId: string,
  invoiceId: string,
): Promise<InvoiceActionResult<InvoiceWithRelations | null>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    const canRead = ctx.ability.can(Permissions.InvoiceRead)
    const canReadOwn = ctx.ability.can(Permissions.InvoiceReadOwn)

    if (!canRead && !canReadOwn) {
      return err('You do not have permission to view invoices')
    }

    const invoice = await findInvoiceById(invoiceId, ctx.member.workspaceId)
    return ok(invoice)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function getApprovedTimeEntries(
  workspaceId: string,
  clientId: string,
): Promise<
  InvoiceActionResult<
    {
      id: string
      description: string | null
      durationMinutes: number
      projectName: string | null
      taskTitle: string | null
      userName: string | null
    }[]
  >
> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    const entries = await getApprovedTimeEntriesForClient(clientId, ctx.member.workspaceId)

    return ok(
      entries.map((e) => ({
        id: e.id,
        description: e.description,
        durationMinutes: e.durationMinutes,
        projectName: e.project?.name ?? null,
        taskTitle: e.task?.title ?? null,
        userName: e.user?.name ?? null,
      })),
    )
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function createInvoice(
  workspaceId: string,
  input: CreateInvoiceInput,
): Promise<InvoiceActionResult<InvoiceWithRelations>> {
  try {
    const parsed = createInvoiceSchema.parse(input)
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.InvoiceCreate)) {
      return err('You do not have permission to create invoices')
    }

    const client = await prisma.client.findFirst({
      where: { id: parsed.clientId, workspaceId: ctx.member.workspaceId, deletedAt: null },
    })
    if (!client) return err('Client not found')

    const timeEntries = await getApprovedTimeEntriesForClient(
      parsed.clientId,
      ctx.member.workspaceId,
      parsed.timeEntryIds,
    )

    if (timeEntries.length === 0) {
      return err('No approved unbilled time entries found for the specified IDs')
    }

    if (timeEntries.length !== parsed.timeEntryIds.length) {
      return err('Some time entries are not approved, already billed, or belong to a different client')
    }

    const alreadyBilled = timeEntries.filter((t) => t.invoiceItems.length > 0)
    if (alreadyBilled.length > 0) {
      return err('Some time entries are already linked to another invoice')
    }

    const invoiceNumber = await getNextInvoiceNumber(ctx.member.workspaceId)
    const issuedDate = new Date()

    const lineItems = timeEntries.map((entry, index) => {
      const hours = entry.durationMinutes / 60
      const rate = entry.project?.hourlyRate ?? 0
      return {
        timeEntryId: entry.id,
        description: entry.task?.title
          ? `[${entry.project?.name}] ${entry.task.title}`
          : `[${entry.project?.name}] ${entry.description ?? 'Time entry'}`,
        quantity: Math.round(hours * 100) / 100,
        unitPrice: Number(rate),
        amount: Math.round(hours * Number(rate) * 100) / 100,
        sortOrder: (index + 1) * 10,
      }
    })

    const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0)

    const invoice = await prisma.invoice.create({
      data: {
        workspaceId: ctx.member.workspaceId,
        clientId: parsed.clientId,
        invoiceNumber,
        status: 'DRAFT',
        totalAmount: Math.round(totalAmount * 100) / 100,
        issuedDate,
        dueDate: new Date(parsed.dueDate),
        notes: parsed.notes ?? null,
        lineItems: { create: lineItems },
      },
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

    return ok(invoice)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function sendInvoice(
  workspaceId: string,
  invoiceId: string,
): Promise<InvoiceActionResult<InvoiceWithRelations>> {
  try {
    sendInvoiceSchema.parse({ invoiceId })
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.InvoiceSend)) {
      return err('You do not have permission to send invoices')
    }

    const invoice = await findInvoiceById(invoiceId, ctx.member.workspaceId)
    if (!invoice) return err('Invoice not found')

    if (invoice.status !== 'DRAFT') {
      return err('Only draft invoices can be sent')
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'SENT' },
      include: {
        client: { select: { id: true, name: true, company: true, email: true } },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
          include: {
            timeEntry: { select: { id: true, description: true, durationMinutes: true } },
          },
        },
        _count: { select: { lineItems: true } },
      },
    })

    if (updated.client?.email) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: ctx.member.workspaceId },
        select: { name: true },
      })

      sendInvoiceSentEmail({
        email: updated.client.email,
        clientName: updated.client.name,
        invoiceNumber: updated.invoiceNumber,
        totalAmount: `$${Number(updated.totalAmount).toFixed(2)}`,
        dueDate: new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(updated.dueDate)),
        invoiceUrl: `${config.appUrl}/portal/invoices`,
        workspaceName: workspace?.name ?? '',
      }).catch(() => {})
    }

    return ok(updated)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function markPaid(
  workspaceId: string,
  invoiceId: string,
): Promise<InvoiceActionResult<InvoiceWithRelations>> {
  try {
    const parsed = markPaidSchema.parse({ invoiceId })
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.InvoiceMarkPaid)) {
      return err('You do not have permission to mark invoices as paid')
    }

    const invoice = await findInvoiceById(invoiceId, ctx.member.workspaceId)
    if (!invoice) return err('Invoice not found')

    if (invoice.status !== 'SENT' && invoice.status !== 'OVERDUE') {
      return err('Only sent or overdue invoices can be marked as paid')
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(parsed.paidAt),
      },
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

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId, userId: { not: ctx.session.userId } },
      select: { userId: true },
    })

    await Promise.all(
      members.map((m) =>
        createNotification({
          workspaceId: ctx.member.workspaceId,
          userId: m.userId,
          type: 'INVOICE_PAID',
          title: `Invoice ${updated.invoiceNumber} has been paid`,
          message: updated.client?.name
            ? `From ${updated.client.name} - $${Number(updated.totalAmount).toFixed(2)}`
            : `$${Number(updated.totalAmount).toFixed(2)}`,
          link: `/invoices/${invoiceId}`,
          actorId: ctx.session.userId,
        }),
      ),
    )

    return ok(updated)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function voidInvoice(
  workspaceId: string,
  invoiceId: string,
): Promise<InvoiceActionResult<InvoiceWithRelations>> {
  try {
    voidInvoiceSchema.parse({ invoiceId })
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.InvoiceVoid)) {
      return err('You do not have permission to void invoices')
    }

    const invoice = await findInvoiceById(invoiceId, ctx.member.workspaceId)
    if (!invoice) return err('Invoice not found')

    if (invoice.status === 'PAID' || invoice.status === 'CANCELED') {
      return err('Paid or already canceled invoices cannot be voided')
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELED' },
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

    return ok(updated)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}
