import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions } from '@/lib/rbac'
import { notFound } from 'next/navigation'
import { findClientWithDetails } from '@/features/clients/queries'
import { listClientDeliverables } from '@/features/files/queries'
import { ClientDetail } from '@/features/clients/components/client-detail'

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; clientId: string }>
}) {
  const { workspaceSlug, clientId } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })
  if (!workspace) notFound()

  const ctx = await createWorkspaceContext(workspace.id)

  const client = await findClientWithDetails(clientId, workspace.id)
  if (!client) notFound()

  const initialFiles = ctx.ability.can(Permissions.FileDeliverableDownload)
    ? await listClientDeliverables(clientId, workspace.id)
    : []
  const canUploadFiles = ctx.ability.can(Permissions.FileDeliverableUpload)
  const canDownloadFiles = ctx.ability.can(Permissions.FileDeliverableDownload)

  return (
    <ClientDetail
      client={client}
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
      initialFiles={initialFiles}
      canUploadFiles={canUploadFiles}
      canDownloadFiles={canDownloadFiles}
    />
  )
}
