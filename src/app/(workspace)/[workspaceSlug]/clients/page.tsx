import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions } from '@/lib/rbac'
import { notFound } from 'next/navigation'
import { ClientsList } from '@/features/clients/components/client-list'

export const dynamic = 'force-dynamic'

export default async function ClientsPage({
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

  const canCreate = ctx.ability.can(Permissions.ClientCreate)
  const canEdit = ctx.ability.can(Permissions.ClientUpdate)
  const canArchive = ctx.ability.can(Permissions.ClientArchive)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Clients</h1>
        <p className="text-sm text-muted-foreground">Manage your client relationships</p>
      </div>
      <ClientsList
        workspaceId={workspace.id}
        canCreate={canCreate}
        canEdit={canEdit}
        canArchive={canArchive}
      />
    </div>
  )
}
