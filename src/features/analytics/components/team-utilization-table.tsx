'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { TeamUtilizationMember } from '../types'
import { cn } from '@/lib/utils'

export function TeamUtilizationTable({ data }: { data?: TeamUtilizationMember[] | null }) {
  return (
    <Card className="col-span-full lg:col-span-2 relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Team Utilization
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground/60">No team members found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                  <th scope="col" className="pb-2.5 font-medium">Team Member</th>
                  <th scope="col" className="pb-2.5 pl-4 font-medium">Hours Logged</th>
                  <th scope="col" className="pb-2.5 pl-4 font-medium">Assigned Tasks</th>
                  <th scope="col" className="pb-2.5 pl-4 text-right font-medium">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {data.map((member) => (
                  <tr key={member.id} className="border-b border-border/30 last:border-0 group hover:bg-surface-3/30 transition-colors duration-150">
                    <td className="py-3 font-medium text-foreground/90">{member.name}</td>
                    <td className="py-3 pl-4 tabular-nums text-muted-foreground/80">
                      {member.hoursLogged.toFixed(1)}h
                    </td>
                    <td className="py-3 pl-4 tabular-nums text-muted-foreground/80">
                      {member.assignedTasks}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-3">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              member.utilization >= 80 && 'bg-chart-1',
                              member.utilization >= 50 && member.utilization < 80 && 'bg-chart-4',
                              member.utilization < 50 && 'bg-chart-5',
                            )}
                            style={{ width: `${Math.min(member.utilization, 100)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right tabular-nums text-muted-foreground/80">
                          {member.utilization}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
