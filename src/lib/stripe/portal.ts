import { prisma } from '@/lib/prisma'
import { getStripeClient, isStripeConfigured } from './index'

export type CreatePortalResult =
  | { success: true; url: string }
  | { success: false; error: string }

export async function createBillingPortalSession(
  workspaceId: string,
  origin: string,
): Promise<CreatePortalResult> {
  if (!isStripeConfigured()) {
    return { success: false, error: 'Stripe is not configured' }
  }

  try {
    const stripe = getStripeClient()

    const subscription = await prisma.subscription.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription) {
      return { success: false, error: 'No subscription found' }
    }

    let customerId = subscription.stripeCustomerId

    if (!customerId) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          members: {
            take: 1,
            include: { user: { select: { email: true, name: true } } },
          },
        },
      })
      if (!workspace) return { success: false, error: 'Workspace not found' }

      const owner = workspace.members[0]
      const customer = await stripe.customers.create({
        email: owner?.user.email,
        name: workspace.name,
        metadata: { workspaceId },
      })
      customerId = customer.id

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings/billing`,
    })

    if (!session.url) {
      return { success: false, error: 'Failed to create billing portal session' }
    }

    return { success: true, url: session.url }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create billing portal session'
    return { success: false, error: message }
  }
}
