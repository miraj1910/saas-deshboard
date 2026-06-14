'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PortalInvoice } from '@/features/portal/types'

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(d: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

const statusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELED: 'Canceled',
}

const statusVariant: Record<string, 'secondary' | 'default' | 'success' | 'warning' | 'outline'> = {
  DRAFT: 'secondary',
  SENT: 'default',
  PAID: 'success',
  OVERDUE: 'warning',
  CANCELED: 'outline',
}

export function PortalInvoicesList({ invoices }: { invoices: PortalInvoice[] }) {
  const totalOutstanding = invoices
    .filter((i) => i.status === 'SENT' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + i.totalAmount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Invoices</h1>
        <p className="text-sm text-muted-foreground">View and track your invoices</p>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <p className="text-sm text-muted-foreground">No invoices yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {totalOutstanding > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">{fmtCurrency(totalOutstanding)}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">All Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                      <th scope="col" className="px-5 pb-2 pt-2 font-medium">Invoice</th>
                      <th scope="col" className="px-5 pb-2 pt-2 font-medium">Issued</th>
                      <th scope="col" className="px-5 pb-2 pt-2 font-medium">Due</th>
                      <th scope="col" className="px-5 pb-2 pt-2 text-right font-medium">Amount</th>
                      <th scope="col" className="px-5 pb-2 pt-2 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b last:border-0 hover:bg-accent/30">
                        <td className="px-5 py-3 font-medium">{inv.invoiceNumber}</td>
                        <td className="px-5 py-3 text-muted-foreground">{fmtDate(inv.issuedDate)}</td>
                        <td className="px-5 py-3 text-muted-foreground">{fmtDate(inv.dueDate)}</td>
                        <td className="px-5 py-3 text-right tabular-nums font-medium">{fmtCurrency(inv.totalAmount)}</td>
                        <td className="px-5 py-3 text-right">
                          <Badge variant={statusVariant[inv.status] ?? 'secondary'}>
                            {statusLabel[inv.status] ?? inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
