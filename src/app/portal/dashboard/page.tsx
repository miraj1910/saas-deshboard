import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { PortalDashboard } from './portal-dashboard'
import { getPortalDashboardData } from '@/features/portal/queries'
import { AuthorizationError } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export default async function PortalDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const clientMember = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
    include: { client: { select: { name: true, company: true } } },
  })

  if (!clientMember) {
    throw new AuthorizationError('No client portal access')
  }

  const data = await getPortalDashboardData(
    clientMember.workspaceId,
    clientMember.clientId,
  )

  return (
    <PortalDashboard
      clientName={clientMember.client.name}
      company={clientMember.client.company}
      data={data}
    />
  )
}
