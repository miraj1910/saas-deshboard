import { prisma } from '@/lib/prisma'
import type { Subscription, Plan } from '@prisma/client'

export type SubscriptionWithDetails = Subscription & {
  workspace?: { name: string; slug: string } | null
}

export async function getCurrentSubscription(workspaceId: string) {
  return prisma.subscription.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    include: {
      workspace: { select: { name: true, slug: true } },
    },
  })
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  return prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  })
}

export async function getActiveSubscriptionCount(workspaceId: string): Promise<number> {
  return prisma.subscription.count({
    where: {
      workspaceId,
      status: { in: ['ACTIVE', 'TRIALING'] },
    },
  })
}
