'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { PortalProject, PortalTask } from '@/features/portal/types'

const projectStatusLabel: Record<string, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
}

const projectStatusVariant: Record<string, 'default' | 'success' | 'secondary'> = {
  ACTIVE: 'default',
  COMPLETED: 'success',
  ARCHIVED: 'secondary',
}

const taskStatusLabel: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

const taskStatusVariant: Record<string, 'secondary' | 'default' | 'outline'> = {
  TODO: 'secondary',
  IN_PROGRESS: 'default',
  DONE: 'outline',
}

export function PortalProjectDetail({ project, tasks }: { project: PortalProject; tasks: PortalTask[] }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/portal/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{project.name}</h1>
            <Badge variant={projectStatusVariant[project.status] ?? 'secondary'}>
              {projectStatusLabel[project.status] ?? project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Deliverables</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deliverables yet</p>
          ) : (
            <div className="space-y-0 divide-y">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <Badge variant={taskStatusVariant[task.status] ?? 'secondary'}>
                      {taskStatusLabel[task.status] ?? task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
