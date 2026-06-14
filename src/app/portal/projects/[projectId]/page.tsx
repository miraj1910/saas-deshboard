import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getClientProjectById, getClientProjectTasks } from '@/features/portal/queries'
import { PortalProjectDetail } from './portal-project-detail'
import { AuthorizationError } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const clientMember = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
  })

  if (!clientMember) throw new AuthorizationError('No client portal access')

  const project = await getClientProjectById(clientMember.workspaceId, clientMember.clientId, projectId)
  if (!project) notFound()

  const tasks = await getClientProjectTasks(clientMember.workspaceId, clientMember.clientId, projectId)

  return <PortalProjectDetail project={project} tasks={tasks} />
}
