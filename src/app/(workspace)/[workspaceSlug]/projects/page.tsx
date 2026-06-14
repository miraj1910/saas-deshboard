import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions } from '@/lib/rbac'
import { notFound } from 'next/navigation'
import { ProjectsList } from '@/features/projects/components/projects-list'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage({
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

  const clients = await prisma.client.findMany({
    where: { workspaceId: workspace.id, deletedAt: null },
    select: { id: true, name: true, company: true },
    orderBy: { name: 'asc' },
  })

  const canCreate = ctx.ability.can(Permissions.ProjectCreate)
  const canEdit = ctx.ability.can(Permissions.ProjectUpdate)
  const canArchive = ctx.ability.can(Permissions.ProjectArchive)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground">Manage your projects and tasks</p>
      </div>
      <ProjectsList
        workspaceId={workspace.id}
        clients={clients}
        canCreate={canCreate}
        canEdit={canEdit}
        canArchive={canArchive}
      />
    </div>
  )
}
