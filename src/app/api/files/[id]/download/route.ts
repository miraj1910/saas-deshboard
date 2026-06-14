import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Permissions, defineAbilityFor } from '@/lib/rbac'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const file = await prisma.fileAttachment.findUnique({
      where: { id },
      include: {
        workspace: { select: { slug: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const workspaceId = file.workspaceId

    if (session.user.userType === 'TEAM') {
      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
      })
      if (!member) {
        return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 })
      }

      const ability = defineAbilityFor(member.role)
      const isProjectFile = !!file.projectId
      const permission = isProjectFile ? Permissions.FileProjectDownload : Permissions.FileDeliverableDownload

      if (!ability.can(permission)) {
        return NextResponse.json({ error: 'You do not have permission to download this file' }, { status: 403 })
      }
    } else if (session.user.userType === 'CLIENT') {
      const clientMember = await prisma.clientMember.findFirst({
        where: { userId: session.user.id, workspaceId },
      })
      if (!clientMember) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }

      const ability = defineAbilityFor('CLIENT')
      if (!ability.can(Permissions.FileDeliverableDownload)) {
        return NextResponse.json({ error: 'You do not have permission to download this file' }, { status: 403 })
      }

      if (file.clientId && file.clientId !== clientMember.clientId) {
        return NextResponse.json({ error: 'Not authorized to download this file' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 403 })
    }

    return NextResponse.redirect(file.url)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
