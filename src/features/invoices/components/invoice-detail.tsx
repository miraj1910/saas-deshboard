'use client'

import { useState } from 'react'
import { Send, Check, X as XIcon, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { InvoiceStatus } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  sendInvoice,
  markPaid,
  voidInvoice,
} from '@/features/invoices/_actions'
import type { InvoiceWithRelations } from '@/features/invoices/queries'

const statusConfig: Record<InvoiceStatus, { label: string; variant: 'secondary' | 'warning' | 'success' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SENT: { label: 'Sent', variant: 'warning' },
  PAID: { label: 'Paid', variant: 'success' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
  CANCELED: { label: 'Canceled', variant: 'outline' },
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(d)
}

function fmtCurrency(n: unknown): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n))
}

type InvoiceDetailProps = {
  invoice: InvoiceWithRelations
  workspaceId: string
  canSend: boolean
  canMarkPaid: boolean
  canVoid: boolean
}

export function InvoiceDetail({ invoice, workspaceId, canSend, canMarkPaid, canVoid }: InvoiceDetailProps) {
  const [currentInvoice, setCurrentInvoice] = useState(invoice)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [sendOpen, setSendOpen] = useState(false)
  const [paidOpen, setPaidOpen] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)

  const status = currentInvoice.status
  const lineItems = currentInvoice.lineItems ?? []

  async function handleSend() {
    setActionLoading(true)
    setActionError('')
    const result = await sendInvoice(workspaceId, currentInvoice.id)
    if (result.success) {
      setCurrentInvoice(result.data)
      setSendOpen(false)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  async function handleMarkPaid() {
    setActionLoading(true)
    setActionError('')
    const result = await markPaid(workspaceId, currentInvoice.id)
    if (result.success) {
      setCurrentInvoice(result.data)
      setPaidOpen(false)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  async function handleVoid() {
    setActionLoading(true)
    setActionError('')
    const result = await voidInvoice(workspaceId, currentInvoice.id)
    if (result.success) {
      setCurrentInvoice(result.data)
      setVoidOpen(false)
    } else {
      setActionError(result.error)
    }
    setActionLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="."
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">{currentInvoice.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">Invoice details</p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Client</p>
          <p className="font-medium">{currentInvoice.client?.name ?? '—'}</p>
          {currentInvoice.client?.company && (
            <p className="text-sm text-muted-foreground">{currentInvoice.client.company}</p>
          )}
        </div>
        <Badge variant={statusConfig[status].variant} className="text-sm px-3 py-1">
          {statusConfig[status].label}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Issued Date</p>
              <p className="text-sm">{fmtDate(currentInvoice.issuedDate)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Due Date</p>
              <p className="text-sm">{fmtDate(currentInvoice.dueDate)}</p>
            </div>
            {currentInvoice.paidAt && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Paid Date</p>
                <p className="text-sm">{fmtDate(currentInvoice.paidAt)}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold">{fmtCurrency(currentInvoice.totalAmount)}</p>
            </div>
          </div>
          {currentInvoice.notes && (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{currentInvoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">Line Items</CardTitle>
          <p className="text-sm text-muted-foreground">{lineItems.length} item{lineItems.length !== 1 ? 's' : ''}</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-medium">Description</th>
                  <th scope="col" className="px-5 py-3 font-medium text-right">Hours</th>
                  <th scope="col" className="px-5 py-3 font-medium text-right">Rate</th>
                  <th scope="col" className="px-5 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-5 py-3">{item.description}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {Number(item.quantity).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {fmtCurrency(item.unitPrice)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      {fmtCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="px-5 py-3" colSpan={3}>Total</td>
                  <td className="px-5 py-3 text-right">{fmtCurrency(currentInvoice.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {status !== 'PAID' && status !== 'CANCELED' && (canSend || canMarkPaid || canVoid) && (
        <div className="flex items-center gap-2">
          {status === 'DRAFT' && canSend && (
            <Button size="sm" onClick={() => { setActionError(''); setSendOpen(true) }}>
              <Send className="mr-1.5 h-4 w-4" />
              Send Invoice
            </Button>
          )}
          {(status === 'SENT' || status === 'OVERDUE') && canMarkPaid && (
            <Button size="sm" onClick={() => { setActionError(''); setPaidOpen(true) }}>
              <Check className="mr-1.5 h-4 w-4" />
              Mark as Paid
            </Button>
          )}
          {canVoid && (
            <Button variant="outline" size="sm" onClick={() => { setActionError(''); setVoidOpen(true) }}>
              <XIcon className="mr-1.5 h-4 w-4" />
              Void Invoice
            </Button>
          )}
        </div>
      )}

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              Mark {currentInvoice.invoiceNumber} as sent to the client?
            </DialogDescription>
          </DialogHeader>
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" disabled={actionLoading}>Cancel</Button>
            </DialogClose>
            <Button type="button" size="sm" disabled={actionLoading} onClick={handleSend}>
              {actionLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
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
              Mark {currentInvoice.invoiceNumber} as paid?
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
              Are you sure you want to void {currentInvoice.invoiceNumber}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" disabled={actionLoading}>Cancel</Button>
            </DialogClose>
            <Button type="button" variant="destructive" size="sm" disabled={actionLoading} onClick={handleVoid}>
              {actionLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Void Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
