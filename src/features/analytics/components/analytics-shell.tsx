'use client'

import type { AnalyticsData } from '../types'
import { KpiCards } from './kpi-cards'
import { RevenueTrendChart } from './revenue-trend-chart'
import { InvoiceStatusChart } from './invoice-status-chart'
import { HoursTrackedChart } from './hours-tracked-chart'
import { ProjectStatusChart } from './project-status-chart'
import { TopClientsTable } from './top-clients-table'
import { TeamUtilizationTable } from './team-utilization-table'

export function AnalyticsShell({ data }: { data?: AnalyticsData | null }) {
  if (!data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground/70">Business performance and insights</p>
        </div>
        <KpiCards data={null} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <RevenueTrendChart data={null} />
          <InvoiceStatusChart data={null} />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <HoursTrackedChart data={null} />
          <ProjectStatusChart data={null} />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <TopClientsTable data={null} />
          <TeamUtilizationTable data={null} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground/70">Business performance and insights</p>
      </div>

      <KpiCards data={data} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RevenueTrendChart data={data.revenueTrend} />
        <InvoiceStatusChart data={data.invoiceStatusDistribution} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <HoursTrackedChart data={data.weeklyHours} />
        <ProjectStatusChart data={data.projectStatusDistribution} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TopClientsTable data={data.topClients} />
        <TeamUtilizationTable data={data.teamUtilizationMembers} />
      </div>
    </div>
  )
}
