'use client'

import { ClientStatus } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { DeliverablesSection } from '@/features/files/components/deliverables-section'
import type { FileWithUploader } from '@/features/files/queries'

const statusConfig: Record<ClientStatus, { label: string; variant: 'success' | 'warning' | 'secondary' | 'outline' }> = {
  LEAD: { label: 'Lead', variant: 'secondary' },
  ACTIVE: { label: 'Active', variant: 'success' },
  INACTIVE: { label: 'Inactive', variant: 'warning' },
  ARCHIVED: { label: 'Archived', variant: 'outline' },
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

type ClientWithProjects = {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  status: ClientStatus
  createdAt: Date
  projects?: {
    id: string
    name: string
    status: string
    _count?: { tasks: number }
  }[]
  _count?: { projects: number; invoices: number }
}

type ClientDetailProps = {
  client: ClientWithProjects
  workspaceId: string
  workspaceSlug: string
  initialFiles: FileWithUploader[]
  canUploadFiles: boolean
  canDownloadFiles: boolean
}

export function ClientDetail({
  client,
  workspaceId,
  workspaceSlug,
  initialFiles,
  canUploadFiles,
  canDownloadFiles,
}: ClientDetailProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">{client.name}</h1>
        <p className="text-sm text-muted-foreground">Client details and deliverables</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-lg">{client.name}</CardTitle>
            {client.company && (
              <p className="text-sm text-muted-foreground">{client.company}</p>
            )}
          </div>
          <Badge variant={statusConfig[client.status].variant}>
            {statusConfig[client.status].label}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{client.email ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Phone</p>
              <p className="text-sm">{client.phone ?? '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{fmtDate(client.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Stats</p>
              <p className="text-sm">
                {client._count?.projects ?? 0} project{(client._count?.projects ?? 0) !== 1 ? 's' : ''}
                &middot; {client._count?.invoices ?? 0} invoice{(client._count?.invoices ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {client.projects && client.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projects</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {client.projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <Link
                    href={`/${workspaceSlug}/projects/${p.id}`}
                    className="text-sm font-medium hover:text-teal-600 transition-colors"
                  >
                    {p.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {p._count?.tasks ?? 0} task{(p._count?.tasks ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <DeliverablesSection
        clientId={client.id}
        workspaceId={workspaceId}
        initialFiles={initialFiles}
        canUpload={canUploadFiles}
        canDownload={canDownloadFiles}
      />
    </div>
  )
}
