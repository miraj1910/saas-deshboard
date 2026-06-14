import { WorkspaceRole } from '@prisma/client'
import { auth } from '@/lib/auth'

export type TeamRole = Exclude<WorkspaceRole, 'OWNER' | 'MANAGER'>
export type AnyRole = WorkspaceRole | 'CLIENT'

export type Resource = {
  workspaceId: string
  createdById?: string | null
  assigneeId?: string | null
  userId?: string | null
}

export type TimeEntryResource = Resource & {
  status: string
  userId: string
}

export type MemberResource = {
  workspaceId: string
  role: WorkspaceRole
  userId: string
}

const p = <T extends string>(t: T) => t

export const Permissions = {
  WorkspaceRead: p('workspace:read'),
  WorkspaceUpdate: p('workspace:update'),
  WorkspaceDelete: p('workspace:delete'),

  TeamRead: p('team:read'),
  TeamInvite: p('team:invite'),
  TeamChangeRole: p('team:change-role'),
  TeamRemove: p('team:remove'),
  TeamTransferOwnership: p('team:transfer-ownership'),

  ClientCreate: p('client:create'),
  ClientRead: p('client:read'),
  ClientReadOwn: p('client:read-own'),
  ClientUpdate: p('client:update'),
  ClientArchive: p('client:archive'),
  ClientDelete: p('client:delete'),
  ClientInvitePortal: p('client:invite-portal'),

  ProjectCreate: p('project:create'),
  ProjectRead: p('project:read'),
  ProjectReadOwn: p('project:read-own'),
  ProjectReadClient: p('project:read-client'),
  ProjectUpdate: p('project:update'),
  ProjectUpdateOwn: p('project:update-own'),
  ProjectArchive: p('project:archive'),
  ProjectDelete: p('project:delete'),

  TaskCreate: p('task:create'),
  TaskCreateOwn: p('task:create-own'),
  TaskRead: p('task:read'),
  TaskReadOwn: p('task:read-own'),
  TaskReadClient: p('task:read-client'),
  TaskUpdate: p('task:update'),
  TaskUpdateOwn: p('task:update-own'),
  TaskDelete: p('task:delete'),

  TimeCreate: p('time:create'),
  TimeRead: p('time:read'),
  TimeReadOwn: p('time:read-own'),
  TimeUpdate: p('time:update'),
  TimeUpdateOwn: p('time:update-own'),
  TimeSubmit: p('time:submit'),
  TimeApprove: p('time:approve'),
  TimeDelete: p('time:delete'),
  TimeDeleteOwn: p('time:delete-own'),

  InvoiceCreate: p('invoice:create'),
  InvoiceRead: p('invoice:read'),
  InvoiceReadOwn: p('invoice:read-own'),
  InvoiceReadClient: p('invoice:read-client'),
  InvoiceUpdate: p('invoice:update'),
  InvoiceSend: p('invoice:send'),
  InvoiceMarkPaid: p('invoice:mark-paid'),
  InvoiceVoid: p('invoice:void'),
  InvoiceDelete: p('invoice:delete'),
  InvoiceDownloadPdf: p('invoice:download-pdf'),

  RequestCreate: p('request:create'),
  RequestRead: p('request:read'),
  RequestUpdate: p('request:update'),

  ReportPersonal: p('report:personal'),
  ReportWorkspace: p('report:workspace'),
  ReportProfitability: p('report:profitability'),
  ReportTeamUtilization: p('report:team-utilization'),

  SubscriptionRead: p('subscription:read'),
  SubscriptionManage: p('subscription:manage'),

  InviteCreate: p('invite:create'),
  InviteRead: p('invite:read'),
  InviteRevoke: p('invite:revoke'),

  AuditRead: p('audit:read'),
  ActivityRead: p('activity:read'),

  ApiKeyCreate: p('api-key:create'),
  ApiKeyRead: p('api-key:read'),
  ApiKeyRevoke: p('api-key:revoke'),

  FileProjectUpload: p('file:project-upload'),
  FileProjectDownload: p('file:project-download'),
  FileProjectDelete: p('file:project-delete'),
  FileDeliverableUpload: p('file:deliverable-upload'),
  FileDeliverableDownload: p('file:deliverable-download'),
} as const

export type Permission = (typeof Permissions)[keyof typeof Permissions]

const ALL: readonly Permission[] = Object.values(Permissions)

const R = Permissions

const ROLE_PERMISSIONS: Record<AnyRole, readonly Permission[]> = {
  [WorkspaceRole.OWNER]: ALL,

  [WorkspaceRole.MANAGER]: [
    R.TeamRead,
    R.ClientCreate, R.ClientRead, R.ClientUpdate, R.ClientArchive, R.ClientInvitePortal,
    R.ProjectCreate, R.ProjectRead, R.ProjectUpdate, R.ProjectArchive,
    R.TaskCreate, R.TaskRead, R.TaskUpdate, R.TaskDelete,
    R.TimeCreate, R.TimeRead, R.TimeUpdateOwn, R.TimeSubmit, R.TimeApprove, R.TimeDeleteOwn,
    R.InvoiceRead, R.InvoiceDownloadPdf,
    R.RequestCreate, R.RequestRead, R.RequestUpdate,
    R.ReportPersonal, R.ReportWorkspace, R.ReportProfitability, R.ReportTeamUtilization,
    R.InviteCreate, R.InviteRead,
    R.ActivityRead,
    R.FileProjectUpload, R.FileProjectDownload, R.FileProjectDelete,
    R.FileDeliverableUpload, R.FileDeliverableDownload,
  ],

  [WorkspaceRole.TEAM_MEMBER]: [
    R.WorkspaceRead,
    R.TeamRead,
    R.ClientCreate, R.ClientReadOwn, R.ClientUpdate,
    R.ProjectCreate, R.ProjectReadOwn, R.ProjectUpdateOwn,
    R.TaskCreateOwn, R.TaskReadOwn, R.TaskUpdateOwn,
    R.TimeCreate, R.TimeReadOwn, R.TimeUpdateOwn, R.TimeSubmit, R.TimeDeleteOwn,
    R.InvoiceReadOwn, R.InvoiceDownloadPdf,
    R.RequestRead, R.RequestUpdate,
    R.ReportPersonal,
    R.ActivityRead,
    R.FileProjectUpload, R.FileProjectDownload, R.FileProjectDelete,
    R.FileDeliverableUpload, R.FileDeliverableDownload,
  ],

  CLIENT: [
    R.ClientReadOwn,
    R.ProjectReadClient,
    R.TaskReadClient,
    R.InvoiceReadClient, R.InvoiceDownloadPdf,
    R.RequestCreate, R.RequestRead,
    R.ReportPersonal,
    R.FileProjectDownload, R.FileDeliverableDownload,
  ],
}

export function can(role: AnyRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function defineAbilityFor(role: AnyRole) {
  return {
    can(action: Permission): boolean {
      return can(role, action)
    },
  }
}

export function requireRole(sessionRole: AnyRole | null | undefined, role: AnyRole): boolean {
  return sessionRole === role
}

export function requireAnyRole(sessionRole: AnyRole | null | undefined, ...roles: AnyRole[]): boolean {
  return roles.includes(sessionRole as AnyRole)
}

export function canAccessWorkspace(member: { deletedAt?: Date | null } | null | undefined): boolean {
  return member !== null && member !== undefined && !member.deletedAt
}

export function isSameWorkspace(
  resource: { workspaceId: string } | null | undefined,
  workspaceId: string,
): boolean {
  return resource?.workspaceId === workspaceId
}

export function canSelfApprove(entryUserId: string, sessionUserId: string): boolean {
  return entryUserId !== sessionUserId
}

export function canOwnershipTransfer(
  currentOwner: { role: WorkspaceRole },
  targetMember: { role: WorkspaceRole },
): boolean {
  return currentOwner.role === WorkspaceRole.OWNER && targetMember.role !== WorkspaceRole.OWNER
}

export function isOwnClientRecord(
  clientId: string,
  clientMember: { clientId: string; userId: string } | null | undefined,
  sessionUserId: string,
): boolean {
  return clientMember?.clientId === clientId && clientMember.userId === sessionUserId
}

export function canEditTimeEntry(
  entry: { status: string },
  userAbility: { can: (p: Permission) => boolean },
): boolean {
  if (entry.status !== 'DRAFT') return false
  return userAbility.can(Permissions.TimeUpdateOwn) || userAbility.can(Permissions.TimeUpdate)
}

export function canDeleteEntity(
  entity: { deletedAt?: Date | null },
  userAbility: { can: (p: Permission) => boolean },
  requiredPermission: Permission,
): boolean {
  if (entity.deletedAt) return false
  return userAbility.can(requiredPermission)
}

function getResourceOwnerId(resource: {
  createdById?: string | null
  assigneeId?: string | null
  userId?: string | null
}): string | null {
  return resource.createdById ?? resource.assigneeId ?? resource.userId ?? null
}

export function canManageResource(
  role: AnyRole,
  permission: Permission,
  resource: Resource,
  workspaceId: string,
  sessionUserId: string,
): boolean {
  if (!can(role, permission)) return false
  if (!isSameWorkspace(resource, workspaceId)) return false
  if (role === WorkspaceRole.OWNER) return true

  const ownerId = getResourceOwnerId(resource)
  if (ownerId === null) return role !== WorkspaceRole.TEAM_MEMBER
  return ownerId === sessionUserId
}

export class AuthorizationError extends Error {
  statusCode = 403

  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export function assert(condition: boolean, message?: string): asserts condition is true {
  if (!condition) {
    throw new AuthorizationError(message)
  }
}

export type AuthorizedSession = {
  user: {
    id: string
    userType: 'TEAM' | 'CLIENT'
    workspaceSlug: string | null
    onboardingComplete: boolean
  }
}

export async function getAuthorizedSession(): Promise<AuthorizedSession> {
  const session = await auth()
  assert(!!session?.user?.id, 'Unauthorized')
  return session as AuthorizedSession
}
