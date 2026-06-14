import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthorizedSession } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthorizedSession()
    const { searchParams } = new URL(request.url)
    const workspaceSlug = searchParams.get('workspaceSlug')

    if (!workspaceSlug) {
      return NextResponse.json({ error: 'workspaceSlug is required' }, { status: 400 })
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      select: { id: true },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: session.user.id } },
    })

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 })
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { workspaceId: workspace.id, userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          link: true,
          readAt: true,
          actorId: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { workspaceId: workspace.id, userId: session.user.id, readAt: null },
      }),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
