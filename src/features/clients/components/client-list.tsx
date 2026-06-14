'use client'

import { useState, useCallback, useEffect } from 'react'
import { Plus, Search as SearchIcon, Pencil, Archive, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ClientStatus } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
  listClients,
  createClient,
  updateClient,
  archiveClient,
} from '@/features/clients/_actions'
import { createClientSchema, updateClientSchema } from '@/features/clients/schemas'
import type { ClientWithRelations } from '@/features/clients/queries'

type ClientForDisplay = {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  status: ClientStatus
  createdAt: Date
}

type FieldErrors = Record<string, string>

const statusConfig: Record<ClientStatus, { label: string; variant: 'success' | 'warning' | 'secondary' | 'outline' }> = {
  LEAD: { label: 'Lead', variant: 'secondary' },
  ACTIVE: { label: 'Active', variant: 'success' },
  INACTIVE: { label: 'Inactive', variant: 'warning' },
  ARCHIVED: { label: 'Archived', variant: 'outline' },
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

function toDisplay(c: ClientWithRelations): ClientForDisplay {
  return {
    id: c.id,
    name: c.name,
    company: c.company,
    email: c.email,
    phone: c.phone,
    status: c.status,
    createdAt: c.createdAt,
  }
}

type ClientsListProps = {
  workspaceId: string
  canCreate: boolean
  canEdit: boolean
  canArchive: boolean
}

export function ClientsList({ workspaceId, canCreate, canEdit, canArchive }: ClientsListProps) {
  const params = useParams()
  const slug = params?.workspaceSlug as string
  const [clients, setClients] = useState<ClientForDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientForDisplay | null>(null)

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const load = useCallback(async () => {
    setLoading(true)
    const result = await listClients(workspaceId)
    if (result.success) {
      setClients(result.data.map(toDisplay))
    }
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    load()
  }, [load])

  const filtered = search.trim()
    ? clients.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          (c.company ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          (c.phone ?? '').toLowerCase().includes(q)
        )
      })
    : clients

  function resetForm() {
    setActionError('')
    setFieldErrors({})
    setActionLoading(false)
  }

  function getCreateFormData(form: HTMLFormElement): Record<string, FormDataEntryValue | null> {
    const fd = new FormData(form)
    return {
      name: fd.get('name') as string,
      company: (fd.get('company') as string) || null,
      email: (fd.get('email') as string) || null,
      phone: (fd.get('phone') as string) || null,
    }
  }

  function getEditFormData(form: HTMLFormElement): Record<string, FormDataEntryValue | null> {
    const fd = new FormData(form)
    return {
      name: fd.get('name') as string,
      company: (fd.get('company') as string) || null,
      email: (fd.get('email') as string) || null,
      phone: (fd.get('phone') as string) || null,
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    resetForm()
    setActionLoading(true)

    const raw = getCreateFormData(e.currentTarget)
    const parsed = createClientSchema.safeParse(raw)
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

    const result = await createClient(workspaceId, parsed.data)
    if (result.success) {
      setClients((prev) => [toDisplay(result.data), ...prev])
      setCreateOpen(false)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedClient) return
    resetForm()
    setActionLoading(true)

    const raw = getEditFormData(e.currentTarget)
    const parsed = updateClientSchema.safeParse(raw)
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

    const result = await updateClient(workspaceId, selectedClient.id, parsed.data)
    if (result.success) {
      setClients((prev) =>
        prev.map((c) => (c.id === selectedClient.id ? toDisplay(result.data) : c)),
      )
      setEditOpen(false)
      setSelectedClient(null)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  async function handleArchive() {
    if (!selectedClient) return
    resetForm()
    setActionLoading(true)

    const result = await archiveClient(workspaceId, selectedClient.id)
    if (result.success) {
      setClients((prev) =>
        prev.map((c) => (c.id === selectedClient.id ? toDisplay(result.data) : c)),
      )
      setArchiveOpen(false)
      setSelectedClient(null)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  function openEdit(client: ClientForDisplay) {
    setSelectedClient(client)
    resetForm()
    setEditOpen(true)
  }

  function openArchive(client: ClientForDisplay) {
    setSelectedClient(client)
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
          <CardTitle className="text-base">All Clients</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 pl-8 text-sm"
                aria-label="Search clients"
              />
            </div>
            {canCreate && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                New Client
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              {clients.length === 0
                ? 'No clients yet. Create your first client to get started.'
                : 'No clients match your search.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                    <th scope="col" className="px-5 py-3 font-medium">Name</th>
                    <th scope="col" className="px-5 py-3 font-medium">Company</th>
                    <th scope="col" className="px-5 py-3 font-medium">Email</th>
                    <th scope="col" className="px-5 py-3 font-medium">Phone</th>
                    <th scope="col" className="px-5 py-3 font-medium">Status</th>
                    <th scope="col" className="px-5 py-3 font-medium">Created</th>
                    {(canEdit || canArchive) && (
                      <th scope="col" className="px-5 py-3 font-medium text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium">
                        <Link
                          href={`/${slug}/clients/${client.id}`}
                          className="hover:text-teal-600 transition-colors"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{client.company ?? '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground">{client.email ?? '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground">{client.phone ?? '—'}</td>
                      <td className="px-5 py-3">
                        <Badge variant={statusConfig[client.status].variant}>
                          {statusConfig[client.status].label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{fmtDate(client.createdAt)}</td>
                      {(canEdit || canArchive) && (
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {canEdit && client.status !== 'ARCHIVED' && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEdit(client)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            )}
                            {canArchive && client.status !== 'ARCHIVED' && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openArchive(client)}
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
            <DialogTitle>New Client</DialogTitle>
            <DialogDescription>Add a new client to your workspace.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Name *</Label>
                <Input id="create-name" name="name" placeholder="Client name" required />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-company">Company</Label>
                <Input id="create-company" name="company" placeholder="Company name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input id="create-email" name="email" type="email" placeholder="client@example.com" />
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">Phone</Label>
                <Input id="create-phone" name="phone" placeholder="+1 (555) 000-0000" />
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
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} key={selectedClient?.id ?? 'edit'}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={selectedClient?.name ?? ''}
                  placeholder="Client name"
                  required
                />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company</Label>
                <Input
                  id="edit-company"
                  name="company"
                  defaultValue={selectedClient?.company ?? ''}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={selectedClient?.email ?? ''}
                  placeholder="client@example.com"
                />
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  defaultValue={selectedClient?.phone ?? ''}
                  placeholder="+1 (555) 000-0000"
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

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive {selectedClient?.name ?? 'this client'}? This will hide the
              client from active views but won&apos;t delete any data.
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
