'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { InvoiceStatusItem } from '../types'

const COLORS: Record<string, string> = {
  DRAFT: 'hsl(var(--chart-3))',
  SENT: 'hsl(var(--chart-2))',
  PAID: 'hsl(var(--chart-1))',
  OVERDUE: 'hsl(var(--chart-5))',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}

export function InvoiceStatusChart({ data }: { data?: InvoiceStatusItem[] | null }) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Invoice Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground/60">
            No invoices yet
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={COLORS[entry.status] ?? '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const count = Number(value)
                    const item = data?.find((d) => d.status === name)
                    return [`${count} (${fmtCurrency(item?.amount ?? 0)})`, STATUS_LABELS[name] ?? name]
                  }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                    boxShadow: 'var(--shadow-elevated)',
                    fontSize: '13px',
                  }}
                />
                <Legend
                  formatter={(value: string) => STATUS_LABELS[value] ?? value}
                  fontSize={12}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
