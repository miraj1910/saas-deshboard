'use client'

import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { TaskStatus } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} from '@/features/tasks/_actions'
import { createTaskSchema, updateTaskSchema } from '@/features/projects/schemas'
import type { TaskStatus as _TaskStatus } from '@prisma/client'

type MemberInfo = { id: string; name: string; avatarUrl: string | null }

type TaskForDisplay = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  assigneeId: string | null
  assigneeName: string | null
  dueDate: Date | null
  sortOrder: number
}

type FieldErrors = Record<string, string>

const taskStatusConfig: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

function toTaskDisplay(task: any, memberMap: Map<string, MemberInfo>): TaskForDisplay {
  const assignee = task.assigneeId ? memberMap.get(task.assigneeId) : null
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    assigneeId: task.assigneeId,
    assigneeName: assignee?.name ?? null,
    dueDate: task.dueDate,
    sortOrder: task.sortOrder,
  }
}

type TaskListProps = {
  projectId: string
  workspaceId: string
  initialTasks: any[]
  members: MemberInfo[]
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export function TaskList({
  projectId,
  workspaceId,
  initialTasks,
  members,
  canCreate,
  canUpdate,
  canDelete,
}: TaskListProps) {
  const memberMap = new Map(members.map((m) => [m.id, m]))

  const [tasks, setTasks] = useState<TaskForDisplay[]>(() =>
    initialTasks.map((t) => toTaskDisplay(t, memberMap)),
  )
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskForDisplay | null>(null)

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function resetForm() {
    setActionError('')
    setFieldErrors({})
    setActionLoading(false)
  }

  function updateTaskInList(taskId: string, updates: Partial<TaskForDisplay>) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)))
  }

  function openCreate() {
    resetForm()
    setCreateOpen(true)
  }

  function openEdit(task: TaskForDisplay) {
    setSelectedTask(task)
    resetForm()
    setEditOpen(true)
  }

  function openDelete(task: TaskForDisplay) {
    setSelectedTask(task)
    resetForm()
    setDeleteOpen(true)
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    setUpdatingIds((prev) => new Set(prev).add(taskId))
    setInlineError(null)
    const result = await updateTask(workspaceId, taskId, { status: newStatus as TaskStatus })
    if (result.success) {
      updateTaskInList(taskId, { status: newStatus as TaskStatus })
    } else {
      setInlineError(result.error)
    }
    setUpdatingIds((prev) => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }

  async function handleAssigneeChange(taskId: string, newAssigneeId: string) {
    setUpdatingIds((prev) => new Set(prev).add(taskId))
    setInlineError(null)
    const assignee = newAssigneeId ? memberMap.get(newAssigneeId) : null
    const result = await updateTask(workspaceId, taskId, {
      assigneeId: newAssigneeId || null,
    })
    if (result.success) {
      updateTaskInList(taskId, {
        assigneeId: newAssigneeId || null,
        assigneeName: assignee?.name ?? null,
      })
    } else {
      setInlineError(result.error)
    }
    setUpdatingIds((prev) => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    resetForm()
    setActionLoading(true)

    const fd = new FormData(e.currentTarget)
    const raw = {
      projectId,
      title: fd.get('title') as string,
      description: (fd.get('description') as string) || null,
      assigneeId: (fd.get('assigneeId') as string) || null,
      dueDate: (fd.get('dueDate') as string) || null,
    }

    const parsed = createTaskSchema.safeParse(raw)
    if (!parsed.success) {
      const errs: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.')
        if (!errs[path]) errs[path] = issue.message
      }
      setFieldErrors(errs)
      setActionLoading(false)
      return
    }

    const result = await createTask(workspaceId, parsed.data)
    if (result.success) {
      setTasks((prev) => [...prev, toTaskDisplay(result.data, memberMap)])
      setCreateOpen(false)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedTask) return
    resetForm()
    setActionLoading(true)

    const fd = new FormData(e.currentTarget)
    const raw: Record<string, unknown> = {
      title: fd.get('title') as string,
      description: (fd.get('description') as string) || null,
      dueDate: (fd.get('dueDate') as string) || null,
    }

    const parsed = updateTaskSchema.safeParse(raw)
    if (!parsed.success) {
      const errs: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.')
        if (!errs[path]) errs[path] = issue.message
      }
      setFieldErrors(errs)
      setActionLoading(false)
      return
    }

    const result = await updateTask(workspaceId, selectedTask.id, parsed.data)
    if (result.success) {
      updateTaskInList(selectedTask.id, {
        title: result.data.title,
        description: result.data.description,
        dueDate: result.data.dueDate,
      })
      setEditOpen(false)
      setSelectedTask(null)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  async function handleDelete() {
    if (!selectedTask) return
    resetForm()
    setActionLoading(true)

    const result = await deleteTask(workspaceId, selectedTask.id)
    if (result.success) {
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id))
      setDeleteOpen(false)
      setSelectedTask(null)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  async function handleMoveUp(index: number) {
    if (index <= 0) return
    const newOrder = [...tasks]
    const [moved] = newOrder.splice(index, 1)
    newOrder.splice(index - 1, 0, moved)

    const taskIds = newOrder.map((t) => t.id)
    const result = await reorderTasks(workspaceId, { projectId, taskIds })
    if (result.success) {
      setTasks(newOrder)
    }
  }

  async function handleMoveDown(index: number) {
    if (index >= tasks.length - 1) return
    const newOrder = [...tasks]
    const [moved] = newOrder.splice(index, 1)
    newOrder.splice(index + 1, 0, moved)

    const taskIds = newOrder.map((t) => t.id)
    const result = await reorderTasks(workspaceId, { projectId, taskIds })
    if (result.success) {
      setTasks(newOrder)
    }
  }

  if (tasks.length === 0 && !canCreate) {
    return (
      <div className="px-5 py-8 text-center text-sm text-muted-foreground">
        No tasks yet.
      </div>
    )
  }

  return (
    <>
      {inlineError && (
        <div className="mx-4 mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {inlineError}
        </div>
      )}
      {tasks.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          <p>No tasks yet.</p>
          {canCreate && (
            <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create Task
            </Button>
          )}
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th scope="col" className="w-16 px-4 py-3 font-medium">Order</th>
                  <th scope="col" className="px-4 py-3 font-medium">Title</th>
                  <th scope="col" className="w-32 px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="w-40 px-4 py-3 font-medium">Assignee</th>
                  <th scope="col" className="w-28 px-4 py-3 font-medium">Due Date</th>
                  {canUpdate && <th scope="col" className="w-24 px-4 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={index === 0}
                          onClick={() => handleMoveUp(index)}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                          <span className="sr-only">Move up</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={index === tasks.length - 1}
                          onClick={() => handleMoveDown(index)}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                          <span className="sr-only">Move down</span>
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-medium">{task.title}</td>
                    <td className="px-4 py-2.5">
                      {canUpdate ? (
                        <Select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="h-7 text-xs"
                          disabled={updatingIds.has(task.id)}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </Select>
                      ) : (
                        <span className="text-xs">{taskStatusConfig[task.status]}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {canUpdate ? (
                        <Select
                          value={task.assigneeId ?? ''}
                          onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                          className="h-7 text-xs"
                          disabled={updatingIds.has(task.id)}
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {task.assigneeName ?? 'Unassigned'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {fmtDate(task.dueDate)}
                    </td>
                    {canUpdate && (
                      <td className="px-4 py-2.5 text-right">
                        {updatingIds.has(task.id) ? (
                          <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(task)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openDelete(task)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canCreate && (
            <div className="border-t px-4 py-3">
              <Button variant="outline" size="sm" onClick={openCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add Task
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Add a task to this project.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Title *</Label>
                <Input id="task-title" name="title" placeholder="Task title" required />
                {fieldErrors.title && <p className="text-xs text-destructive">{fieldErrors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea id="task-description" name="description" placeholder="Task description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-assignee">Assignee</Label>
                  <Select id="task-assignee" name="assigneeId" defaultValue="">
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-due">Due Date</Label>
                  <Input id="task-due" name="dueDate" type="date" />
                </div>
              </div>
              {actionError && (
                <p className="text-sm text-destructive">{actionError}</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm" disabled={actionLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} key={selectedTask?.id ?? 'edit'}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-task-title">Title *</Label>
                <Input
                  id="edit-task-title"
                  name="title"
                  defaultValue={selectedTask?.title ?? ''}
                  required
                />
                {fieldErrors.title && <p className="text-xs text-destructive">{fieldErrors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-description">Description</Label>
                <Textarea
                  id="edit-task-description"
                  name="description"
                  defaultValue={selectedTask?.description ?? ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-due">Due Date</Label>
                <Input
                  id="edit-task-due"
                  name="dueDate"
                  type="date"
                  defaultValue={
                    selectedTask?.dueDate
                      ? new Date(selectedTask.dueDate).toISOString().split('T')[0]
                      : ''
                  }
                />
              </div>
              {actionError && (
                <p className="text-sm text-destructive">{actionError}</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm" disabled={actionLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{selectedTask?.title ?? 'this task'}&rdquo;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <p className="text-sm text-destructive">{actionError}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" disabled={actionLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={actionLoading}
              onClick={handleDelete}
            >
              {actionLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
