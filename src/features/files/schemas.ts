import { z } from 'zod'

export const fileAttachmentSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  projectId: z.string().nullable(),
  clientId: z.string().nullable(),
  uploadedById: z.string().nullable(),
  name: z.string(),
  originalName: z.string(),
  size: z.number(),
  type: z.string(),
  key: z.string(),
  url: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type FileAttachment = z.output<typeof fileAttachmentSchema>
