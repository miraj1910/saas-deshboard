'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { ProjectStatusItem } from '../types'

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
}

const COLORS: Record<string, string> = {
  ACTIVE: 'hsl(var(--chart-1))',
  COMPLETED: 'hsl(var(--chart-2))',
  ARCHIVED: 'hsl(var(--chart-3))',
}

export function ProjectStatusChart({ data }: { data?: ProjectStatusItem[] | null }) {
  const chartData = data?.map((d) => ({
    ...d,
    label: STATUS_LABELS[d.status] ?? d.status,
    fill: COLORS[d.status] ?? '#94a3b8',
  }))

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Project Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground/60">
            No projects yet
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="text-muted-foreground/60" />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground/60"
                />
                <Tooltip
                  formatter={(value: any) => [value, 'Projects']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                    boxShadow: 'var(--shadow-elevated)',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData?.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
