import { z } from 'zod'
import { ProjectStatus, TaskStatus } from '@prisma/client'

export const createProjectSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional().nullable().default(null),
  hourlyRate: z.number().min(0).max(999999.99).optional().default(0),
  startDate: z.string().date().optional().nullable().default(null),
  dueDate: z.string().date().optional().nullable().default(null),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  hourlyRate: z.number().min(0).max(999999.99).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.string().date().optional().nullable(),
  dueDate: z.string().date().optional().nullable(),
})

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  assigneeId: z.string().uuid().optional().nullable().default(null),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable().default(null),
  dueDate: z.string().date().optional().nullable().default(null),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().date().optional().nullable(),
})

export const reorderTasksSchema = z.object({
  projectId: z.string().uuid(),
  taskIds: z.array(z.string().uuid()).min(1),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>
