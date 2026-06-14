import { prisma } from '@/lib/prisma'
import {
  can,
  defineAbilityFor,
  assert,
  isSameWorkspace,
  canSelfApprove,
  canOwnershipTransfer,
  canEditTimeEntry,
  canDeleteEntity,
  getAuthorizedSession,
  AuthorizationError,
  Permissions,
  type AnyRole,
  type Resource,
  type TimeEntryResource,
  type Permission,
} from '@/lib/rbac'
import { WorkspaceRole } from '@prisma/client'

export type WorkspaceAuthContext = {
  session: {
    id: string
    userId: string
    workspaceSlug: string
  }
  member: {
    id: string
    workspaceId: string
    role: WorkspaceRole
    userId: string
  }
  ability: ReturnType<typeof defineAbilityFor>
}

export type ClientAuthContext = {
  session: {
    id: string
    userId: string
  }
  clientMember: {
    id: string
    clientId: string
    userId: string
    workspaceId: string
  }
  ability: ReturnType<typeof defineAbilityFor>
}

export async function createWorkspaceContext(workspaceId: string): Promise<WorkspaceAuthContext> {
  const session = await getAuthorizedSession()
  assert(session.user.userType === 'TEAM', 'Only team users can access workspace resources')

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  })
  if (!member) throw new AuthorizationError('Not a member of this workspace')

  const ability = defineAbilityFor(member.role)

  return {
    session: {
      id: session.user.id,
      userId: session.user.id,
      workspaceSlug: session.user.workspaceSlug ?? '',
    },
    member,
    ability,
  }
}

export async function createClientContext(clientId: string): Promise<ClientAuthContext> {
  const session = await getAuthorizedSession()
  assert(session.user.userType === 'CLIENT', 'Only client users can access the portal')

  const clientMember = await prisma.clientMember.findUnique({
    where: { clientId_userId: { clientId, userId: session.user.id } },
  })
  if (!clientMember) throw new AuthorizationError('Not authorized to access this client record')

  const ability = defineAbilityFor('CLIENT')

  return {
    session: {
      id: session.user.id,
      userId: session.user.id,
    },
    clientMember,
    ability,
  }
}

export function assertWorkspaceAccess(
  ctx: WorkspaceAuthContext,
  resource: Resource | null | undefined,
): void {
  assert(!!resource, 'Resource not found')
  assert(isSameWorkspace(resource, ctx.member.workspaceId), 'Cross-workspace access denied')
}

export function assertPermission(ctx: WorkspaceAuthContext, permission: Permission): void {
  assert(ctx.ability.can(permission), `Missing permission: ${permission}`)
}

export function assertClientPermission(ctx: ClientAuthContext, permission: Permission): void {
  assert(ctx.ability.can(permission), `Missing permission: ${permission}`)
}

export function assertResourceOwner(
  ctx: WorkspaceAuthContext,
  resource: Resource,
  permission: Permission,
): void {
  assertWorkspaceAccess(ctx, resource)
  assertPermission(ctx, permission)

  if (ctx.member.role === WorkspaceRole.OWNER) return

  const ownerId = resource.createdById ?? resource.assigneeId ?? resource.userId ?? null
  assert(
    ownerId === ctx.session.userId,
    'You do not have access to this resource',
  )
}

export function assertNoSelfApproval(entryUserId: string, ctx: WorkspaceAuthContext): void {
  assert(
    canSelfApprove(entryUserId, ctx.session.userId),
    'Self-approval is not permitted',
  )
}

export function assertValidOwnershipTransfer(
  currentOwner: { role: WorkspaceRole },
  targetMember: { role: WorkspaceRole },
): void {
  assert(
    canOwnershipTransfer(currentOwner, targetMember),
    'Invalid ownership transfer: target is already an owner',
  )
}

export function assertCanEditTimeEntry(
  entry: TimeEntryResource,
  ctx: WorkspaceAuthContext,
): void {
  assertWorkspaceAccess(ctx, entry)
  assert(
    canEditTimeEntry(entry, ctx.ability),
    'Time entry cannot be edited in its current state',
  )
}

export function assertCanDeleteEntity(
  entity: { deletedAt?: Date | null },
  ctx: WorkspaceAuthContext,
  permission: Permission,
): void {
  assert(
    canDeleteEntity(entity, ctx.ability, permission),
    'Entity cannot be deleted in its current state',
  )
}

export function assertRole(ctx: WorkspaceAuthContext, role: WorkspaceRole): void {
  assert(ctx.member.role === role, `Requires ${role} role`)
}

export function assertAnyRole(ctx: WorkspaceAuthContext, ...roles: WorkspaceRole[]): void {
  assert(roles.includes(ctx.member.role), `Requires one of: ${roles.join(', ')}`)
}

export function requireRole(role: WorkspaceRole) {
  return async (workspaceId: string): Promise<WorkspaceAuthContext> => {
    const ctx = await createWorkspaceContext(workspaceId)
    assertRole(ctx, role)
    return ctx
  }
}

export function requireAnyRole(...roles: WorkspaceRole[]) {
  return async (workspaceId: string): Promise<WorkspaceAuthContext> => {
    const ctx = await createWorkspaceContext(workspaceId)
    assertAnyRole(ctx, ...roles)
    return ctx
  }
}

export { AuthorizationError }
