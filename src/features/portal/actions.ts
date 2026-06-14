'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function createClientRequest(
  title: string,
  description: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    const clientMember = await prisma.clientMember.findFirst({
      where: { userId: session.user.id },
      include: { client: { select: { id: true, workspaceId: true } } },
    })

    if (!clientMember) return { success: false, error: 'No client record found' }

    await prisma.clientRequest.create({
      data: {
        workspaceId: clientMember.client.workspaceId,
        clientId: clientMember.client.id,
        title,
        description: description ?? null,
      },
    })

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to create request' }
  }
}
