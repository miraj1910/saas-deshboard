import { z } from 'zod'

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  timeEntryIds: z.array(z.string().uuid()).min(1, 'At least one time entry is required'),
  dueDate: z.string().date(),
  notes: z.string().max(2000).optional().nullable().default(null),
})

export const sendInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
})

export const markPaidSchema = z.object({
  invoiceId: z.string().uuid(),
  paidAt: z.string().date().optional().default(() => new Date().toISOString().split('T')[0]),
})

export const voidInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type SendInvoiceInput = z.infer<typeof sendInvoiceSchema>
export type MarkPaidInput = z.infer<typeof markPaidSchema>
export type VoidInvoiceInput = z.infer<typeof voidInvoiceSchema>
