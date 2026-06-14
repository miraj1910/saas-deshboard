'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { TopClient } from '../types'

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function TopClientsTable({ data }: { data?: TopClient[] | null }) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Top Clients
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground/60">No clients with revenue yet</p>
        ) : (
          <div className="space-y-0">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
              <span>Client</span>
              <div className="flex gap-6">
                <span>Projects</span>
                <span className="w-24 text-right">Revenue</span>
              </div>
            </div>
            {data.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between border-b border-border/30 py-3 last:border-0 group hover:bg-surface-3/50 -mx-3 px-3 rounded-lg transition-colors duration-150"
              >
                <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                  {client.name}
                </span>
                <div className="flex gap-6 text-sm">
                  <span className="text-muted-foreground/70 tabular-nums">{client.projectCount}</span>
                  <span className="w-24 text-right font-medium tabular-nums text-foreground/90">
                    {fmtCurrency(client.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
