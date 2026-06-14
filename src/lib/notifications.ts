import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@prisma/client'

export type CreateNotificationInput = {
  workspaceId: string
  userId: string
  type: NotificationType
  title: string
  message?: string | null
  link?: string | null
  actorId?: string | null
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await prisma.notification.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
      actorId: input.actorId ?? null,
    },
  })
}
