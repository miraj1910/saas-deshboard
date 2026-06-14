import { prisma } from '@/lib/prisma'
import { createWorkspaceContext, assertAnyRole } from '@/lib/authorization'
import { WorkspaceRole } from '@prisma/client'
import { getAnalyticsData } from '@/features/analytics/queries'
import { AnalyticsShell } from '@/features/analytics/components/analytics-shell'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage({
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

  assertAnyRole(ctx, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)

  const data = await getAnalyticsData(ctx)

  return <AnalyticsShell data={data} />
}
