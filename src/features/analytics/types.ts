export type RevenueTrendItem = {
  month: string
  revenue: number
}

export type InvoiceStatusItem = {
  status: string
  count: number
  amount: number
}

export type WeeklyHoursItem = {
  week: string
  hours: number
}

export type ProjectStatusItem = {
  status: string
  count: number
}

export type TopClient = {
  id: string
  name: string
  revenue: number
  projectCount: number
}

export type TeamUtilizationMember = {
  id: string
  name: string
  hoursLogged: number
  assignedTasks: number
  utilization: number
}

export type AnalyticsData = {
  revenueMtd: number
  revenueYtd: number
  outstandingInvoices: number
  teamUtilization: number
  hoursTracked: number
  projectsCompleted: number
  activeClients: number
  clientGrowth: number
  revenueTrend: RevenueTrendItem[]
  invoiceStatusDistribution: InvoiceStatusItem[]
  weeklyHours: WeeklyHoursItem[]
  projectStatusDistribution: ProjectStatusItem[]
  topClients: TopClient[]
  teamUtilizationMembers: TeamUtilizationMember[]
}
