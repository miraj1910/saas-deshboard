export type PortalProject = {
  id: string
  name: string
  description: string | null
  status: string
  hourlyRate: number
  startDate: string | null
  dueDate: string | null
}

export type PortalTask = {
  id: string
  title: string
  description: string | null
  status: string
  dueDate: string | null
}

export type PortalInvoice = {
  id: string
  invoiceNumber: string
  status: string
  totalAmount: number
  issuedDate: string
  dueDate: string
  paidAt: string | null
  notes: string | null
}

export type PortalRequest = {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export type PortalDashboardData = {
  projectCount: number
  activeProjectCount: number
  invoiceCount: number
  outstandingInvoiceCount: number
  outstandingInvoiceAmount: number
  requestCount: number
  openRequestCount: number
  recentInvoices: PortalInvoice[]
  recentProjects: PortalProject[]
}
