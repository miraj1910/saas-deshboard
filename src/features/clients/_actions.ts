'use server'

import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions, AuthorizationError } from '@/lib/rbac'
import { WorkspaceRole } from '@prisma/client'
import { createNotification } from '@/lib/notifications'
import { checkPlanClientLimit } from '@/lib/stripe/plans'
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientInput,
  type UpdateClientInput,
} from '@/features/clients/schemas'
import {
  findClientById,
  findClientWithDetails,
  listAllClients,
  listScopedClients,
  getAccessibleClientIds,
  type ClientWithRelations,
} from '@/features/clients/queries'

export type ClientActionResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}

function ok<T>(data: T): ClientActionResult<T> {
  return { success: true, data }
}

function err(error: string): ClientActionResult<never> {
  return { success: false, error }
}

export async function createClient(
  workspaceId: string,
  input: CreateClientInput,
): Promise<ClientActionResult<ClientWithRelations>> {
  try {
    const parsed = createClientSchema.parse(input)
    const ctx = await createWorkspaceContext(workspaceId)
    if (!ctx.ability.can(Permissions.ClientCreate)) {
      return err('You do not have permission to create clients')
    }

    const clientLimit = await checkPlanClientLimit(ctx.member.workspaceId)
    if (!clientLimit.allowed) {
      return err(
        `Your plan allows a maximum of ${clientLimit.limit} clients. Upgrade to add more.`,
      )
    }

    const client = await prisma.client.create({
      data: {
        workspaceId: ctx.member.workspaceId,
        name: parsed.name,
        email: parsed.email ?? null,
        phone: parsed.phone ?? null,
        company: parsed.company ?? null,
        notes: parsed.notes ?? null,
      },
      include: { _count: { select: { projects: true, invoices: true } } },
    })

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: ctx.member.workspaceId, userId: { not: ctx.session.userId } },
      select: { userId: true },
    })

    await Promise.all(
      members.map((m) =>
        createNotification({
          workspaceId: ctx.member.workspaceId,
          userId: m.userId,
          type: 'CLIENT_CREATED',
          title: `"${parsed.name}" has been added as a client`,
          message: parsed.company ?? null,
          link: `/clients`,
          actorId: ctx.session.userId,
        }),
      ),
    )

    return ok(client)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function updateClient(
  workspaceId: string,
  clientId: string,
  input: UpdateClientInput,
): Promise<ClientActionResult<ClientWithRelations>> {
  try {
    const parsed = updateClientSchema.parse(input)
    const ctx = await createWorkspaceContext(workspaceId)

    const client = await findClientById(clientId, ctx.member.workspaceId)
    if (!client) return err('Client not found')

    if (!ctx.ability.can(Permissions.ClientUpdate)) {
      return err('You do not have permission to update clients')
    }

    if (ctx.member.role === WorkspaceRole.TEAM_MEMBER) {
      const accessibleIds = await getAccessibleClientIds(ctx.session.userId, ctx.member.workspaceId)
      if (!accessibleIds.includes(clientId)) {
        return err('You do not have access to this client')
      }
    }

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.email !== undefined && { email: parsed.email }),
        ...(parsed.phone !== undefined && { phone: parsed.phone }),
        ...(parsed.company !== undefined && { company: parsed.company }),
        ...(parsed.notes !== undefined && { notes: parsed.notes }),
        ...(parsed.status !== undefined && { status: parsed.status }),
      },
      include: { _count: { select: { projects: true, invoices: true } } },
    })

    return ok(updated)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    if (e instanceof Error && 'issues' in e) return err('Invalid input')
    throw e
  }
}

export async function archiveClient(
  workspaceId: string,
  clientId: string,
): Promise<ClientActionResult<ClientWithRelations>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    const client = await findClientById(clientId, ctx.member.workspaceId)
    if (!client) return err('Client not found')

    if (!ctx.ability.can(Permissions.ClientArchive)) {
      return err('You do not have permission to archive clients')
    }

    if (client.status === 'ARCHIVED') {
      return err('Client is already archived')
    }

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: { status: 'ARCHIVED' },
      include: { _count: { select: { projects: true, invoices: true } } },
    })

    return ok(updated)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function listClients(
  workspaceId: string,
): Promise<ClientActionResult<ClientWithRelations[]>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    if (!ctx.ability.can(Permissions.ClientRead) && !ctx.ability.can(Permissions.ClientReadOwn)) {
      return err('You do not have permission to view clients')
    }

    if (ctx.member.role === WorkspaceRole.OWNER || ctx.member.role === WorkspaceRole.MANAGER) {
      const clients = await listAllClients(ctx.member.workspaceId)
      return ok(clients)
    }

    const accessibleIds = await getAccessibleClientIds(ctx.session.userId, ctx.member.workspaceId)
    const clients = await listScopedClients(ctx.member.workspaceId, accessibleIds)
    return ok(clients)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}

export async function getClient(
  workspaceId: string,
  clientId: string,
): Promise<ClientActionResult<ClientWithRelations | null>> {
  try {
    const ctx = await createWorkspaceContext(workspaceId)

    const allowed =
      ctx.ability.can(Permissions.ClientRead) || ctx.ability.can(Permissions.ClientReadOwn)
    if (!allowed) {
      return err('You do not have permission to view clients')
    }

    if (ctx.member.role === WorkspaceRole.OWNER || ctx.member.role === WorkspaceRole.MANAGER) {
      const client = await findClientWithDetails(clientId, ctx.member.workspaceId)
      return ok(client)
    }

    const accessibleIds = await getAccessibleClientIds(ctx.session.userId, ctx.member.workspaceId)
    if (!accessibleIds.includes(clientId)) {
      return err('You do not have access to this client')
    }

    const client = await findClientWithDetails(clientId, ctx.member.workspaceId)
    return ok(client)
  } catch (e) {
    if (e instanceof AuthorizationError) return err(e.message)
    throw e
  }
}
