import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { getDashboardData } from '@/features/dashboard/queries'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
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
  const data = await getDashboardData(ctx)

  return <DashboardShell data={data} />
}
