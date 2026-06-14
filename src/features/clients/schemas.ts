import { z } from 'zod'
import { ClientStatus } from '@prisma/client'

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email().optional().nullable().default(null),
  phone: z.string().max(50).optional().nullable().default(null),
  company: z.string().max(200).optional().nullable().default(null),
  notes: z.string().max(2000).optional().nullable().default(null),
})

export const updateClientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.nativeEnum(ClientStatus).optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
