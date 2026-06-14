import { z } from 'zod'

export const startTimerSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid().optional().nullable().default(null),
  description: z.string().max(2000).optional().nullable().default(null),
})

export const stopTimerSchema = z.object({
  entryId: z.string().uuid(),
})

export const submitTimeEntrySchema = z.object({
  entryId: z.string().uuid(),
})

export const approveTimeEntrySchema = z.object({
  entryId: z.string().uuid(),
})

export const rejectTimeEntrySchema = z.object({
  entryId: z.string().uuid(),
})

export type StartTimerInput = z.infer<typeof startTimerSchema>
export type StopTimerInput = z.infer<typeof stopTimerSchema>
export type SubmitTimeEntryInput = z.infer<typeof submitTimeEntrySchema>
export type ApproveTimeEntryInput = z.infer<typeof approveTimeEntrySchema>
export type RejectTimeEntryInput = z.infer<typeof rejectTimeEntrySchema>
