import { prisma } from '@/lib/prisma'
import type { Plan } from '@prisma/client'

export type PlanInfo = {
  id: Plan
  name: string
  description: string
  maxClients: number | null
  maxTeamMembers: number | null
  hasTeamCollaboration: boolean
  hasClientPortal: boolean
  priceLabel: string
}

export const PLAN_DEFINITIONS: Record<Plan, PlanInfo> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    description: 'For solo freelancers getting started',
    maxClients: 3,
    maxTeamMembers: 1,
    hasTeamCollaboration: false,
    hasClientPortal: false,
    priceLabel: 'Free',
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    description: 'For growing agencies with clients',
    maxClients: null,
    maxTeamMembers: null,
    hasTeamCollaboration: true,
    hasClientPortal: true,
    priceLabel: 'Paid',
  },
  AGENCY: {
    id: 'AGENCY',
    name: 'Agency',
    description: 'For large teams with full collaboration',
    maxClients: null,
    maxTeamMembers: null,
    hasTeamCollaboration: true,
    hasClientPortal: true,
    priceLabel: 'Paid',
  },
}

export function getPlanInfo(plan: Plan): PlanInfo {
  return PLAN_DEFINITIONS[plan]
}

export async function checkPlanClientLimit(
  workspaceId: string,
): Promise<{ allowed: boolean; current: number; limit: number | null }> {
  const subscription = await prisma.subscription.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  })

  if (!subscription) return { allowed: false, current: 0, limit: 0 }

  const plan = getPlanInfo(subscription.plan as Plan)
  if (plan.maxClients === null) return { allowed: true, current: 0, limit: null }

  const currentCount = await prisma.client.count({
    where: { workspaceId, deletedAt: null },
  })

  return {
    allowed: currentCount < plan.maxClients,
    current: currentCount,
    limit: plan.maxClients,
  }
}

export async function checkPlanTeamLimit(
  workspaceId: string,
): Promise<{ allowed: boolean; current: number; limit: number | null }> {
  const subscription = await prisma.subscription.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  })

  if (!subscription) return { allowed: false, current: 0, limit: 0 }

  const plan = getPlanInfo(subscription.plan as Plan)
  if (plan.maxTeamMembers === null) return { allowed: true, current: 0, limit: null }

  const currentCount = await prisma.workspaceMember.count({
    where: { workspaceId },
  })

  return {
    allowed: currentCount < plan.maxTeamMembers,
    current: currentCount,
    limit: plan.maxTeamMembers,
  }
}

export async function checkPlanFeature(
  workspaceId: string,
  feature: 'teamCollaboration' | 'clientPortal',
): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  })

  if (!subscription) return false

  const plan = getPlanInfo(subscription.plan as Plan)

  switch (feature) {
    case 'teamCollaboration':
      return plan.hasTeamCollaboration
    case 'clientPortal':
      return plan.hasClientPortal
    default:
      return false
  }
}
