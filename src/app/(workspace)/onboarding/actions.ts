'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function createWorkspaceAction() {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const userId = session.user.id

  try {
    const existingMembership = await prisma.workspaceMember.findFirst({
      where: { userId },
      include: { workspace: { select: { slug: true } } },
    })

    if (existingMembership) {
      logger.info('[createWorkspaceAction] User already has a workspace', {
        userId,
        workspaceSlug: existingMembership.workspace.slug,
      })
      return { success: true, slug: existingMembership.workspace.slug }
    }

    const raw = (session.user.name ?? 'workspace')
      .toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
      .slice(0, 50).replace(/^-|-$/g, '') || 'workspace'

    const suffix = Math.random().toString(36).slice(2, 6)
    const slug = `${raw}-${suffix}`

    await prisma.workspace.create({
      data: {
        name: session.user.name ?? 'My Workspace',
        slug,
        settings: {
          create: { timezone: 'UTC', primaryColor: '#6366F1', theme: { darkMode: false, fontSize: 'normal' } },
        },
        subscriptions: {
          create: {
            plan: 'FREE',
            status: 'TRIALING',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
          },
        },
        members: { create: { userId, role: 'OWNER' } },
      },
    })

    logger.info('[createWorkspaceAction] Workspace created for recovery', {
      userId,
      slug,
    })

    return { success: true, slug }
  } catch (e) {
    logger.error('[createWorkspaceAction] Failed to create workspace', {
      userId,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    })
    return { success: false, error: 'Failed to create workspace. Please try again or contact support.' }
  }
}
