'use server'

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions, AuthorizationError } from '@/lib/rbac'
import { checkPlanTeamLimit } from '@/lib/stripe/plans'
import { sendInviteEmail } from '@/lib/email'
import { listPendingInvites } from '@/features/invites/queries'
import { WorkspaceRole } from '@prisma/client'
import type { InviteWithRelations } from '@/features/invites/queries'

export type InviteActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function ok<T>(data: T): InviteActionResult<T> {
  return { success: true, data }
}

function err(error: string): InviteActionResult<never> {
  return { success: false, error }
}

export async function createInvite(
  workspaceId: string,
  email: string,
  role: WorkspaceRole,
): Promise<InviteActionResult<InviteWithRelations>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.InviteCreate)) {
      return err('You do not have permission to create invites')
    }

    const teamLimit = await checkPlanTeamLimit(ctx.member.workspaceId)
    if (!teamLimit.allowed) {
      return err(
        `Your plan allows a maximum of ${teamLimit.limit} team members. Upgrade to invite more.`,
      )
    }

    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: ctx.member.workspaceId,
        user: { email },
      },
    })

    if (existingMember) {
      return err('This user is already a member of your workspace')
    }

    const existingInvite = await prisma.invite.findFirst({
      where: {
        workspaceId: ctx.member.workspaceId,
        email,
        status: 'PENDING',
      },
    })

    if (existingInvite) {
      return err('An invitation has already been sent to this email')
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const invite = await prisma.invite.create({
      data: {
        workspaceId: ctx.member.workspaceId,
        email,
        role,
        token,
        expiresAt,
        createdById: ctx.session.userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, company: true } },
      },
    })

    const [workspace, inviter] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: ctx.member.workspaceId },
        select: { name: true },
      }),
      prisma.user.findUnique({
        where: { id: ctx.session.userId },
        select: { name: true },
      }),
    ])

    sendInviteEmail({
      email,
      inviterName: inviter?.name ?? 'A team member',
      workspaceName: workspace?.name ?? '',
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000'}/invite?token=${token}`,
      role: role.toLowerCase().replace('_', ' '),
    }).catch(() => {})

    return ok(invite)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function listInvites(
  workspaceId: string,
): Promise<InviteActionResult<InviteWithRelations[]>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.InviteRead)) {
      return err('You do not have permission to view invites')
    }

    const invites = await listPendingInvites(ctx.member.workspaceId)
    return ok(invites)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function revokeInvite(
  workspaceId: string,
  inviteId: string,
): Promise<InviteActionResult<InviteWithRelations>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.InviteRevoke)) {
      return err('You do not have permission to revoke invites')
    }

    const invite = await prisma.invite.findFirst({
      where: { id: inviteId, workspaceId: ctx.member.workspaceId },
    })

    if (!invite) return err('Invite not found')
    if (invite.status !== 'PENDING') return err('This invite can no longer be revoked')

    const updated = await prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, company: true } },
      },
    })

    return ok(updated)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function acceptInvite(
  token: string,
  userId?: string,
): Promise<InviteActionResult<{ workspaceSlug: string }>> {
  try {
    const invite = await prisma.invite.findUnique({ where: { token } })

    if (!invite) return err('Invalid or expired invitation')
    if (invite.status !== 'PENDING') return err('This invitation is no longer valid')
    if (invite.expiresAt < new Date()) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      })
      return err('This invitation has expired')
    }

    if (!userId) return err('You must be signed in to accept an invitation')

    await prisma.$transaction([
      prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      }),
      prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId,
          role: invite.role,
        },
      }),
    ])

    const workspace = await prisma.workspace.findUnique({
      where: { id: invite.workspaceId },
      select: { slug: true },
    })

    return ok({ workspaceSlug: workspace?.slug ?? '' })
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}
