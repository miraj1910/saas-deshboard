'use server'

import { prisma } from '@/lib/prisma'
import { getAuthorizedSession } from '@/lib/rbac'

export async function markAsRead(
  workspaceSlug: string,
  notificationId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAuthorizedSession()

    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      select: { id: true },
    })

    if (!workspace) return { success: false, error: 'Workspace not found' }

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, workspaceId: workspace.id, userId: session.user.id },
    })

    if (!notification) return { success: false, error: 'Notification not found' }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    })

    return { success: true }
  } catch {
    return { success: false, error: 'Unauthorized' }
  }
}

export async function markAllAsRead(
  workspaceSlug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAuthorizedSession()

    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      select: { id: true },
    })

    if (!workspace) return { success: false, error: 'Workspace not found' }

    await prisma.notification.updateMany({
      where: { workspaceId: workspace.id, userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    })

    return { success: true }
  } catch {
    return { success: false, error: 'Unauthorized' }
  }
}
