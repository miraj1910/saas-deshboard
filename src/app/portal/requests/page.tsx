import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClientRequests } from '@/features/portal/queries'
import { PortalRequestsPage } from './portal-requests-page'
import { AuthorizationError } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export default async function PortalRequestsPageServer() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const clientMember = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
  })

  if (!clientMember) throw new AuthorizationError('No client portal access')

  const requests = await getClientRequests(clientMember.workspaceId, clientMember.clientId)

  return <PortalRequestsPage requests={requests} />
}
