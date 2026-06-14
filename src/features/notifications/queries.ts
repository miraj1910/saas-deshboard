import { prisma } from '@/lib/prisma'
import type { NotificationItem } from './types'

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  link: true,
  readAt: true,
  actorId: true,
  createdAt: true,
} as const

export async function getNotifications(
  workspaceId: string,
  userId: string,
  limit = 10,
): Promise<NotificationItem[]> {
  const notifications = await prisma.notification.findMany({
    where: { workspaceId, userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: notificationSelect,
  })

  return notifications as unknown as NotificationItem[]
}

export async function getUnreadCount(
  workspaceId: string,
  userId: string,
): Promise<number> {
  return prisma.notification.count({
    where: { workspaceId, userId, readAt: null },
  })
}

export async function getNotificationById(
  notificationId: string,
  workspaceId: string,
): Promise<NotificationItem | null> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, workspaceId },
    select: notificationSelect,
  })

  return notification as unknown as NotificationItem | null
}
