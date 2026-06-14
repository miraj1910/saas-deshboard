'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Send, Check, X as XIcon, Loader2, Eye } from 'lucide-react'
import { InvoiceStatus } from '@prisma/client'
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
  listWorkspaceInvoices,
  createInvoice,
  sendInvoice,
  markPaid,
  voidInvoice,
  getApprovedTimeEntries,
} from '@/features/invoices/_actions'
import { createInvoiceSchema } from '@/features/invoices/schemas'

type ClientOption = { id: string; name: string; company: string | null }

type InvoiceForDisplay = {
  id: string
  invoiceNumber: string
  clientName: string | null
  totalAmount: number
  status: InvoiceStatus
  dueDate: Date | null
}

type FieldErrors = Record<string, string>

type TimeEntryOption = {
  id: string
  description: string | null
  durationMinutes: number
  projectName: string | null
  taskTitle: string | null
  userName: string | null
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: 'secondary' | 'warning' | 'success' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SENT: { label: 'Sent', variant: 'warning' },
  PAID: { label: 'Paid', variant: 'success' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
  CANCELED: { label: 'Canceled', variant: 'outline' },
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

function fmtCurrency(n: unknown): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n))
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

type InvoicesListProps = {
  workspaceId: string
  clients: ClientOption[]
  canCreate: boolean
  canSend: boolean
  canMarkPaid: boolean
  canVoid: boolean
}

export function InvoicesList({ workspaceId, clients, canCreate, canSend, canMarkPaid, canVoid }: InvoicesListProps) {
  const params = useParams()
  const slug = params?.workspaceSlug as string

  const [invoices, setInvoices] = useState<InvoiceForDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [paidOpen, setPaidOpen] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceForDisplay | null>(null)

  const [createClientId, setCreateClientId] = useState('')
  const [timeEntries, setTimeEntries] = useState<TimeEntryOption[]>([])
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set())
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [createDueDate, setCreateDueDate] = useState('')
  const [createNotes, setCreateNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const result = await listWorkspaceInvoices(workspaceId)
    if (result.success) {
      setInvoices(
        result.data.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.client?.name ?? null,
          totalAmount: Number(inv.totalAmount),
          status: inv.status,
          dueDate: inv.dueDate,
        })),
      )
    }
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    load()
  }, [load])

  function updateInList(id: string, updates: Partial<InvoiceForDisplay>) {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
  }

  function resetForm() {
    setActionError('')
    setFieldErrors({})
    setActionLoading(false)
  }

  function resetCreateForm() {
    setCreateClientId('')
    setTimeEntries([])
    setSelectedEntryIds(new Set())
    setCreateDueDate('')
    setCreateNotes('')
    setActionError('')
    setFieldErrors({})
    setActionLoading(false)
  }

  async function handleClientChange(clientId: string) {
    setCreateClientId(clientId)
    setSelectedEntryIds(new Set())
    if (!clientId) {
      setTimeEntries([])
      return
    }
    setEntriesLoading(true)
    const result = await getApprovedTimeEntries(workspaceId, clientId)
    if (result.success) {
      setTimeEntries(result.data)
    }
    setEntriesLoading(false)
  }

  function toggleEntry(id: string) {
    setSelectedEntryIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCreate() {
    resetForm()
    setActionLoading(true)

    const parsed = createInvoiceSchema.safeParse({
      clientId: createClientId,
      timeEntryIds: Array.from(selectedEntryIds),
      dueDate: createDueDate,
      notes: createNotes || null,
    })
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

    const result = await createInvoice(workspaceId, parsed.data)
    if (result.success) {
      setInvoices((prev) => [
        {
          id: result.data.id,
          invoiceNumber: result.data.invoiceNumber,
          clientName: result.data.client?.name ?? null,
          totalAmount: Number(result.data.totalAmount),
          status: result.data.status,
          dueDate: result.data.dueDate,
        },
        ...prev,
      ])
      setCreateOpen(false)
      resetCreateForm()
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  async function handleSend(invoiceId: string) {
    setProcessingId(invoiceId)
    setListError(null)
    const result = await sendInvoice(workspaceId, invoiceId)
    if (result.success) {
      updateInList(invoiceId, { status: result.data.status })
    } else {
      setListError(result.error)
    }
    setProcessingId(null)
  }

  async function handleMarkPaid() {
    if (!selectedInvoice) return
    resetForm()
    setActionLoading(true)
    const result = await markPaid(workspaceId, selectedInvoice.id)
    if (result.success) {
      updateInList(selectedInvoice.id, { status: result.data.status })
      setPaidOpen(false)
      setSelectedInvoice(null)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  async function handleVoid(invoiceId: string) {
    setProcessingId(invoiceId)
    setListError(null)
    const result = await voidInvoice(workspaceId, invoiceId)
    if (result.success) {
      updateInList(invoiceId, { status: result.data.status })
    } else {
      setListError(result.error)
    }
    setProcessingId(null)
  }

  function confirmSend(invoice: InvoiceForDisplay) {
    setSelectedInvoice(invoice)
    setActionError('')
    setSendOpen(true)
  }

  function confirmPaid(invoice: InvoiceForDisplay) {
    setSelectedInvoice(invoice)
    resetForm()
    setPaidOpen(true)
  }

  function confirmVoid(invoice: InvoiceForDisplay) {
    setSelectedInvoice(invoice)
    setActionError('')
    setVoidOpen(true)
  }

  const selectedTotal = Array.from(selectedEntryIds).reduce((sum, id) => {
    const entry = timeEntries.find((t) => t.id === id)
    return sum + (entry ? entry.durationMinutes : 0)
  }, 0)

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">All Invoices</CardTitle>
          {canCreate && (
            <Button
              size="sm"
              onClick={() => {
                resetCreateForm()
                setCreateOpen(true)
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Invoice
            </Button>
          )}
        </CardHeader>
        {listError && (
          <div className="mx-5 mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {listError}
          </div>
        )}
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              {canCreate
                ? 'No invoices yet. Create your first invoice to get started.'
                : 'No invoices found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                    <th scope="col" className="px-5 py-3 font-medium">Invoice</th>
                    <th scope="col" className="px-5 py-3 font-medium">Client</th>
                    <th scope="col" className="px-5 py-3 font-medium">Amount</th>
                    <th scope="col" className="px-5 py-3 font-medium">Status</th>
                    <th scope="col" className="px-5 py-3 font-medium">Due Date</th>
                    <th scope="col" className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium">
                        <Link
                          href={`/${slug}/invoices/${inv.id}`}
                          className="hover:text-teal-600 transition-colors"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {inv.clientName ?? '—'}
                      </td>
                      <td className="px-5 py-3">{fmtCurrency(inv.totalAmount)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={statusConfig[inv.status].variant}>
                          {statusConfig[inv.status].label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{fmtDate(inv.dueDate)}</td>
                      <td className="px-5 py-3 text-right">
                        {processingId === inv.id ? (
                          <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <Link
                              href={`/${slug}/invoices/${inv.id}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent/10"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                            {inv.status === 'DRAFT' && canSend && (
                              <Button variant="ghost" size="icon-sm" onClick={() => confirmSend(inv)}>
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                              </Button>
                            )}
                            {(inv.status === 'SENT' || inv.status === 'OVERDUE') && canMarkPaid && (
                              <Button variant="ghost" size="icon-sm" onClick={() => confirmPaid(inv)}>
                                <Check className="h-4 w-4" />
                                <span className="sr-only">Mark Paid</span>
                              </Button>
                            )}
                            {inv.status !== 'PAID' && inv.status !== 'CANCELED' && canVoid && (
                              <Button variant="ghost" size="icon-sm" onClick={() => confirmVoid(inv)}>
                                <XIcon className="h-4 w-4" />
                                <span className="sr-only">Void</span>
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
            <DialogDescription>
              Create an invoice from approved unbilled time entries.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-client">Client *</Label>
              <Select
                id="inv-client"
                value={createClientId}
                onChange={(e) => handleClientChange(e.target.value)}
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company ? ` (${c.company})` : ''}
                  </option>
                ))}
              </Select>
              {fieldErrors.clientId && <p className="text-xs text-destructive">{fieldErrors.clientId}</p>}
            </div>

            {createClientId && (
              <div className="space-y-2">
                <Label>Time Entries *</Label>
                {entriesLoading ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading entries...
                  </div>
                ) : timeEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">
                    No approved unbilled time entries for this client.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2">
                    {timeEntries.map((entry) => (
                      <label
                        key={entry.id}
                        className="flex items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEntryIds.has(entry.id)}
                          onChange={() => toggleEntry(entry.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">
                            {entry.taskTitle ?? entry.description ?? 'Time entry'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.projectName}
                            {entry.userName && <span> &middot; {entry.userName}</span>}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDuration(entry.durationMinutes)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {fieldErrors.timeEntries && <p className="text-xs text-destructive">{fieldErrors.timeEntries}</p>}
                {selectedEntryIds.size > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedEntryIds.size} entry{selectedEntryIds.size !== 1 ? 'ies' : 'y'} selected
                    &nbsp;({fmtDuration(selectedTotal)})
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-due">Due Date *</Label>
                <Input
                  id="inv-due"
                  type="date"
                  value={createDueDate}
                  onChange={(e) => setCreateDueDate(e.target.value)}
                />
                {fieldErrors.dueDate && <p className="text-xs text-destructive">{fieldErrors.dueDate}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-notes">Notes</Label>
              <Textarea
                id="inv-notes"
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder="Payment terms, additional notes..."
              />
            </div>
            {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" disabled={actionLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" size="sm" disabled={actionLoading} onClick={handleCreate}>
              {actionLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              Mark invoice {selectedInvoice?.invoiceNumber} as sent to the client?
            </DialogDescription>
          </DialogHeader>
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                if (!selectedInvoice) return
                setSendOpen(false)
                await handleSend(selectedInvoice.id)
              }}
            >
              <Send className="mr-1.5 h-4 w-4" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paidOpen} onOpenChange={setPaidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              Mark invoice {selectedInvoice?.invoiceNumber} as paid?
            </DialogDescription>
          </DialogHeader>
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" disabled={actionLoading}>Cancel</Button>
            </DialogClose>
            <Button type="button" size="sm" disabled={actionLoading} onClick={handleMarkPaid}>
              {actionLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              <Check className="mr-1.5 h-4 w-4" />
              Mark Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to void invoice {selectedInvoice?.invoiceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!selectedInvoice) return
                setVoidOpen(false)
                await handleVoid(selectedInvoice.id)
              }}
            >
              <XIcon className="mr-1.5 h-4 w-4" />
              Void Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
