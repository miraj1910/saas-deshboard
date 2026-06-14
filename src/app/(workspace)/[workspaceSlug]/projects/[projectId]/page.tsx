import { prisma } from '@/lib/prisma'
import { createWorkspaceContext } from '@/lib/authorization'
import { Permissions } from '@/lib/rbac'
import { notFound } from 'next/navigation'
import { findProjectWithDetails, listTasksByProject } from '@/features/projects/queries'
import { listProjectFiles } from '@/features/files/queries'
import { ProjectDetail } from '@/features/projects/components/project-detail'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>
}) {
  const { workspaceSlug, projectId } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })
  if (!workspace) notFound()

  const ctx = await createWorkspaceContext(workspace.id)

  const project = await findProjectWithDetails(projectId, workspace.id)
  if (!project) notFound()

  const clientDetails = project.clientId
    ? await prisma.client.findUnique({
        where: { id: project.clientId },
        select: { id: true, name: true, company: true, email: true, phone: true },
      })
    : null

  const memberView =
    !ctx.ability.can(Permissions.ProjectRead) && ctx.ability.can(Permissions.ProjectReadOwn)
  const tasks = await listTasksByProject(
    projectId,
    workspace.id,
    memberView ? ctx.session.userId : undefined,
    memberView,
  )

  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id, user: { deletedAt: null } },
    select: {
      userId: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  })
  const members = workspaceMembers
    .filter((m) => m.user !== null)
    .map((m) => ({ id: m.user.id, name: m.user.name, avatarUrl: m.user.avatarUrl }))

  const canUpdateProject = ctx.ability.can(Permissions.ProjectUpdate)
  const canArchiveProject = ctx.ability.can(Permissions.ProjectArchive)
  const canCreateTask = ctx.ability.can(Permissions.TaskCreate) || ctx.ability.can(Permissions.TaskCreateOwn)
  const canUpdateTask = ctx.ability.can(Permissions.TaskUpdate) || ctx.ability.can(Permissions.TaskUpdateOwn)
  const canDeleteTask = ctx.ability.can(Permissions.TaskDelete)

  const canEdit = canUpdateProject || canArchiveProject

  const initialFiles = ctx.ability.can(Permissions.FileProjectDownload)
    ? await listProjectFiles(projectId, workspace.id)
    : []
  const canUploadFiles = ctx.ability.can(Permissions.FileProjectUpload)
  const canDeleteFiles = ctx.ability.can(Permissions.FileProjectDelete)

  return (
    <ProjectDetail
      project={project}
      clientDetails={clientDetails}
      tasks={tasks}
      members={members}
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
      canEdit={canEdit}
      canArchive={canArchiveProject}
      canCreateTask={canCreateTask}
      canUpdateTask={canUpdateTask}
      canDeleteTask={canDeleteTask}
      initialFiles={initialFiles}
      canUploadFiles={canUploadFiles}
      canDeleteFiles={canDeleteFiles}
    />
  )
}
