import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions } from '@/lib/rbac'
import { BillingPageContent } from './billing-page-content'

export default async function BillingPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const { workspaceSlug } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })
  if (!workspace) notFound()

  let ctx
  try {
    ctx = await createWorkspaceContext(workspace.id)
  } catch (e) {
    if (e instanceof Error && e.name === 'AuthorizationError') redirect('/login')
    throw e
  }

  const subscription = await prisma.subscription.findFirst({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: 'desc' },
  })

  if (!subscription) notFound()

  const canManage = ctx.ability.can(Permissions.SubscriptionManage)

  return (
    <BillingPageContent
      workspaceSlug={workspaceSlug}
      plan={subscription.plan}
      status={subscription.status}
      currentPeriodEnd={subscription.currentPeriodEnd}
      trialEndsAt={subscription.trialEndsAt}
      cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
      stripeCustomerId={subscription.stripeCustomerId}
      canManage={canManage}
    />
  )
}
