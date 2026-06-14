import type { DashboardData } from '@/features/dashboard/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtHours(n: number): string {
  const h = Math.floor(n)
  const m = Math.round((n - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

function StatCard({
  title,
  value,
  suffix,
  loading,
  accent,
}: {
  title: string
  value?: string
  suffix?: string
  loading?: boolean
  accent?: boolean
}) {
  return (
    <Card className="relative overflow-hidden group">
      {/* Subtle gradient overlay */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        accent
          ? 'bg-gradient-to-br from-primary/5 via-transparent to-transparent'
          : 'bg-gradient-to-br from-surface-3/50 via-transparent to-transparent',
      )} />
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <p className={cn(
              'text-2xl font-semibold tracking-tight',
              accent && 'text-gradient',
            )}>
              {value ?? '—'}
            </p>
            {suffix && (
              <p className="mt-0.5 text-xs text-muted-foreground/70">{suffix}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function WidgetShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="col-span-full lg:col-span-1 relative overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground/80">{label}</span>
      <span className={cn('text-sm font-medium tabular-nums', accent && 'text-gradient')}>
        {value}
      </span>
    </div>
  )
}

const statusLabel: Record<string, string> = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  TODO: 'secondary',
  IN_PROGRESS: 'default',
  DONE: 'outline',
}

export function DashboardShell({ data }: { data?: DashboardData | null }) {
  if (!data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground/70">Overview of your workspace</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Revenue (MTD)" loading />
          <StatCard title="Active Clients" loading />
          <StatCard title="Active Projects" loading />
          <StatCard title="Pending Invoices" loading />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <WidgetShell title="Recent Activity">
            <Skeleton className="h-40 w-full" />
          </WidgetShell>
          <WidgetShell title="Upcoming Deadlines">
            <Skeleton className="h-40 w-full" />
          </WidgetShell>
          <WidgetShell title="Quick Stats">
            <Skeleton className="h-40 w-full" />
          </WidgetShell>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground/70">Overview of your workspace</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Revenue (MTD)" value={fmtCurrency(data.revenueMtd)} accent suffix="Current month" />
        <StatCard title="Active Clients" value={String(data.activeClients)} suffix="Currently active" />
        <StatCard title="Active Projects" value={String(data.activeProjects)} suffix="In progress" />
        <StatCard title="Pending Invoices" value={fmtCurrency(data.pendingInvoices)} suffix="Awaiting payment" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <WidgetShell title="Recent Activity">
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground/60">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 group">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-accent" />
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <p className="truncate text-sm text-foreground/90 group-hover:text-foreground transition-colors">
                      {a.description}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {a.userName ?? 'System'} &middot; {fmtDate(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WidgetShell>

        <WidgetShell title="Upcoming Deadlines">
          {data.upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground/60">No upcoming deadlines</p>
          ) : (
            <div className="space-y-2">
              {data.upcomingDeadlines.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-surface-2/50 px-3 py-2.5 transition-all duration-150 hover:bg-surface-3 hover:border-border/80"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-medium text-foreground/90">{t.title}</p>
                    <p className="truncate text-xs text-muted-foreground/60">
                      {t.projectName}{t.assigneeName ? ` · ${t.assigneeName}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground/70">{fmtDate(t.dueDate)}</span>
                    <Badge variant={statusVariant[t.status] ?? 'secondary'}>
                      {statusLabel[t.status] ?? t.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WidgetShell>

        <WidgetShell title="Quick Stats">
          <div className="divide-y divide-border/50">
            <Row label="Hours logged today" value={fmtHours(data.quickStats.hoursLoggedToday)} />
            <Row label="Tasks completed this month" value={String(data.quickStats.tasksCompletedThisMonth)} />
            <Row
              label="Utilization rate"
              value={data.quickStats.utilizationRate != null ? `${data.quickStats.utilizationRate}%` : '—'}
            />
            <Row label="Outstanding invoices" value={fmtCurrency(data.quickStats.outstandingInvoicesAmount)} accent />
            <Row label="Team members" value={String(data.quickStats.teamMemberCount)} />
          </div>
        </WidgetShell>
      </div>
    </div>
  )
}
