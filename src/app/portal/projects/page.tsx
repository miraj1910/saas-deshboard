import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClientProjects } from '@/features/portal/queries'
import { PortalProjectsList } from './portal-projects-list'
import { AuthorizationError } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export default async function PortalProjectsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const clientMember = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
  })

  if (!clientMember) throw new AuthorizationError('No client portal access')

  const projects = await getClientProjects(clientMember.workspaceId, clientMember.clientId)

  return <PortalProjectsList projects={projects} />
}
