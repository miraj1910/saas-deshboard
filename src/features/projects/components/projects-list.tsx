'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Search as SearchIcon, Pencil, Archive, Loader2 } from 'lucide-react'
import { ProjectStatus } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
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
  listProjects,
  createProject,
  updateProject,
  archiveProject,
} from '@/features/projects/_actions'
import { createProjectSchema, updateProjectSchema } from '@/features/projects/schemas'
import type { ProjectWithRelations } from '@/features/projects/queries'

type ClientOption = { id: string; name: string; company: string | null }

type ProjectForDisplay = {
  id: string
  name: string
  clientName: string | null
  clientId: string
  status: ProjectStatus
  hourlyRate: number
  dueDate: Date | null
  taskCount: number
}

type FieldErrors = Record<string, string>

const projectStatusConfig: Record<ProjectStatus, { label: string; variant: 'success' | 'default' | 'outline' }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  COMPLETED: { label: 'Completed', variant: 'default' },
  ARCHIVED: { label: 'Archived', variant: 'outline' },
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

function fmtCurrency(n: unknown): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(n))
}

function toDisplay(c: ProjectWithRelations): ProjectForDisplay {
  return {
    id: c.id,
    name: c.name,
    clientName: c.client ? (c.client.company ?? c.client.name) : null,
    clientId: c.clientId,
    status: c.status,
    hourlyRate: Number(c.hourlyRate),
    dueDate: c.dueDate,
    taskCount: c._count?.tasks ?? 0,
  }
}

type ProjectsListProps = {
  workspaceId: string
  clients: ClientOption[]
  canCreate: boolean
  canEdit: boolean
  canArchive: boolean
}

export function ProjectsList({ workspaceId, clients, canCreate, canEdit, canArchive }: ProjectsListProps) {
  const params = useParams()
  const slug = params?.workspaceSlug as string

  const [projects, setProjects] = useState<ProjectForDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectForDisplay | null>(null)

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const load = useCallback(async () => {
    setLoading(true)
    const result = await listProjects(workspaceId)
    if (result.success) {
      setProjects(result.data.map(toDisplay))
    }
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    load()
  }, [load])

  const filtered = search.trim()
    ? projects.filter((p) => {
        const q = search.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          (p.clientName ?? '').toLowerCase().includes(q)
        )
      })
    : projects

  function resetForm() {
    setActionError('')
    setFieldErrors({})
    setActionLoading(false)
  }

  function getFormData(form: HTMLFormElement) {
    const fd = new FormData(form)
    return {
      name: fd.get('name') as string,
      clientId: fd.get('clientId') as string,
      description: (fd.get('description') as string) || null,
      hourlyRate: fd.get('hourlyRate') ? Number(fd.get('hourlyRate')) : undefined,
      startDate: (fd.get('startDate') as string) || null,
      dueDate: (fd.get('dueDate') as string) || null,
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    resetForm()
    setActionLoading(true)

    const raw = getFormData(e.currentTarget)
    const parsed = createProjectSchema.safeParse(raw)
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

    const result = await createProject(workspaceId, parsed.data)
    if (result.success) {
      setProjects((prev) => [toDisplay(result.data), ...prev])
      setCreateOpen(false)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedProject) return
    resetForm()
    setActionLoading(true)

    const fd = new FormData(e.currentTarget)
    const raw: Record<string, unknown> = {
      name: fd.get('name') as string,
      description: (fd.get('description') as string) || null,
      hourlyRate: fd.get('hourlyRate') ? Number(fd.get('hourlyRate')) : undefined,
      status: fd.get('status') as string,
      startDate: (fd.get('startDate') as string) || null,
      dueDate: (fd.get('dueDate') as string) || null,
    }

    const parsed = updateProjectSchema.safeParse(raw)
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

    const result = await updateProject(workspaceId, selectedProject.id, parsed.data)
    if (result.success) {
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProject.id ? toDisplay(result.data) : p)),
      )
      setEditOpen(false)
      setSelectedProject(null)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  async function handleArchive() {
    if (!selectedProject) return
    resetForm()
    setActionLoading(true)

    const result = await archiveProject(workspaceId, selectedProject.id)
    if (result.success) {
      setProjects((prev) =>
        prev.map((p) => (p.id === selectedProject.id ? toDisplay(result.data) : p)),
      )
      setArchiveOpen(false)
      setSelectedProject(null)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  function openEdit(project: ProjectForDisplay) {
    setSelectedProject(project)
    resetForm()
    setEditOpen(true)
  }

  function openArchive(project: ProjectForDisplay) {
    setSelectedProject(project)
    resetForm()
    setArchiveOpen(true)
  }

  function openCreate() {
    resetForm()
    setCreateOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">All Projects</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 pl-8 text-sm"
                aria-label="Search projects"
              />
            </div>
            {canCreate && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                New Project
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              {projects.length === 0
                ? 'No projects yet. Create your first project to get started.'
                : 'No projects match your search.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                    <th scope="col" className="px-5 py-3 font-medium">Name</th>
                    <th scope="col" className="px-5 py-3 font-medium">Client</th>
                    <th scope="col" className="px-5 py-3 font-medium">Status</th>
                    <th scope="col" className="px-5 py-3 font-medium">Budget</th>
                    <th scope="col" className="px-5 py-3 font-medium">Deadline</th>
                    <th scope="col" className="px-5 py-3 font-medium">Tasks</th>
                    {(canEdit || canArchive) && (
                      <th scope="col" className="px-5 py-3 font-medium text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((project) => (
                    <tr key={project.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium">
                        <Link
                          href={`/${slug}/projects/${project.id}`}
                          className="hover:text-teal-600 transition-colors"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {project.clientName ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={projectStatusConfig[project.status].variant}>
                          {projectStatusConfig[project.status].label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {fmtCurrency(project.hourlyRate)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {fmtDate(project.dueDate)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{project.taskCount}</td>
                      {(canEdit || canArchive) && (
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {canEdit && project.status !== 'ARCHIVED' && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEdit(project)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            )}
                            {canArchive && project.status !== 'ARCHIVED' && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openArchive(project)}
                              >
                                <Archive className="h-4 w-4" />
                                <span className="sr-only">Archive</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>Create a new project for a client.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Name *</Label>
                <Input id="create-name" name="name" placeholder="Project name" required />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-client">Client *</Label>
                <Select id="create-client" name="clientId" required>
                  <option value="">Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.company ? ` (${c.company})` : ''}
                    </option>
                  ))}
                </Select>
                {fieldErrors.clientId && <p className="text-xs text-destructive">{fieldErrors.clientId}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <Textarea id="create-description" name="description" placeholder="Project description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-rate">Hourly Rate ($)</Label>
                  <Input id="create-rate" name="hourlyRate" type="number" min="0" step="0.01" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-status">Status</Label>
                  <Input id="create-status" value="Active" disabled className="text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-start">Start Date</Label>
                  <Input id="create-start" name="startDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-due">Due Date</Label>
                  <Input id="create-due" name="dueDate" type="date" />
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
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} key={selectedProject?.id ?? 'edit'}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={selectedProject?.name ?? ''}
                  placeholder="Project name"
                  required
                />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-client">Client</Label>
                <Input
                  id="edit-client"
                  value={selectedProject?.clientName ?? ''}
                  disabled
                  className="text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={''}
                  placeholder="Project description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-rate">Hourly Rate ($)</Label>
                  <Input
                    id="edit-rate"
                    name="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={selectedProject?.hourlyRate?.toString() ?? ''}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select id="edit-status" name="status" defaultValue={selectedProject?.status ?? 'ACTIVE'}>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start">Start Date</Label>
                  <Input
                    id="edit-start"
                    name="startDate"
                    type="date"
                    defaultValue={selectedProject?.dueDate ? new Date(selectedProject.dueDate).toISOString().split('T')[0] : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-due">Due Date</Label>
                  <Input
                    id="edit-due"
                    name="dueDate"
                    type="date"
                    defaultValue={selectedProject?.dueDate ? new Date(selectedProject.dueDate).toISOString().split('T')[0] : ''}
                  />
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
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive {selectedProject?.name ?? 'this project'}? This won&apos;t
              delete any associated tasks or time entries.
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
              onClick={handleArchive}
            >
              {actionLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
