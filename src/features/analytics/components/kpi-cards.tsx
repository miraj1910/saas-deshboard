'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function KpiCard({
  title,
  value,
  subtitle,
  trend,
  accent,
}: {
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  accent?: boolean
}) {
  return (
    <Card className="relative overflow-hidden group">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-end justify-between">
          <div>
            <p className={cn(
              'text-2xl font-semibold tracking-tight',
              accent && 'text-gradient',
            )}>
              {value}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground/70">{subtitle}</p>
            )}
          </div>
          {trend && (
            <div className="mb-1">
              {trend === 'up' && (
                <div className="flex items-center gap-1 text-emerald-500">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium tabular-nums">+12%</span>
                </div>
              )}
              {trend === 'down' && (
                <div className="flex items-center gap-1 text-red-500">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium tabular-nums">-8%</span>
                </div>
              )}
              {trend === 'neutral' && (
                <Minus className="h-3.5 w-3.5 text-muted-foreground/60" />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function KpiCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-2 h-3 w-20" />
      </CardContent>
    </Card>
  )
}

export function KpiCards({ data }: { data?: {
  revenueMtd: number
  revenueYtd: number
  outstandingInvoices: number
  teamUtilization: number
  hoursTracked: number
  projectsCompleted: number
  activeClients: number
  clientGrowth: number
} | null }) {
  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
    )
  }

  const growthTrend: 'up' | 'down' | 'neutral' =
    data.clientGrowth > 0 ? 'up' : data.clientGrowth < 0 ? 'down' : 'neutral'

  const utilTrend: 'up' | 'down' | 'neutral' =
    data.teamUtilization >= 75 ? 'up' : data.teamUtilization >= 50 ? 'neutral' : 'down'

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Revenue MTD"
        value={fmtCurrency(data.revenueMtd)}
        subtitle="Current month"
        accent
      />
      <KpiCard
        title="Revenue YTD"
        value={fmtCurrency(data.revenueYtd)}
        subtitle="Year to date"
      />
      <KpiCard
        title="Outstanding Invoices"
        value={fmtCurrency(data.outstandingInvoices)}
        subtitle="Unpaid invoices"
      />
      <KpiCard
        title="Team Utilization"
        value={`${data.teamUtilization}%`}
        subtitle="Tracked vs available hours"
        trend={utilTrend}
      />
      <KpiCard
        title="Hours Tracked"
        value={`${data.hoursTracked.toFixed(0)}h`}
        subtitle="Total approved hours"
      />
      <KpiCard
        title="Projects Completed"
        value={String(data.projectsCompleted)}
        subtitle="Total completed"
      />
      <KpiCard
        title="Active Clients"
        value={String(data.activeClients)}
        subtitle="Currently active"
      />
      <KpiCard
        title="Client Growth"
        value={`${data.clientGrowth >= 0 ? '+' : ''}${data.clientGrowth}%`}
        subtitle="Month over month"
        trend={growthTrend}
      />
    </div>
  )
}
