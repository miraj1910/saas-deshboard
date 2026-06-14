'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PortalProject } from '@/features/portal/types'

const statusLabel: Record<string, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
}

const statusVariant: Record<string, 'default' | 'success' | 'secondary'> = {
  ACTIVE: 'default',
  COMPLETED: 'success',
  ARCHIVED: 'secondary',
}

export function PortalProjectsList({ projects }: { projects: PortalProject[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground">View your projects and deliverables</p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <p className="text-sm text-muted-foreground">No projects assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/portal/projects/${project.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
                    <Badge variant={statusVariant[project.status] ?? 'secondary'}>
                      {statusLabel[project.status] ?? project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60">No description</p>
                  )}
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    {project.dueDate && (
                      <span>Due: {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
