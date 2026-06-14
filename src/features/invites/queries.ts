import { prisma } from '@/lib/prisma'
import type { Invite, WorkspaceRole } from '@prisma/client'

export type InviteWithRelations = Invite & {
  createdBy: { id: string; name: string | null; email: string } | null
  client: { id: string; name: string; company: string | null } | null
}

export async function findInviteByToken(token: string) {
  return prisma.invite.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
    },
  })
}

export async function listPendingInvites(workspaceId: string) {
  return prisma.invite.findMany({
    where: { workspaceId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, company: true } },
    },
  })
}

export async function getInviteCount(workspaceId: string): Promise<number> {
  return prisma.invite.count({
    where: { workspaceId, status: 'PENDING' },
  })
}
