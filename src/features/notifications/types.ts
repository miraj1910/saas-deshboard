import type { NotificationType } from '@prisma/client'

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  message: string | null
  link: string | null
  readAt: Date | null
  actorId: string | null
  createdAt: Date
}

export type NotificationsData = {
  notifications: NotificationItem[]
  unreadCount: number
}
