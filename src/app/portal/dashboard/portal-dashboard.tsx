'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PortalDashboardData } from '@/features/portal/types'

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(d: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

const statusLabel: Record<string, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'success' | 'warning'> = {
  ACTIVE: 'default',
  COMPLETED: 'success',
  ARCHIVED: 'secondary',
  DRAFT: 'secondary',
  SENT: 'default',
  PAID: 'success',
  OVERDUE: 'warning',
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

export function PortalDashboard({
  clientName,
  company,
  data,
}: {
  clientName: string
  company: string | null
  data: PortalDashboardData
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Welcome, {clientName}</h1>
        <p className="text-sm text-muted-foreground">{company ?? 'Client Portal'}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Projects" value={String(data.activeProjectCount)} subtitle={`${data.projectCount} total`} />
        <StatCard title="Open Invoices" value={String(data.outstandingInvoiceCount)} subtitle={data.outstandingInvoiceCount > 0 ? fmtCurrency(data.outstandingInvoiceAmount) : 'No outstanding balance'} />
        <StatCard title="Open Requests" value={String(data.openRequestCount)} subtitle={`${data.requestCount} total submitted`} />
        <StatCard title="Total Projects" value={String(data.projectCount)} subtitle={data.activeProjectCount > 0 ? `${data.activeProjectCount} currently active` : 'No active projects'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
            <CardDescription>Your latest invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet</p>
            ) : (
              <div className="space-y-0">
                {data.recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between border-b py-2.5 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(inv.issuedDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">{fmtCurrency(inv.totalAmount)}</span>
                      <Badge variant={statusVariant[inv.status] ?? 'secondary'}>
                        {statusLabel[inv.status] ?? inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <CardDescription>Your active projects</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet</p>
            ) : (
              <div className="space-y-0">
                {data.recentProjects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b py-2.5 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      {p.description && (
                        <p className="truncate text-xs text-muted-foreground max-w-48">{p.description}</p>
                      )}
                    </div>
                    <Badge variant={statusVariant[p.status] ?? 'secondary'}>
                      {statusLabel[p.status] ?? p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
