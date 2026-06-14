import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions } from '@/lib/rbac'
import { notFound } from 'next/navigation'
import { findInvoiceById } from '@/features/invoices/queries'
import { InvoiceDetail } from '@/features/invoices/components/invoice-detail'

export const dynamic = 'force-dynamic'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; invoiceId: string }>
}) {
  const { workspaceSlug, invoiceId } = await params
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })
  if (!workspace) notFound()

  const ctx = await createWorkspaceContext(workspace.id)

  const invoice = await findInvoiceById(invoiceId, workspace.id)
  if (!invoice) notFound()

  const canSend = ctx.ability.can(Permissions.InvoiceSend)
  const canMarkPaid = ctx.ability.can(Permissions.InvoiceMarkPaid)
  const canVoid = ctx.ability.can(Permissions.InvoiceVoid)

  return (
    <InvoiceDetail
      invoice={invoice}
      workspaceId={workspace.id}
      canSend={canSend}
      canMarkPaid={canMarkPaid}
      canVoid={canVoid}
    />
  )
}
