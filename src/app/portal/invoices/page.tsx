import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClientInvoices } from '@/features/portal/queries'
import { PortalInvoicesList } from './portal-invoices-list'
import { AuthorizationError } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export default async function PortalInvoicesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const clientMember = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
  })

  if (!clientMember) throw new AuthorizationError('No client portal access')

  const invoices = await getClientInvoices(clientMember.workspaceId, clientMember.clientId)

  return <PortalInvoicesList invoices={invoices} />
}
