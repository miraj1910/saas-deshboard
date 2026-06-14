export type ActivityItem = {
  id: string
  action: string
  description: string
  entityType: string
  userName: string | null
  userAvatar: string | null
  createdAt: Date
}

export type DeadlineItem = {
  id: string
  title: string
  projectName: string
  projectId: string
  dueDate: Date
  assigneeName: string | null
  status: string
}

export type QuickStats = {
  hoursLoggedToday: number
  tasksCompletedThisMonth: number
  utilizationRate: number | null
  outstandingInvoicesAmount: number
  teamMemberCount: number
}

export type DashboardData = {
  revenueMtd: number
  activeClients: number
  activeProjects: number
  pendingInvoices: number
  recentActivity: ActivityItem[]
  upcomingDeadlines: DeadlineItem[]
  quickStats: QuickStats
}
