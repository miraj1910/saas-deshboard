'use server'

import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions, AuthorizationError } from '@/lib/rbac'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { createBillingPortalSession } from '@/lib/stripe/portal'
import { getPlanInfo, PLAN_DEFINITIONS } from '@/lib/stripe/plans'
import { getCurrentSubscription } from '@/features/subscription/queries'

export type SubscriptionActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function ok<T>(data: T): SubscriptionActionResult<T> {
  return { success: true, data }
}

function err(error: string): SubscriptionActionResult<never> {
  return { success: false, error }
}

export async function getSubscription(
  workspaceId: string,
): Promise<SubscriptionActionResult<{
  plan: string
  status: string
  currentPeriodEnd: Date | null
  trialEndsAt: Date | null
  cancelAtPeriodEnd: boolean
  planInfo: ReturnType<typeof getPlanInfo>
}>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.SubscriptionRead)) {
      return err('You do not have permission to view subscription details')
    }

    const subscription = await getCurrentSubscription(ctx.member.workspaceId)
    if (!subscription) return err('No subscription found')

    const planInfo = getPlanInfo(subscription.plan)

    return ok({
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndsAt: subscription.trialEndsAt,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      planInfo,
    })
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function upgradeToPlan(
  workspaceId: string,
  plan: 'PRO' | 'AGENCY',
  origin: string,
): Promise<SubscriptionActionResult<{ url: string }>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.SubscriptionManage)) {
      return err('You do not have permission to manage the subscription')
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.session.userId },
      select: { email: true },
    })
    if (!user?.email) return err('User email not found')

    const result = await createCheckoutSession(
      ctx.member.workspaceId,
      user.email,
      plan,
      origin,
    )

    if (!result.success) return err(result.error)

    return ok({ url: result.url })
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function openBillingPortal(
  workspaceId: string,
  origin: string,
): Promise<SubscriptionActionResult<{ url: string }>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.SubscriptionManage)) {
      return err('You do not have permission to manage the subscription')
    }

    const result = await createBillingPortalSession(
      ctx.member.workspaceId,
      origin,
    )

    if (!result.success) return err(result.error)

    return ok({ url: result.url })
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function getPlanDefinitions() {
  return PLAN_DEFINITIONS
}


