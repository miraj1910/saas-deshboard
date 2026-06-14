import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions } from '@/lib/rbac'
import { notFound } from 'next/navigation'
import { TimePage } from '@/features/time-tracking/components/time-page'

export const dynamic = 'force-dynamic'

export default async function TimeTrackingPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })
  if (!workspace) notFound()

  const ctx = await createWorkspaceContext(workspace.id)

  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id, deletedAt: null, status: { not: 'ARCHIVED' } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const canApprove = ctx.ability.can(Permissions.TimeApprove)
  const canReadAll = ctx.ability.can(Permissions.TimeRead)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Time Tracking</h1>
        <p className="text-sm text-muted-foreground">Track and manage time entries</p>
      </div>
      <TimePage
        workspaceId={workspace.id}
        projects={projects}
        currentUserId={ctx.session.userId}
        canApprove={canApprove}
        canReadAll={canReadAll}
      />
    </div>
  )
}
