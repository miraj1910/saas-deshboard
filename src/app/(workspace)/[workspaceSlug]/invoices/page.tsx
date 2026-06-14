import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions } from '@/lib/rbac'
import { notFound } from 'next/navigation'
import { InvoicesList } from '@/features/invoices/components/invoices-list'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage({
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

  const canCreate = ctx.ability.can(Permissions.InvoiceCreate)
  const canSend = ctx.ability.can(Permissions.InvoiceSend)
  const canMarkPaid = ctx.ability.can(Permissions.InvoiceMarkPaid)
  const canVoid = ctx.ability.can(Permissions.InvoiceVoid)

  const clients = await prisma.client.findMany({
    where: { workspaceId: workspace.id, deletedAt: null },
    select: { id: true, name: true, company: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Invoices</h1>
        <p className="text-sm text-muted-foreground">Manage invoices and billing</p>
      </div>
      <InvoicesList
        workspaceId={workspace.id}
        clients={clients}
        canCreate={canCreate}
        canSend={canSend}
        canMarkPaid={canMarkPaid}
        canVoid={canVoid}
      />
    </div>
  )
}
