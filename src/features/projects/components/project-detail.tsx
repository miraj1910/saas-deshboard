'use client'

import { ProjectStatus } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TaskList } from './task-list'
import { ProjectFilesSection } from '@/features/files/components/project-files-section'
import type { ProjectWithRelations } from '@/features/projects/queries'
import type { FileWithUploader } from '@/features/files/queries'

const projectStatusConfig: Record<ProjectStatus, { label: string; variant: 'success' | 'default' | 'outline' }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  COMPLETED: { label: 'Completed', variant: 'default' },
  ARCHIVED: { label: 'Archived', variant: 'outline' },
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

function fmtCurrency(n: unknown): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(n))
}

type MemberInfo = { id: string; name: string; avatarUrl: string | null }

type ProjectDetailProps = {
  project: ProjectWithRelations
  clientDetails: {
    id: string
    name: string
    company: string | null
    email: string | null
    phone: string | null
  } | null
  tasks: any[]
  members: MemberInfo[]
  workspaceId: string
  workspaceSlug: string
  canEdit: boolean
  canArchive: boolean
  canCreateTask: boolean
  canUpdateTask: boolean
  canDeleteTask: boolean
  initialFiles: FileWithUploader[]
  canUploadFiles: boolean
  canDeleteFiles: boolean
}

export function ProjectDetail({
  project,
  clientDetails,
  tasks,
  members,
  workspaceId,
  workspaceSlug,
  canEdit,
  canArchive,
  canCreateTask,
  canUpdateTask,
  canDeleteTask,
  initialFiles,
  canUploadFiles,
  canDeleteFiles,
}: ProjectDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
          <Badge variant={projectStatusConfig[project.status].variant}>
            {projectStatusConfig[project.status].label}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Client</p>
              <p className="text-sm">{clientDetails?.name ?? '—'}</p>
              {clientDetails?.company && (
                <p className="text-xs text-muted-foreground">{clientDetails.company}</p>
              )}
              {clientDetails?.email && (
                <p className="text-xs text-muted-foreground">{clientDetails.email}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Budget</p>
              <p className="text-sm">{fmtCurrency(project.hourlyRate)}<span className="text-xs text-muted-foreground"> /hr</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Timeline</p>
              <p className="text-sm">
                {project.startDate ? `${fmtDate(project.startDate)} — ` : ''}
                {fmtDate(project.dueDate)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Stats</p>
              <p className="text-sm">
                {project._count?.tasks ?? 0} task{(project._count?.tasks ?? 0) !== 1 ? 's' : ''}
                {project._count?.timeEntries != null && (
                  <> &middot; {project._count.timeEntries} time entr{project._count.timeEntries !== 1 ? 'ies' : 'y'}</>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TaskList
            projectId={project.id}
            workspaceId={workspaceId}
            initialTasks={tasks}
            members={members}
            canCreate={canCreateTask}
            canUpdate={canUpdateTask}
            canDelete={canDeleteTask}
          />
        </CardContent>
      </Card>

      <ProjectFilesSection
        projectId={project.id}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        initialFiles={initialFiles}
        canUpload={canUploadFiles}
        canDelete={canDeleteFiles}
      />
    </div>
  )
}
