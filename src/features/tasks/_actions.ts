'use server'

import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions, AuthorizationError } from '@/lib/rbac'
import { WorkspaceRole } from '@prisma/client'
import { createNotification } from '@/lib/notifications'
import {
  createTaskSchema,
  updateTaskSchema,
  reorderTasksSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type ReorderTasksInput,
} from '@/features/projects/schemas'
import {
  findTaskById,
  getMaxSortOrder,
  listTasksByProject,
  findProjectById,
} from '@/features/projects/queries'
import type { Task } from '@prisma/client'

export type TaskActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type TaskWithAssignee = Task & {
  assignee: { id: string; name: string; avatarUrl: string | null } | null
}

function ok<T>(data: T): TaskActionResult<T> {
  return { success: true, data }
}

function err(error: string): TaskActionResult<never> {
  return { success: false, error }
}

const taskInclude = {
  assignee: { select: { id: true, name: true, avatarUrl: true } },
} as const

export async function createTask(
  workspaceId: string,
  input: CreateTaskInput,
): Promise<TaskActionResult<TaskWithAssignee>> {
  try {
    const parsed = createTaskSchema.parse(input)
    const ctx = await createWorkspaceContext(workspaceId)

    const project = await findProjectById(parsed.projectId, ctx.member.workspaceId)
    if (!project) return err('Project not found')

    const canCreate = ctx.ability.can(Permissions.TaskCreate)
    const canCreateOwn = ctx.ability.can(Permissions.TaskCreateOwn)

    if (!canCreate && !canCreateOwn) {
      return err('You do not have permission to create tasks')
    }

    if (!canCreate && canCreateOwn) {
      if (parsed.assigneeId && parsed.assigneeId !== ctx.session.userId) {
        return err('You can only create tasks assigned to yourself')
      }
    }

    if (parsed.assigneeId) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: ctx.member.workspaceId, userId: parsed.assigneeId },
        },
      })
      if (!member) return err('Assignee is not a member of this workspace')
    }

    const maxOrder = await getMaxSortOrder(parsed.projectId)

    const task = await prisma.task.create({
      data: {
        projectId: parsed.projectId,
        assigneeId: parsed.assigneeId ?? null,
        title: parsed.title,
        description: parsed.description ?? null,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        sortOrder: maxOrder + 1,
      },
      include: { ...taskInclude, project: { select: { name: true } } },
    })

    if (parsed.assigneeId && parsed.assigneeId !== ctx.session.userId) {
      await createNotification({
        workspaceId: ctx.member.workspaceId,
        userId: parsed.assigneeId,
        type: 'TASK_ASSIGNED',
        title: `You were assigned to "${parsed.title}"`,
        message: `In project "${(task as any).project?.name ?? 'Unknown'}"`,
        link: `/projects/${parsed.projectId}`,
        actorId: ctx.session.userId,
      })
    }

    return ok(task as unknown as TaskWithAssignee)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function updateTask(
  workspaceId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskActionResult<TaskWithAssignee>> {
  try {
    const parsed = updateTaskSchema.parse(input)
    const ctx = await createWorkspaceContext(workspaceId)

    const task = await findTaskById(taskId)
    if (!task) return err('Task not found')
    if (task.project?.workspaceId !== workspaceId) return err('Task not found')

    const canUpdate = ctx.ability.can(Permissions.TaskUpdate)
    const canUpdateOwn = ctx.ability.can(Permissions.TaskUpdateOwn)

    if (!canUpdate && !canUpdateOwn) {
      return err('You do not have permission to update tasks')
    }

    if (!canUpdate && canUpdateOwn) {
      if (task.assigneeId !== ctx.session.userId) {
        return err('You can only update tasks assigned to you')
      }
    }

    if (parsed.assigneeId) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: parsed.assigneeId },
        },
      })
      if (!member) return err('Assignee is not a member of this workspace')
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(parsed.title !== undefined && { title: parsed.title }),
        ...(parsed.description !== undefined && { description: parsed.description }),
        ...(parsed.status !== undefined && { status: parsed.status }),
        ...(parsed.assigneeId !== undefined && { assigneeId: parsed.assigneeId }),
        ...(parsed.dueDate !== undefined && {
          dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        }),
      },
      include: { ...taskInclude, project: { select: { name: true } } },
    })

    if (parsed.assigneeId && parsed.assigneeId !== ctx.session.userId && parsed.assigneeId !== task.assigneeId) {
      await createNotification({
        workspaceId: ctx.member.workspaceId,
        userId: parsed.assigneeId,
        type: 'TASK_ASSIGNED',
        title: `You were assigned to "${parsed.title ?? task.title}"`,
        message: `In project "${(updated as any).project?.name ?? 'Unknown'}"`,
        link: `/projects/${task.projectId}`,
        actorId: ctx.session.userId,
      })
    }

    return ok(updated as unknown as TaskWithAssignee)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function deleteTask(
  workspaceId: string,
  taskId: string,
): Promise<TaskActionResult<{ id: string }>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    const task = await findTaskById(taskId)
    if (!task) return err('Task not found')
    if (task.project?.workspaceId !== workspaceId) return err('Task not found')

    if (!ctx.ability.can(Permissions.TaskDelete)) {
      return err('You do not have permission to delete tasks')
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    })

    return ok({ id: taskId })
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function reorderTasks(
  workspaceId: string,
  input: ReorderTasksInput,
): Promise<TaskActionResult<{ success: boolean }>> {
  try {
    const parsed = reorderTasksSchema.parse(input)
    const ctx = await createWorkspaceContext(workspaceId)

    const project = await findProjectById(parsed.projectId, ctx.member.workspaceId)
    if (!project) return err('Project not found')

    const canUpdate = ctx.ability.can(Permissions.TaskUpdate)
    const canUpdateOwn = ctx.ability.can(Permissions.TaskUpdateOwn)

    if (!canUpdate && !canUpdateOwn) {
      return err('You do not have permission to reorder tasks')
    }

    await prisma.$transaction(
      parsed.taskIds.map((id, index) =>
        prisma.task.update({
          where: { id },
          data: { sortOrder: (index + 1) * 1000 },
        }),
      ),
    )

    return ok({ success: true })
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}
