import { PrismaClient, NotificationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const SLUG = 'miraj-gajera-87eu'

function d(year: number, month: number, day: number, hour = 9, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  const PASSWORD_HASH = await bcrypt.hash('password123', 10)

  const workspace = await prisma.workspace.findUnique({ where: { slug: SLUG } })
  if (!workspace) {
    console.error('Workspace not found:', SLUG)
    process.exit(1)
  }

  // Clean existing demo data from this workspace only
  await prisma.notification.deleteMany({ where: { workspaceId: workspace.id } })
  await prisma.activity.deleteMany({ where: { workspaceId: workspace.id } })
  await prisma.auditLog.deleteMany({ where: { workspaceId: workspace.id } })
  await prisma.timeEntry.deleteMany({ where: { workspaceId: workspace.id } })
  await prisma.fileAttachment.deleteMany({ where: { workspaceId: workspace.id } })
  await prisma.clientRequest.deleteMany({ where: { workspaceId: workspace.id } })
  await prisma.clientMember.deleteMany({ where: { workspaceId: workspace.id } })
  await prisma.invoiceLineItem.deleteMany({
    where: { invoice: { workspaceId: workspace.id } },
  })
  await prisma.invoice.deleteMany({ where: { workspaceId: workspace.id } })
  await prisma.task.deleteMany({
    where: { project: { workspaceId: workspace.id } },
  })
  await prisma.project.deleteMany({ where: { workspaceId: workspace.id } })
  await prisma.client.deleteMany({ where: { workspaceId: workspace.id } })
  console.log('Cleaned existing data from workspace:', workspace.slug)

  // ── TEAM USERS ──
  const teamEmails = [
    { email: 'sarah@creativeorbit.com', name: 'Sarah Johnson' },
    { email: 'alex@creativeorbit.com', name: 'Alex Chen' },
    { email: 'emma@creativeorbit.com', name: 'Emma Davis' },
    { email: 'michael@creativeorbit.com', name: 'Michael Brown' },
    { email: 'sophia@creativeorbit.com', name: 'Sophia Wilson' },
  ]

  const team: any[] = []
  for (const u of teamEmails) {
    let user = await prisma.user.findUnique({ where: { email: u.email } })
    if (!user) {
      user = await prisma.user.create({
        data: { email: u.email, passwordHash: PASSWORD_HASH, name: u.name, userType: 'TEAM' },
      })
    }
    team.push(user)
  }

  const [sarah, alex, emma, michael, sophia] = team

  // Upsert workspace memberships
  const memberConfigs = [
    { userId: sarah.id, role: 'MANAGER' as const },
    { userId: alex.id, role: 'MANAGER' as const },
    { userId: emma.id, role: 'TEAM_MEMBER' as const },
    { userId: michael.id, role: 'TEAM_MEMBER' as const },
    { userId: sophia.id, role: 'TEAM_MEMBER' as const },
  ]
  for (const mc of memberConfigs) {
    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: mc.userId } },
    })
    if (!existing) {
      await prisma.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: mc.userId, role: mc.role },
      })
    }
  }

  // Ensure owner role for the existing user
  const ownerUser = await prisma.user.findUnique({ where: { email: 'gajeramiraj2@gmail.com' } })
  if (ownerUser) {
    const ownerMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: ownerUser.id } },
    })
    if (ownerMember && ownerMember.role !== 'OWNER') {
      await prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: ownerUser.id } },
        data: { role: 'OWNER' },
      })
    }
  }

  // ── CLIENTS (15) ──
  const clientData = [
    { name: 'NorthStar Ventures', email: 'james@northstarventures.com', phone: '(415) 555-0101', company: 'NorthStar Ventures LLC', status: 'ACTIVE' as const, notes: 'VC firm investing in early-stage SaaS. Our biggest client by revenue.' },
    { name: 'GreenLeaf Health', email: 'diana@greenleafhealth.com', phone: '(212) 555-0202', company: 'GreenLeaf Health Inc.', status: 'ACTIVE' as const, notes: 'Organic wellness brand expanding nationally.' },
    { name: 'NovaTech Solutions', email: 'raj@novatech.io', phone: '(512) 555-0303', company: 'NovaTech Solutions Corp', status: 'ACTIVE' as const, notes: 'B2B SaaS company building analytics dashboard.' },
    { name: 'Horizon Education', email: 'lisa@horizonedu.org', phone: '(617) 555-0505', company: 'Horizon Education Nonprofit', status: 'ACTIVE' as const, notes: 'EdTech nonprofit building LMS for under-resourced schools.' },
    { name: 'Peak Fitness', email: 'marcus@peakfit.com', phone: '(917) 555-0404', company: 'Peak Fitness LLC', status: 'ACTIVE' as const, notes: 'Premium gym chain with 8 locations.' },
    { name: 'Urban Living Co.', email: 'nina@urbanliving.co', phone: '(646) 555-0707', company: 'Urban Living Properties', status: 'ACTIVE' as const, notes: 'Luxury real estate developer.' },
    { name: 'BrightPath Consulting', email: 'tom@brightpathconsult.com', phone: '(312) 555-0606', company: 'BrightPath Consulting Group', status: 'ACTIVE' as const, notes: 'Management consulting firm.' },
    { name: 'Atlas Energy', email: 'maria@atlasenergy.com', phone: '(713) 555-1111', company: 'Atlas Energy Corp', status: 'ACTIVE' as const, notes: 'Renewable energy company.' },
    { name: 'Elevate Commerce', email: 'jake@elevatecommerce.com', phone: '(310) 555-1212', company: 'Elevate Commerce Inc.', status: 'ACTIVE' as const, notes: 'DTC brand accelerator.' },
    { name: 'Summit Legal', email: 'robert@summitlegal.com', phone: '(202) 555-1313', company: 'Summit Legal Partners', status: 'ACTIVE' as const, notes: 'Boutique law firm.' },
    { name: 'SkyBridge Finance', email: 'peter@skybridgefin.com', phone: '(212) 555-0808', company: 'SkyBridge Financial Services', status: 'LEAD' as const, notes: 'Fintech startup.' },
    { name: 'Quantum Logistics', email: 'vikram@quantumlogistics.com', phone: '(305) 555-1010', company: 'Quantum Logistics Inc.', status: 'LEAD' as const, notes: 'Supply chain SaaS startup.' },
    { name: 'BlueWave Systems', email: 'amy@bluewavesystems.com', phone: '(425) 555-1414', company: 'BlueWave Systems LLC', status: 'LEAD' as const, notes: 'Cloud infrastructure startup.' },
    { name: 'NextGen Robotics', email: 'david@nextgenrobotics.com', phone: '(408) 555-1515', company: 'NextGen Robotics Inc.', status: 'LEAD' as const, notes: 'Industrial robotics company.' },
    { name: 'PixelCraft Media', email: 'zoe@pixelcraftmedia.com', phone: '(323) 555-0909', company: 'PixelCraft Media Studio', status: 'INACTIVE' as const, notes: 'Creative agency referral partner.' },
  ]

  const clients = await Promise.all(
    clientData.map((c) => prisma.client.create({
      data: { workspaceId: workspace.id, ...c, createdAt: d(2025, 10, randInt(1, 28)) },
    })),
  )
  const [northstar, greenleaf, novatech, horizon, peak, urban, brightpath, atlas, elevate, summit, skybridge, quantum, bluewave, nextgen, pixelcraft] = clients

  // Client portal users
  const clientPortalEmails = [
    'james@northstarventures.com', 'diana@greenleafhealth.com', 'raj@novatech.io',
    'lisa@horizonedu.org', 'marcus@peakfit.com', 'nina@urbanliving.co',
    'tom@brightpathconsult.com', 'maria@atlasenergy.com', 'jake@elevatecommerce.com',
    'robert@summitlegal.com',
  ]
  const clientPortalNames = [
    'James Wilson', 'Diana Ruiz', 'Raj Patel', 'Lisa Thompson', 'Marcus Johnson',
    'Nina Patel', 'Tom Mitchell', 'Maria Garcia', "Jake O'Brien", 'Robert Davis',
  ]
  const clientPortalIds = [northstar.id, greenleaf.id, novatech.id, horizon.id, peak.id, urban.id, brightpath.id, atlas.id, elevate.id, summit.id]

  const clientPortalUsers = await Promise.all(
    clientPortalEmails.map((email, i) =>
      prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, passwordHash: PASSWORD_HASH, name: clientPortalNames[i], userType: 'CLIENT' },
      })
    ),
  )

  for (let i = 0; i < clientPortalIds.length; i++) {
    const existing = await prisma.clientMember.findUnique({
      where: { clientId_userId: { clientId: clientPortalIds[i], userId: clientPortalUsers[i].id } },
    })
    if (!existing) {
      await prisma.clientMember.create({
        data: { clientId: clientPortalIds[i], userId: clientPortalUsers[i].id, workspaceId: workspace.id, invitedById: sarah.id },
      })
    }
  }

  // ── PROJECTS (30) ──
  const projectInputs = [
    { clientId: northstar.id, name: 'SaaS Dashboard Redesign', hourlyRate: 150, status: 'ACTIVE' as const, startDate: d(2026, 1, 15), dueDate: d(2026, 7, 30), description: 'Complete redesign of the NorthStar Ventures portfolio monitoring dashboard.' },
    { clientId: northstar.id, name: 'Investor CRM Integration', hourlyRate: 140, status: 'ACTIVE' as const, startDate: d(2026, 3, 1), dueDate: d(2026, 8, 15), description: 'Custom CRM module for tracking investor relations and deal flow.' },
    { clientId: northstar.id, name: 'Marketing Website Relaunch', hourlyRate: 130, status: 'COMPLETED' as const, startDate: d(2025, 11, 1), dueDate: d(2026, 2, 28), description: 'Full website redesign with case study showcase and blog engine.' },
    { clientId: northstar.id, name: 'Data API Layer', hourlyRate: 160, status: 'ACTIVE' as const, startDate: d(2026, 4, 1), dueDate: d(2026, 9, 30), description: 'GraphQL API aggregating portfolio company data from multiple sources.' },
    { clientId: greenleaf.id, name: 'E-Commerce Platform', hourlyRate: 120, status: 'ACTIVE' as const, startDate: d(2026, 2, 1), dueDate: d(2026, 8, 31), description: 'Shopify Plus custom storefront with subscription boxes and loyalty program.' },
    { clientId: greenleaf.id, name: 'Mobile App MVP', hourlyRate: 125, status: 'ACTIVE' as const, startDate: d(2026, 4, 15), dueDate: d(2026, 10, 15), description: 'React Native wellness app with product catalog and order tracking.' },
    { clientId: greenleaf.id, name: 'Brand Refresh', hourlyRate: 110, status: 'COMPLETED' as const, startDate: d(2026, 1, 10), dueDate: d(2026, 3, 15), description: 'Complete brand overhaul including logo, packaging, and brand guidelines.' },
    { clientId: novatech.id, name: 'Analytics Dashboard', hourlyRate: 145, status: 'ACTIVE' as const, startDate: d(2026, 3, 1), dueDate: d(2026, 9, 1), description: 'Real-time analytics dashboard with customizable widgets and report builder.' },
    { clientId: novatech.id, name: 'Customer Portal MVP', hourlyRate: 140, status: 'ACTIVE' as const, startDate: d(2026, 5, 1), dueDate: d(2026, 11, 30), description: 'Self-service customer portal with ticket management and knowledge base.' },
    { clientId: novatech.id, name: 'Landing Page Optimization', hourlyRate: 100, status: 'COMPLETED' as const, startDate: d(2026, 2, 1), dueDate: d(2026, 3, 30), description: 'A/B tested landing page redesign with optimized conversion funnel.' },
    { clientId: horizon.id, name: 'Learning Management Platform', hourlyRate: 95, status: 'ACTIVE' as const, startDate: d(2026, 4, 1), dueDate: d(2026, 12, 31), description: 'Open-source-based LMS customized for under-resourced schools.' },
    { clientId: horizon.id, name: 'Donor Portal', hourlyRate: 90, status: 'COMPLETED' as const, startDate: d(2026, 2, 1), dueDate: d(2026, 5, 1), description: 'Donor impact portal showing real-time metrics on student outcomes.' },
    { clientId: peak.id, name: 'Class Booking System', hourlyRate: 115, status: 'ACTIVE' as const, startDate: d(2026, 3, 15), dueDate: d(2026, 7, 15), description: 'Web-based class booking system with waitlist management and Stripe.' },
    { clientId: peak.id, name: 'Member Mobile App', hourlyRate: 125, status: 'ACTIVE' as const, startDate: d(2026, 5, 1), dueDate: d(2026, 10, 30), description: 'Member app with class check-in, workout tracking, and social features.' },
    { clientId: peak.id, name: 'Brand Identity System', hourlyRate: 105, status: 'COMPLETED' as const, startDate: d(2026, 1, 15), dueDate: d(2026, 3, 1), description: 'Logo, color palette, typography system, and brand guidelines.' },
    { clientId: urban.id, name: 'Property Showcase Site', hourlyRate: 130, status: 'ACTIVE' as const, startDate: d(2026, 4, 15), dueDate: d(2026, 8, 1), description: 'Luxury property listing site with virtual tours and inquiry management.' },
    { clientId: urban.id, name: 'Interactive Floor Plans', hourlyRate: 135, status: 'ACTIVE' as const, startDate: d(2026, 6, 1), dueDate: d(2026, 9, 15), description: 'WebGL-based interactive floor plan viewer.' },
    { clientId: brightpath.id, name: 'Corporate Website', hourlyRate: 110, status: 'ACTIVE' as const, startDate: d(2026, 4, 1), dueDate: d(2026, 7, 15), description: 'Professional services website with case studies and blog.' },
    { clientId: brightpath.id, name: 'Client Intake Portal', hourlyRate: 120, status: 'ACTIVE' as const, startDate: d(2026, 5, 15), dueDate: d(2026, 9, 30), description: 'Secure client onboarding portal with document upload and e-signature.' },
    { clientId: atlas.id, name: 'Customer Energy Dashboard', hourlyRate: 135, status: 'ACTIVE' as const, startDate: d(2026, 5, 1), dueDate: d(2026, 10, 1), description: 'Customer-facing energy monitoring dashboard with usage data and insights.' },
    { clientId: atlas.id, name: 'Sustainability Report Site', hourlyRate: 125, status: 'ACTIVE' as const, startDate: d(2026, 6, 1), dueDate: d(2026, 9, 30), description: 'Public-facing annual sustainability report with ESG metrics.' },
    { clientId: elevate.id, name: 'Portfolio Analytics Platform', hourlyRate: 140, status: 'ACTIVE' as const, startDate: d(2026, 4, 1), dueDate: d(2026, 10, 31), description: 'Centralized analytics for tracking performance across portfolio brands.' },
    { clientId: elevate.id, name: 'Shopify Store Optimization', hourlyRate: 115, status: 'COMPLETED' as const, startDate: d(2026, 3, 1), dueDate: d(2026, 5, 15), description: 'Performance audit and optimization for 3 Shopify stores.' },
    { clientId: summit.id, name: 'Law Firm Website Redesign', hourlyRate: 130, status: 'ACTIVE' as const, startDate: d(2026, 5, 1), dueDate: d(2026, 8, 15), description: 'Modern website redesign with practice area pages and attorney profiles.' },
    { clientId: summit.id, name: 'Client Intake & Document Portal', hourlyRate: 135, status: 'ACTIVE' as const, startDate: d(2026, 6, 15), dueDate: d(2026, 11, 30), description: 'Secure client portal with document sharing and e-signature.' },
    { clientId: skybridge.id, name: 'Investor Dashboard MVP', hourlyRate: 145, status: 'ARCHIVED' as const, startDate: d(2026, 6, 1), dueDate: d(2026, 9, 1), description: 'Preliminary investor dashboard. On hold pending funding.' },
    { clientId: quantum.id, name: 'Supply Chain Tracking Portal', hourlyRate: 130, status: 'ARCHIVED' as const, startDate: d(2026, 6, 1), dueDate: d(2026, 8, 15), description: 'Real-time shipment tracking portal. Paused after initial consultation.' },
    { clientId: bluewave.id, name: 'Developer Documentation Portal', hourlyRate: 120, status: 'ARCHIVED' as const, startDate: d(2026, 6, 15), dueDate: d(2026, 9, 30), description: 'Technical documentation site with API reference and SDK guides.' },
    { clientId: nextgen.id, name: 'IoT Monitoring Dashboard', hourlyRate: 150, status: 'ARCHIVED' as const, startDate: d(2026, 7, 1), dueDate: d(2026, 11, 30), description: 'Industrial IoT monitoring dashboard for robotic arm fleet.' },
    { clientId: pixelcraft.id, name: 'Creative Portfolio Website', hourlyRate: 100, status: 'ARCHIVED' as const, startDate: d(2026, 3, 1), dueDate: d(2026, 5, 1), description: 'Creative portfolio site. Paused due to client restructuring.' },
  ]

  const projects: any[] = []
  for (let i = 0; i < projectInputs.length; i += 15) {
    const batch = projectInputs.slice(i, i + 15)
    const results = await Promise.all(
      batch.map((p: any) => prisma.project.create({
        data: { workspaceId: workspace.id, ...p },
      })),
    )
    projects.push(...results)
  }

  // ── TASKS (150) ──
  type TaskTemplate = {
    projectIdx: number; title: string; status: 'TODO' | 'IN_PROGRESS' | 'DONE'
    assigneeIdx?: number; dueDateOffset: number; sortOrder: number
  }

  const taskTemplates: TaskTemplate[] = [
    { projectIdx: 0, title: 'User research and stakeholder interviews', status: 'DONE', assigneeIdx: 1, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 0, title: 'Information architecture and wireframes', status: 'DONE', assigneeIdx: 2, dueDateOffset: 35, sortOrder: 2 },
    { projectIdx: 0, title: 'High-fidelity mockups (Figma)', status: 'IN_PROGRESS', assigneeIdx: 2, dueDateOffset: 55, sortOrder: 3 },
    { projectIdx: 0, title: 'Frontend implementation -- metrics grid', status: 'IN_PROGRESS', assigneeIdx: 3, dueDateOffset: 75, sortOrder: 4 },
    { projectIdx: 0, title: 'Real-time data integration with WebSockets', status: 'TODO', assigneeIdx: 3, dueDateOffset: 100, sortOrder: 5 },
    { projectIdx: 0, title: 'Responsive QA and accessibility audit', status: 'TODO', assigneeIdx: 4, dueDateOffset: 120, sortOrder: 6 },
    { projectIdx: 1, title: 'Database schema for investor profiles', status: 'DONE', assigneeIdx: 3, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 1, title: 'Contact management UI', status: 'DONE', assigneeIdx: 0, dueDateOffset: 30, sortOrder: 2 },
    { projectIdx: 1, title: 'Deal flow pipeline Kanban board', status: 'IN_PROGRESS', assigneeIdx: 3, dueDateOffset: 55, sortOrder: 3 },
    { projectIdx: 1, title: 'Email integration and activity logging', status: 'TODO', assigneeIdx: 1, dueDateOffset: 80, sortOrder: 4 },
    { projectIdx: 1, title: 'Portfolio company performance widgets', status: 'TODO', assigneeIdx: 4, dueDateOffset: 100, sortOrder: 5 },
    { projectIdx: 1, title: 'Reporting dashboard for partner updates', status: 'TODO', assigneeIdx: 0, dueDateOffset: 120, sortOrder: 6 },
    { projectIdx: 2, title: 'Homepage and case study template design', status: 'DONE', assigneeIdx: 2, dueDateOffset: 25, sortOrder: 1 },
    { projectIdx: 2, title: 'Team directory and individual profiles', status: 'DONE', assigneeIdx: 2, dueDateOffset: 40, sortOrder: 2 },
    { projectIdx: 2, title: 'Blog engine with MDX support', status: 'DONE', assigneeIdx: 3, dueDateOffset: 50, sortOrder: 3 },
    { projectIdx: 2, title: 'SEO optimization and launch', status: 'DONE', assigneeIdx: 1, dueDateOffset: 65, sortOrder: 4 },
    { projectIdx: 2, title: 'Load time optimization and image compression', status: 'DONE', assigneeIdx: 4, dueDateOffset: 55, sortOrder: 5 },
    { projectIdx: 3, title: 'GraphQL schema design', status: 'DONE', assigneeIdx: 3, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 3, title: 'Data source connectors (Plaid, Stripe, internal)', status: 'IN_PROGRESS', assigneeIdx: 3, dueDateOffset: 50, sortOrder: 2 },
    { projectIdx: 3, title: 'Real-time sync engine with WebSockets', status: 'TODO', assigneeIdx: 4, dueDateOffset: 80, sortOrder: 3 },
    { projectIdx: 3, title: 'Caching layer with Redis', status: 'TODO', assigneeIdx: 4, dueDateOffset: 105, sortOrder: 4 },
    { projectIdx: 3, title: 'API documentation and SDK generation', status: 'TODO', assigneeIdx: 1, dueDateOffset: 130, sortOrder: 5 },
    { projectIdx: 4, title: 'Shopify Plus store setup and theme customization', status: 'DONE', assigneeIdx: 2, dueDateOffset: 25, sortOrder: 1 },
    { projectIdx: 4, title: 'Subscription box recurring order logic', status: 'IN_PROGRESS', assigneeIdx: 3, dueDateOffset: 55, sortOrder: 2 },
    { projectIdx: 4, title: 'Loyalty points system and referral program', status: 'TODO', assigneeIdx: 0, dueDateOffset: 80, sortOrder: 3 },
    { projectIdx: 4, title: 'Wholesale ordering portal for retailers', status: 'TODO', assigneeIdx: 4, dueDateOffset: 110, sortOrder: 4 },
    { projectIdx: 4, title: 'Inventory sync with warehouse management', status: 'TODO', assigneeIdx: 3, dueDateOffset: 130, sortOrder: 5 },
    { projectIdx: 4, title: 'Payment gateway optimization and multi-currency', status: 'TODO', assigneeIdx: 4, dueDateOffset: 150, sortOrder: 6 },
    { projectIdx: 5, title: 'React Native project setup and navigation', status: 'DONE', assigneeIdx: 3, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 5, title: 'Product catalog and search screens', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 50, sortOrder: 2 },
    { projectIdx: 5, title: 'Order tracking and push notifications', status: 'TODO', assigneeIdx: 0, dueDateOffset: 80, sortOrder: 3 },
    { projectIdx: 5, title: 'Wellness content library with video player', status: 'TODO', assigneeIdx: 2, dueDateOffset: 105, sortOrder: 4 },
    { projectIdx: 5, title: 'App store submission and CI/CD pipeline', status: 'TODO', assigneeIdx: 3, dueDateOffset: 130, sortOrder: 5 },
    { projectIdx: 6, title: 'Mood board and visual direction', status: 'DONE', assigneeIdx: 2, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 6, title: 'Logo design -- 3 concept rounds', status: 'DONE', assigneeIdx: 2, dueDateOffset: 30, sortOrder: 2 },
    { projectIdx: 6, title: 'Brand guidelines documentation', status: 'DONE', assigneeIdx: 1, dueDateOffset: 45, sortOrder: 3 },
    { projectIdx: 6, title: 'Social media and packaging template kit', status: 'DONE', assigneeIdx: 2, dueDateOffset: 55, sortOrder: 4 },
    { projectIdx: 6, title: 'Packaging mockups and physical asset delivery', status: 'DONE', assigneeIdx: 2, dueDateOffset: 58, sortOrder: 5 },
    { projectIdx: 7, title: 'Dashboard widget system architecture', status: 'DONE', assigneeIdx: 0, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 7, title: 'Chart components with Recharts', status: 'IN_PROGRESS', assigneeIdx: 3, dueDateOffset: 45, sortOrder: 2 },
    { projectIdx: 7, title: 'Custom report builder with drag-and-drop', status: 'TODO', assigneeIdx: 4, dueDateOffset: 75, sortOrder: 3 },
    { projectIdx: 7, title: 'CSV/PDF export pipeline', status: 'TODO', assigneeIdx: 3, dueDateOffset: 100, sortOrder: 4 },
    { projectIdx: 7, title: 'Role-based access for dashboard views', status: 'TODO', assigneeIdx: 1, dueDateOffset: 120, sortOrder: 5 },
    { projectIdx: 7, title: 'Performance optimization for large datasets', status: 'TODO', assigneeIdx: 4, dueDateOffset: 140, sortOrder: 6 },
    { projectIdx: 8, title: 'Portal UX wireframes and user flows', status: 'DONE', assigneeIdx: 2, dueDateOffset: 25, sortOrder: 1 },
    { projectIdx: 8, title: 'Authentication and team member management', status: 'IN_PROGRESS', assigneeIdx: 3, dueDateOffset: 55, sortOrder: 2 },
    { projectIdx: 8, title: 'Ticket management system', status: 'TODO', assigneeIdx: 0, dueDateOffset: 85, sortOrder: 3 },
    { projectIdx: 8, title: 'Knowledge base with search', status: 'TODO', assigneeIdx: 4, dueDateOffset: 110, sortOrder: 4 },
    { projectIdx: 8, title: 'Usage analytics and billing overview', status: 'TODO', assigneeIdx: 3, dueDateOffset: 140, sortOrder: 5 },
    { projectIdx: 9, title: 'A/B test variant design', status: 'DONE', assigneeIdx: 2, dueDateOffset: 10, sortOrder: 1 },
    { projectIdx: 9, title: 'Conversion funnel tracking setup', status: 'DONE', assigneeIdx: 3, dueDateOffset: 20, sortOrder: 2 },
    { projectIdx: 9, title: 'Performance and Core Web Vitals optimization', status: 'DONE', assigneeIdx: 4, dueDateOffset: 35, sortOrder: 3 },
    { projectIdx: 9, title: 'Post-launch analysis report', status: 'DONE', assigneeIdx: 1, dueDateOffset: 50, sortOrder: 4 },
    { projectIdx: 9, title: 'Heatmap analysis and UX improvement recommendations', status: 'DONE', assigneeIdx: 0, dueDateOffset: 45, sortOrder: 5 },
    { projectIdx: 10, title: 'LMS requirements gathering and tech selection', status: 'DONE', assigneeIdx: 0, dueDateOffset: 25, sortOrder: 1 },
    { projectIdx: 10, title: 'Course content authoring tool', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 60, sortOrder: 2 },
    { projectIdx: 10, title: 'Offline sync engine for low-connectivity areas', status: 'TODO', assigneeIdx: 3, dueDateOffset: 95, sortOrder: 3 },
    { projectIdx: 10, title: 'Student progress tracking and assessments', status: 'TODO', assigneeIdx: 0, dueDateOffset: 130, sortOrder: 4 },
    { projectIdx: 10, title: 'Teacher dashboard and analytics', status: 'TODO', assigneeIdx: 4, dueDateOffset: 160, sortOrder: 5 },
    { projectIdx: 10, title: 'Mobile-responsive student interface', status: 'TODO', assigneeIdx: 2, dueDateOffset: 180, sortOrder: 6 },
    { projectIdx: 11, title: 'Impact metrics data model', status: 'DONE', assigneeIdx: 3, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 11, title: 'Donor dashboard with real-time metrics', status: 'DONE', assigneeIdx: 0, dueDateOffset: 35, sortOrder: 2 },
    { projectIdx: 11, title: 'Student story showcase component', status: 'DONE', assigneeIdx: 2, dueDateOffset: 50, sortOrder: 3 },
    { projectIdx: 11, title: 'Donation receipt and tax document generation', status: 'DONE', assigneeIdx: 4, dueDateOffset: 65, sortOrder: 4 },
    { projectIdx: 11, title: 'Donor impact report PDF template', status: 'DONE', assigneeIdx: 2, dueDateOffset: 55, sortOrder: 5 },
    { projectIdx: 12, title: 'Class schedule database design', status: 'DONE', assigneeIdx: 3, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 12, title: 'Week calendar view component', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 35, sortOrder: 2 },
    { projectIdx: 12, title: 'Booking flow with waitlist', status: 'IN_PROGRESS', assigneeIdx: 0, dueDateOffset: 55, sortOrder: 3 },
    { projectIdx: 12, title: 'Membership tier management', status: 'TODO', assigneeIdx: 4, dueDateOffset: 75, sortOrder: 4 },
    { projectIdx: 12, title: 'Stripe checkout integration', status: 'TODO', assigneeIdx: 3, dueDateOffset: 95, sortOrder: 5 },
    { projectIdx: 12, title: 'Class reminder email/SMS notifications', status: 'TODO', assigneeIdx: 4, dueDateOffset: 110, sortOrder: 6 },
    { projectIdx: 13, title: 'App architecture and navigation setup', status: 'DONE', assigneeIdx: 3, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 13, title: 'Class check-in with QR code scanning', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 50, sortOrder: 2 },
    { projectIdx: 13, title: 'Workout tracking and history', status: 'TODO', assigneeIdx: 0, dueDateOffset: 80, sortOrder: 3 },
    { projectIdx: 13, title: 'Social features -- challenges and leaderboards', status: 'TODO', assigneeIdx: 2, dueDateOffset: 110, sortOrder: 4 },
    { projectIdx: 13, title: 'Apple Watch companion app', status: 'TODO', assigneeIdx: 3, dueDateOffset: 140, sortOrder: 5 },
    { projectIdx: 14, title: 'Logo exploration and finalization', status: 'DONE', assigneeIdx: 2, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 14, title: 'Typography and color system', status: 'DONE', assigneeIdx: 2, dueDateOffset: 25, sortOrder: 2 },
    { projectIdx: 14, title: 'Brand guidelines PDF', status: 'DONE', assigneeIdx: 1, dueDateOffset: 40, sortOrder: 3 },
    { projectIdx: 14, title: 'Social media template kit expansion', status: 'DONE', assigneeIdx: 2, dueDateOffset: 48, sortOrder: 4 },
    { projectIdx: 15, title: 'Property listing template design', status: 'DONE', assigneeIdx: 2, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 15, title: 'Virtual tour embedding with Matterport', status: 'IN_PROGRESS', assigneeIdx: 2, dueDateOffset: 45, sortOrder: 2 },
    { projectIdx: 15, title: 'Neighborhood guide with map integration', status: 'TODO', assigneeIdx: 4, dueDateOffset: 65, sortOrder: 3 },
    { projectIdx: 15, title: 'Inquiry management CRM integration', status: 'TODO', assigneeIdx: 3, dueDateOffset: 85, sortOrder: 4 },
    { projectIdx: 15, title: 'Mortgage calculator and affordability tools', status: 'TODO', assigneeIdx: 4, dueDateOffset: 100, sortOrder: 5 },
    { projectIdx: 16, title: 'WebGL renderer and 3D model pipeline', status: 'DONE', assigneeIdx: 3, dueDateOffset: 25, sortOrder: 1 },
    { projectIdx: 16, title: 'Unit selection and finish customization UI', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 50, sortOrder: 2 },
    { projectIdx: 16, title: 'Pricing and availability overlay', status: 'TODO', assigneeIdx: 2, dueDateOffset: 75, sortOrder: 3 },
    { projectIdx: 16, title: 'Mobile touch optimization', status: 'TODO', assigneeIdx: 4, dueDateOffset: 100, sortOrder: 4 },
    { projectIdx: 16, title: 'Floor plan data management CMS', status: 'TODO', assigneeIdx: 1, dueDateOffset: 120, sortOrder: 5 },
    { projectIdx: 17, title: 'Design system and component library', status: 'DONE', assigneeIdx: 2, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 17, title: 'Service pages with case study integration', status: 'IN_PROGRESS', assigneeIdx: 2, dueDateOffset: 45, sortOrder: 2 },
    { projectIdx: 17, title: 'Thought leadership blog with CMS', status: 'TODO', assigneeIdx: 4, dueDateOffset: 65, sortOrder: 3 },
    { projectIdx: 17, title: 'Team directory with search and filters', status: 'TODO', assigneeIdx: 3, dueDateOffset: 85, sortOrder: 4 },
    { projectIdx: 17, title: 'Analytics and lead capture optimization', status: 'TODO', assigneeIdx: 4, dueDateOffset: 100, sortOrder: 5 },
    { projectIdx: 18, title: 'Secure document upload with encryption', status: 'DONE', assigneeIdx: 3, dueDateOffset: 25, sortOrder: 1 },
    { projectIdx: 18, title: 'E-signature workflow (DocuSign API)', status: 'IN_PROGRESS', assigneeIdx: 0, dueDateOffset: 50, sortOrder: 2 },
    { projectIdx: 18, title: 'Project brief builder with templates', status: 'TODO', assigneeIdx: 2, dueDateOffset: 75, sortOrder: 3 },
    { projectIdx: 18, title: 'Status tracking and notification system', status: 'TODO', assigneeIdx: 4, dueDateOffset: 100, sortOrder: 4 },
    { projectIdx: 18, title: 'Client onboarding flow and welcome sequence', status: 'TODO', assigneeIdx: 1, dueDateOffset: 120, sortOrder: 5 },
    { projectIdx: 19, title: 'Energy data visualization wireframes', status: 'DONE', assigneeIdx: 2, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 19, title: 'Real-time usage API integration', status: 'IN_PROGRESS', assigneeIdx: 3, dueDateOffset: 45, sortOrder: 2 },
    { projectIdx: 19, title: 'Solar production tracking widget', status: 'TODO', assigneeIdx: 4, dueDateOffset: 70, sortOrder: 3 },
    { projectIdx: 19, title: 'Savings insights and recommendations engine', status: 'TODO', assigneeIdx: 0, dueDateOffset: 95, sortOrder: 4 },
    { projectIdx: 19, title: 'Bill comparison and forecasting', status: 'TODO', assigneeIdx: 3, dueDateOffset: 115, sortOrder: 5 },
    { projectIdx: 20, title: 'Data visualization component library', status: 'DONE', assigneeIdx: 2, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 20, title: 'ESG metric aggregation pipeline', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 35, sortOrder: 2 },
    { projectIdx: 20, title: 'Interactive annual report pages', status: 'TODO', assigneeIdx: 2, dueDateOffset: 55, sortOrder: 3 },
    { projectIdx: 20, title: 'PDF report generation and download', status: 'TODO', assigneeIdx: 3, dueDateOffset: 75, sortOrder: 4 },
    { projectIdx: 21, title: 'Cross-store data unification schema', status: 'DONE', assigneeIdx: 3, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 21, title: 'Performance dashboard with comparative views', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 50, sortOrder: 2 },
    { projectIdx: 21, title: 'Automated reporting and email summaries', status: 'TODO', assigneeIdx: 0, dueDateOffset: 80, sortOrder: 3 },
    { projectIdx: 21, title: 'Inventory health monitoring alerts', status: 'TODO', assigneeIdx: 3, dueDateOffset: 105, sortOrder: 4 },
    { projectIdx: 21, title: 'Marketing channel attribution model', status: 'TODO', assigneeIdx: 4, dueDateOffset: 130, sortOrder: 5 },
    { projectIdx: 22, title: 'Store performance audit and benchmarking', status: 'DONE', assigneeIdx: 4, dueDateOffset: 10, sortOrder: 1 },
    { projectIdx: 22, title: 'Theme optimization and Core Web Vitals', status: 'DONE', assigneeIdx: 3, dueDateOffset: 20, sortOrder: 2 },
    { projectIdx: 22, title: 'Conversion funnel analysis and checkout improvements', status: 'DONE', assigneeIdx: 0, dueDateOffset: 35, sortOrder: 3 },
    { projectIdx: 22, title: 'A/B test framework implementation', status: 'DONE', assigneeIdx: 4, dueDateOffset: 50, sortOrder: 4 },
    { projectIdx: 23, title: 'Practice area page templates', status: 'DONE', assigneeIdx: 2, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 23, title: 'Attorney profile pages with search', status: 'IN_PROGRESS', assigneeIdx: 2, dueDateOffset: 40, sortOrder: 2 },
    { projectIdx: 23, title: 'Legal blog with category taxonomy', status: 'TODO', assigneeIdx: 4, dueDateOffset: 60, sortOrder: 3 },
    { projectIdx: 23, title: 'Contact and consultation request forms', status: 'TODO', assigneeIdx: 4, dueDateOffset: 80, sortOrder: 4 },
    { projectIdx: 23, title: 'Dark mode and accessibility compliance', status: 'TODO', assigneeIdx: 2, dueDateOffset: 95, sortOrder: 5 },
    { projectIdx: 24, title: 'Document management system architecture', status: 'DONE', assigneeIdx: 3, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 24, title: 'Secure file upload with encryption at rest', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 45, sortOrder: 2 },
    { projectIdx: 24, title: 'E-signature workflow (DocuSign API)', status: 'TODO', assigneeIdx: 0, dueDateOffset: 70, sortOrder: 3 },
    { projectIdx: 24, title: 'Case status tracking timeline component', status: 'TODO', assigneeIdx: 4, dueDateOffset: 95, sortOrder: 4 },
    { projectIdx: 24, title: 'Client billing overview and invoice history', status: 'TODO', assigneeIdx: 3, dueDateOffset: 115, sortOrder: 5 },
    { projectIdx: 25, title: 'Initial market research and requirements doc', status: 'DONE', assigneeIdx: 1, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 25, title: 'Wireframes and user flow diagrams', status: 'DONE', assigneeIdx: 2, dueDateOffset: 30, sortOrder: 2 },
    { projectIdx: 25, title: 'Risk metrics data model design', status: 'DONE', assigneeIdx: 3, dueDateOffset: 22, sortOrder: 3 },
    { projectIdx: 25, title: 'Portfolio performance prototype API', status: 'DONE', assigneeIdx: 0, dueDateOffset: 35, sortOrder: 4 },
    { projectIdx: 26, title: 'Discovery sessions and requirements gathering', status: 'DONE', assigneeIdx: 1, dueDateOffset: 10, sortOrder: 1 },
    { projectIdx: 26, title: 'Technical feasibility assessment', status: 'DONE', assigneeIdx: 0, dueDateOffset: 20, sortOrder: 2 },
    { projectIdx: 26, title: 'Shipment tracking data models', status: 'DONE', assigneeIdx: 3, dueDateOffset: 18, sortOrder: 3 },
    { projectIdx: 26, title: 'API vendor research and comparison matrix', status: 'DONE', assigneeIdx: 1, dueDateOffset: 28, sortOrder: 4 },
    { projectIdx: 27, title: 'Documentation platform evaluation and selection', status: 'DONE', assigneeIdx: 1, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 27, title: 'Information architecture and content outline', status: 'DONE', assigneeIdx: 2, dueDateOffset: 35, sortOrder: 2 },
    { projectIdx: 27, title: 'API reference page template design', status: 'DONE', assigneeIdx: 2, dueDateOffset: 28, sortOrder: 3 },
    { projectIdx: 27, title: 'Interactive code example playground', status: 'DONE', assigneeIdx: 3, dueDateOffset: 38, sortOrder: 4 },
    { projectIdx: 28, title: 'IoT protocol research and data pipeline design', status: 'DONE', assigneeIdx: 3, dueDateOffset: 25, sortOrder: 1 },
    { projectIdx: 28, title: 'Dashboard wireframes and KPI definition', status: 'DONE', assigneeIdx: 2, dueDateOffset: 40, sortOrder: 2 },
    { projectIdx: 28, title: 'IoT sensor data format analysis', status: 'DONE', assigneeIdx: 3, dueDateOffset: 15, sortOrder: 3 },
    { projectIdx: 28, title: 'Dashboard wireframes and KPI selection', status: 'DONE', assigneeIdx: 2, dueDateOffset: 30, sortOrder: 4 },
    { projectIdx: 28, title: 'Real-time data pipeline assessment', status: 'DONE', assigneeIdx: 1, dueDateOffset: 42, sortOrder: 5 },
    { projectIdx: 29, title: 'Homepage and project grid layout', status: 'DONE', assigneeIdx: 2, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 29, title: 'Project detail page template', status: 'DONE', assigneeIdx: 2, dueDateOffset: 25, sortOrder: 2 },
    { projectIdx: 29, title: 'About and contact pages', status: 'DONE', assigneeIdx: 0, dueDateOffset: 35, sortOrder: 3 },
    { projectIdx: 29, title: 'Responsive QA and cross-browser testing', status: 'DONE', assigneeIdx: 4, dueDateOffset: 42, sortOrder: 4 },
    { projectIdx: 29, title: 'SEO audit and metadata optimization', status: 'DONE', assigneeIdx: 1, dueDateOffset: 48, sortOrder: 5 },
    { projectIdx: 29, title: 'Visual mood board and design direction', status: 'DONE', assigneeIdx: 2, dueDateOffset: 12, sortOrder: 6 },
    { projectIdx: 29, title: 'Homepage hero and project grid design', status: 'DONE', assigneeIdx: 2, dueDateOffset: 22, sortOrder: 7 },
    { projectIdx: 29, title: 'Project detail page with image lightbox', status: 'DONE', assigneeIdx: 0, dueDateOffset: 32, sortOrder: 8 },
    { projectIdx: 29, title: 'Contact form with file upload', status: 'DONE', assigneeIdx: 4, dueDateOffset: 40, sortOrder: 9 },
  ]

  const tasks: any[] = []
  for (let i = 0; i < taskTemplates.length; i += 25) {
    const batch = taskTemplates.slice(i, i + 25)
    const results = await Promise.all(
      batch.map((t) => {
        const project = projects[t.projectIdx]
        const assignee = t.assigneeIdx !== undefined ? team[t.assigneeIdx] : null
        const startDate = project.startDate ?? new Date()
        const dueDate = new Date(startDate)
        dueDate.setDate(dueDate.getDate() + t.dueDateOffset)
        return prisma.task.create({
          data: {
            projectId: project.id,
            assigneeId: assignee?.id ?? null,
            title: t.title,
            status: t.status,
            dueDate,
            sortOrder: t.sortOrder,
          },
        })
      }),
    )
    tasks.push(...results)
  }

  // Build task lookup by project index
  const tasksByProject: Record<number, typeof tasks> = {}
  let ti = 0
  for (const t of taskTemplates) {
    if (!tasksByProject[t.projectIdx]) tasksByProject[t.projectIdx] = []
    tasksByProject[t.projectIdx].push(tasks[ti])
    ti++
  }

  // ── TIME ENTRIES (100) ──
  type TimeInput = {
    userId: string; projectIdx: number; taskIdx: number
    day: number; month: number; startHour: number; durationHrs: number
    description: string; status: string
  }

  const timeEntryInputs: TimeInput[] = [
    { userId: michael.id, projectIdx: 0, taskIdx: 3, day: 2, month: 6, startHour: 9, durationHrs: 4, description: 'Building metrics grid layout with responsive CSS Grid', status: 'APPROVED' },
    { userId: michael.id, projectIdx: 0, taskIdx: 2, day: 3, month: 6, startHour: 9, durationHrs: 3.5, description: 'Reusable chart component integration with Recharts', status: 'APPROVED' },
    { userId: michael.id, projectIdx: 1, taskIdx: 2, day: 4, month: 6, startHour: 13, durationHrs: 3, description: 'Kanban board drag-and-drop with dnd-kit', status: 'APPROVED' },
    { userId: michael.id, projectIdx: 1, taskIdx: 2, day: 5, month: 6, startHour: 9, durationHrs: 5, description: 'Deal pipeline state machine and column transitions', status: 'APPROVED' },
    { userId: michael.id, projectIdx: 3, taskIdx: 0, day: 6, month: 6, startHour: 9, durationHrs: 4, description: 'GraphQL schema design and resolver implementation', status: 'APPROVED' },
    { userId: michael.id, projectIdx: 3, taskIdx: 1, day: 8, month: 6, startHour: 9, durationHrs: 6, description: 'Plaid API integration for portfolio account aggregation', status: 'APPROVED' },
    { userId: michael.id, projectIdx: 7, taskIdx: 1, day: 9, month: 6, startHour: 9, durationHrs: 3, description: 'LineChart, BarChart, and PieChart wrapper components', status: 'APPROVED' },
    { userId: michael.id, projectIdx: 7, taskIdx: 1, day: 10, month: 6, startHour: 13, durationHrs: 2.5, description: 'Recharts responsive container and theme integration', status: 'APPROVED' },
    { userId: michael.id, projectIdx: 10, taskIdx: 1, day: 11, month: 6, startHour: 9, durationHrs: 4, description: 'Week calendar grid with time slot rendering', status: 'APPROVED' },
    { userId: michael.id, projectIdx: 10, taskIdx: 1, day: 12, month: 6, startHour: 9, durationHrs: 5.5, description: 'Class type filtering and instructor schedule overlay', status: 'APPROVED' },
    { userId: michael.id, projectIdx: 4, taskIdx: 1, day: 15, month: 6, startHour: 9, durationHrs: 3, description: 'Subscription box recurring order logic with Shopify API', status: 'APPROVED' },
    { userId: michael.id, projectIdx: 13, taskIdx: 1, day: 16, month: 6, startHour: 9, durationHrs: 4, description: 'Course content editor with rich text and media embedding', status: 'APPROVED' },
    { userId: michael.id, projectIdx: 5, taskIdx: 0, day: 17, month: 6, startHour: 13, durationHrs: 2, description: 'React Native navigation stack and auth flow setup', status: 'SUBMITTED' },
    { userId: michael.id, projectIdx: 0, taskIdx: 3, day: 18, month: 6, startHour: 9, durationHrs: 3.5, description: 'Adding loading skeletons and error states to dashboard', status: 'SUBMITTED' },
    { userId: michael.id, projectIdx: 22, taskIdx: 0, day: 19, month: 6, startHour: 9, durationHrs: 5, description: 'Document management system database schema', status: 'SUBMITTED' },
    { userId: michael.id, projectIdx: 17, taskIdx: 1, day: 22, month: 6, startHour: 9, durationHrs: 3, description: 'Real-time energy usage API integration and caching', status: 'DRAFT' },
    { userId: michael.id, projectIdx: 17, taskIdx: 1, day: 23, month: 6, startHour: 13, durationHrs: 4, description: 'WebSocket connection for live meter data', status: 'DRAFT' },
    { userId: michael.id, projectIdx: 19, taskIdx: 0, day: 24, month: 6, startHour: 9, durationHrs: 3, description: 'Cross-store data unification and ETL pipeline', status: 'DRAFT' },
    { userId: michael.id, projectIdx: 11, taskIdx: 1, day: 25, month: 6, startHour: 9, durationHrs: 3, description: 'QR code scanner integration with expo-camera', status: 'DRAFT' },
    { userId: michael.id, projectIdx: 4, taskIdx: 5, day: 26, month: 6, startHour: 9, durationHrs: 4, description: 'Multi-currency price formatting and payment gateway config', status: 'DRAFT' },
    { userId: emma.id, projectIdx: 0, taskIdx: 1, day: 1, month: 6, startHour: 10, durationHrs: 3, description: 'Dashboard wireframes layout exploration and client feedback', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 0, taskIdx: 2, day: 2, month: 6, startHour: 9, durationHrs: 6, description: 'High-fidelity mockups in Figma metrics grid and charts', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 4, taskIdx: 0, day: 3, month: 6, startHour: 9, durationHrs: 4, description: 'Shopify storefront theme customization and component styling', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 5, taskIdx: 1, day: 4, month: 6, startHour: 13, durationHrs: 3.5, description: 'Mobile app product catalog screen and search designs', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 8, taskIdx: 0, day: 5, month: 6, startHour: 9, durationHrs: 5, description: 'Customer portal UX wireframes and user flow diagrams', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 12, taskIdx: 0, day: 8, month: 6, startHour: 9, durationHrs: 3, description: 'Peak Fitness logo refinement color variations and lockups', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 12, taskIdx: 1, day: 9, month: 6, startHour: 10, durationHrs: 4, description: 'Typography scale and color palette documentation', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 15, taskIdx: 0, day: 10, month: 6, startHour: 9, durationHrs: 5, description: 'Corporate website component library in Figma', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 15, taskIdx: 1, day: 11, month: 6, startHour: 13, durationHrs: 3, description: 'Service page layouts with case study integration points', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 21, taskIdx: 0, day: 12, month: 6, startHour: 9, durationHrs: 4, description: 'Practice area page template designs for law firm site', status: 'SUBMITTED' },
    { userId: emma.id, projectIdx: 6, taskIdx: 3, day: 15, month: 6, startHour: 9, durationHrs: 2, description: 'Social media template kit Canva template creation', status: 'SUBMITTED' },
    { userId: emma.id, projectIdx: 6, taskIdx: 2, day: 16, month: 6, startHour: 10, durationHrs: 3, description: 'Brand guidelines document layout and visual design', status: 'SUBMITTED' },
    { userId: emma.id, projectIdx: 14, taskIdx: 0, day: 17, month: 6, startHour: 9, durationHrs: 3, description: 'Donor portal dashboard visual design and impact metric cards', status: 'SUBMITTED' },
    { userId: emma.id, projectIdx: 11, taskIdx: 3, day: 18, month: 6, startHour: 13, durationHrs: 2.5, description: 'Social features challenge and leaderboard UI designs', status: 'DRAFT' },
    { userId: emma.id, projectIdx: 17, taskIdx: 0, day: 19, month: 6, startHour: 9, durationHrs: 4, description: 'Energy dashboard wireframes and data visualization mockups', status: 'SUBMITTED' },
    { userId: emma.id, projectIdx: 18, taskIdx: 0, day: 22, month: 6, startHour: 10, durationHrs: 3, description: 'ESG data visualization component library in Figma', status: 'SUBMITTED' },
    { userId: emma.id, projectIdx: 19, taskIdx: 1, day: 23, month: 6, startHour: 9, durationHrs: 4, description: 'Portfolio analytics dashboard comparative views design', status: 'DRAFT' },
    { userId: emma.id, projectIdx: 21, taskIdx: 1, day: 24, month: 6, startHour: 13, durationHrs: 3, description: 'Attorney profile page design with search and filtering', status: 'DRAFT' },
    { userId: emma.id, projectIdx: 22, taskIdx: 2, day: 25, month: 6, startHour: 9, durationHrs: 2, description: 'Case status tracking timeline visual design', status: 'DRAFT' },
    { userId: emma.id, projectIdx: 16, taskIdx: 2, day: 26, month: 6, startHour: 9, durationHrs: 3, description: 'Project brief builder UI design with conditional form sections', status: 'DRAFT' },
    { userId: sophia.id, projectIdx: 3, taskIdx: 2, day: 2, month: 6, startHour: 9, durationHrs: 4, description: 'WebSocket real-time sync client implementation', status: 'APPROVED' },
    { userId: sophia.id, projectIdx: 3, taskIdx: 3, day: 3, month: 6, startHour: 9, durationHrs: 3, description: 'Redis caching layer configuration and integration', status: 'APPROVED' },
    { userId: sophia.id, projectIdx: 0, taskIdx: 4, day: 4, month: 6, startHour: 13, durationHrs: 3.5, description: 'WebSocket data binding for live dashboard updates', status: 'APPROVED' },
    { userId: sophia.id, projectIdx: 4, taskIdx: 3, day: 5, month: 6, startHour: 9, durationHrs: 4, description: 'Wholesale ordering portal frontend with React', status: 'APPROVED' },
    { userId: sophia.id, projectIdx: 5, taskIdx: 1, day: 6, month: 6, startHour: 9, durationHrs: 5, description: 'Search screen with Algolia integration for product catalog', status: 'APPROVED' },
    { userId: sophia.id, projectIdx: 7, taskIdx: 2, day: 8, month: 6, startHour: 9, durationHrs: 3, description: 'Drag-and-drop report builder UI shell', status: 'APPROVED' },
    { userId: sophia.id, projectIdx: 8, taskIdx: 3, day: 9, month: 6, startHour: 9, durationHrs: 4, description: 'Knowledge base search with Fuse.js client-side filtering', status: 'APPROVED' },
    { userId: sophia.id, projectIdx: 8, taskIdx: 1, day: 10, month: 6, startHour: 13, durationHrs: 3, description: 'Authentication flow for customer portal', status: 'SUBMITTED' },
    { userId: sophia.id, projectIdx: 10, taskIdx: 3, day: 11, month: 6, startHour: 9, durationHrs: 3.5, description: 'Membership tier management UI with plan comparison', status: 'SUBMITTED' },
    { userId: sophia.id, projectIdx: 10, taskIdx: 5, day: 12, month: 6, startHour: 9, durationHrs: 2, description: 'Class reminder email template and notification preferences', status: 'SUBMITTED' },
    { userId: sophia.id, projectIdx: 11, taskIdx: 1, day: 15, month: 6, startHour: 9, durationHrs: 4, description: 'QR code scanner screen with camera permissions handling', status: 'SUBMITTED' },
    { userId: sophia.id, projectIdx: 13, taskIdx: 1, day: 16, month: 6, startHour: 9, durationHrs: 4, description: 'Rich text editor integration for course authoring', status: 'DRAFT' },
    { userId: sophia.id, projectIdx: 15, taskIdx: 2, day: 17, month: 6, startHour: 13, durationHrs: 3, description: 'Blog CMS with MDX support and category management', status: 'DRAFT' },
    { userId: sophia.id, projectIdx: 15, taskIdx: 4, day: 18, month: 6, startHour: 9, durationHrs: 2.5, description: 'Lead capture forms with validation and analytics tracking', status: 'DRAFT' },
    { userId: sophia.id, projectIdx: 16, taskIdx: 3, day: 19, month: 6, startHour: 9, durationHrs: 3, description: 'Status tracking notification system with real-time updates', status: 'DRAFT' },
    { userId: sophia.id, projectIdx: 18, taskIdx: 1, day: 22, month: 6, startHour: 9, durationHrs: 4, description: 'ESG metric data aggregation and chart rendering pipeline', status: 'DRAFT' },
    { userId: sophia.id, projectIdx: 19, taskIdx: 1, day: 23, month: 6, startHour: 13, durationHrs: 3, description: 'Comparative dashboard with store-by-store metrics', status: 'DRAFT' },
    { userId: sophia.id, projectIdx: 21, taskIdx: 2, day: 24, month: 6, startHour: 9, durationHrs: 3, description: 'Legal blog with category taxonomy and tag cloud', status: 'DRAFT' },
    { userId: sophia.id, projectIdx: 22, taskIdx: 1, day: 25, month: 6, startHour: 9, durationHrs: 4, description: 'Secure file upload component with progress indicators', status: 'DRAFT' },
    { userId: sophia.id, projectIdx: 20, taskIdx: 3, day: 26, month: 6, startHour: 10, durationHrs: 2, description: 'A/B test framework implementation with split.io', status: 'SUBMITTED' },
    { userId: sarah.id, projectIdx: 1, taskIdx: 1, day: 2, month: 6, startHour: 9, durationHrs: 2.5, description: 'Contact management CRUD backend API and Prisma schema', status: 'APPROVED' },
    { userId: sarah.id, projectIdx: 3, taskIdx: 0, day: 3, month: 6, startHour: 9, durationHrs: 3, description: 'GraphQL schema review and architecture decisions', status: 'APPROVED' },
    { userId: sarah.id, projectIdx: 4, taskIdx: 2, day: 4, month: 6, startHour: 13, durationHrs: 2, description: 'Loyalty points system technical design document', status: 'APPROVED' },
    { userId: sarah.id, projectIdx: 7, taskIdx: 0, day: 5, month: 6, startHour: 9, durationHrs: 4, description: 'Dashboard widget system architecture and component design', status: 'APPROVED' },
    { userId: sarah.id, projectIdx: 7, taskIdx: 4, day: 8, month: 6, startHour: 9, durationHrs: 3, description: 'Role-based access control system for dashboard views', status: 'APPROVED' },
    { userId: sarah.id, projectIdx: 10, taskIdx: 2, day: 9, month: 6, startHour: 10, durationHrs: 2.5, description: 'Booking flow state machine and waitlist algorithm design', status: 'APPROVED' },
    { userId: sarah.id, projectIdx: 13, taskIdx: 0, day: 10, month: 6, startHour: 9, durationHrs: 3, description: 'LMS requirements documentation and tech stack evaluation', status: 'APPROVED' },
    { userId: sarah.id, projectIdx: 16, taskIdx: 1, day: 11, month: 6, startHour: 9, durationHrs: 4, description: 'E-signature workflow DocuSign API integration', status: 'SUBMITTED' },
    { userId: sarah.id, projectIdx: 8, taskIdx: 2, day: 12, month: 6, startHour: 13, durationHrs: 3, description: 'Ticket management system database schema and API design', status: 'SUBMITTED' },
    { userId: sarah.id, projectIdx: 5, taskIdx: 2, day: 15, month: 6, startHour: 9, durationHrs: 2, description: 'Push notification architecture for order tracking updates', status: 'SUBMITTED' },
    { userId: sarah.id, projectIdx: 11, taskIdx: 2, day: 16, month: 6, startHour: 9, durationHrs: 3.5, description: 'Workout tracking data model and API endpoints', status: 'SUBMITTED' },
    { userId: sarah.id, projectIdx: 16, taskIdx: 3, day: 17, month: 6, startHour: 10, durationHrs: 2, description: 'Notification system architecture for client portal', status: 'DRAFT' },
    { userId: sarah.id, projectIdx: 22, taskIdx: 2, day: 18, month: 6, startHour: 9, durationHrs: 3, description: 'DocuSign API integration for legal document signing', status: 'DRAFT' },
    { userId: sarah.id, projectIdx: 0, taskIdx: 5, day: 19, month: 6, startHour: 9, durationHrs: 2, description: 'Accessibility audit WCAG 2.1 compliance review', status: 'DRAFT' },
    { userId: sarah.id, projectIdx: 17, taskIdx: 3, day: 22, month: 6, startHour: 9, durationHrs: 3, description: 'Savings insights engine algorithm design and data model', status: 'DRAFT' },
    { userId: sarah.id, projectIdx: 19, taskIdx: 2, day: 23, month: 6, startHour: 10, durationHrs: 2, description: 'Automated reporting architecture and email template design', status: 'DRAFT' },
    { userId: sarah.id, projectIdx: 21, taskIdx: 4, day: 24, month: 6, startHour: 9, durationHrs: 2, description: 'Dark mode and accessibility compliance review', status: 'DRAFT' },
    { userId: sarah.id, projectIdx: 14, taskIdx: 1, day: 25, month: 6, startHour: 13, durationHrs: 1.5, description: 'Donor dashboard metrics review and stakeholder feedback session', status: 'SUBMITTED' },
    { userId: sarah.id, projectIdx: 20, taskIdx: 2, day: 25, month: 6, startHour: 9, durationHrs: 2, description: 'Conversion funnel analysis review with Elevate Commerce team', status: 'SUBMITTED' },
    { userId: sarah.id, projectIdx: 14, taskIdx: 2, day: 26, month: 6, startHour: 10, durationHrs: 1.5, description: 'Student story showcase content review and feedback', status: 'APPROVED' },
    { userId: alex.id, projectIdx: 0, taskIdx: 0, day: 1, month: 6, startHour: 10, durationHrs: 1.5, description: 'Stakeholder interview synthesis and requirements document', status: 'APPROVED' },
    { userId: alex.id, projectIdx: 3, taskIdx: 4, day: 2, month: 6, startHour: 14, durationHrs: 1, description: 'API documentation review and developer experience feedback', status: 'APPROVED' },
    { userId: alex.id, projectIdx: 7, taskIdx: 4, day: 3, month: 6, startHour: 11, durationHrs: 1.5, description: 'Role-based access requirements gathering with NovaTech team', status: 'APPROVED' },
    { userId: alex.id, projectIdx: 10, taskIdx: 3, day: 4, month: 6, startHour: 13, durationHrs: 1, description: 'Membership tier pricing review with Peak Fitness stakeholders', status: 'APPROVED' },
    { userId: alex.id, projectIdx: 4, taskIdx: 3, day: 5, month: 6, startHour: 10, durationHrs: 2, description: 'Wholesale portal requirements with GreenLeaf operations team', status: 'APPROVED' },
    { userId: alex.id, projectIdx: 13, taskIdx: 4, day: 8, month: 6, startHour: 14, durationHrs: 1, description: 'Teacher dashboard feature prioritization session', status: 'SUBMITTED' },
    { userId: alex.id, projectIdx: 15, taskIdx: 4, day: 9, month: 6, startHour: 9, durationHrs: 2.5, description: 'Lead capture CRM integration research and vendor evaluation', status: 'SUBMITTED' },
    { userId: alex.id, projectIdx: 21, taskIdx: 3, day: 10, month: 6, startHour: 10, durationHrs: 1, description: 'Contact form review and consultation flow design with Summit Legal', status: 'SUBMITTED' },
    { userId: alex.id, projectIdx: 1, taskIdx: 5, day: 11, month: 6, startHour: 14, durationHrs: 1.5, description: 'Partner update report template feedback session', status: 'SUBMITTED' },
    { userId: alex.id, projectIdx: 8, taskIdx: 4, day: 12, month: 6, startHour: 11, durationHrs: 1, description: 'Usage analytics feature review with NovaTech product team', status: 'DRAFT' },
    { userId: alex.id, projectIdx: 17, taskIdx: 2, day: 15, month: 6, startHour: 10, durationHrs: 1, description: 'Solar tracking feature scope review with Atlas Energy', status: 'SUBMITTED' },
    { userId: alex.id, projectIdx: 19, taskIdx: 4, day: 16, month: 6, startHour: 14, durationHrs: 1.5, description: 'Marketing channel attribution model requirements session', status: 'SUBMITTED' },
    { userId: alex.id, projectIdx: 16, taskIdx: 4, day: 17, month: 6, startHour: 9, durationHrs: 2, description: 'Client onboarding flow mapping with BrightPath team', status: 'DRAFT' },
    { userId: alex.id, projectIdx: 22, taskIdx: 4, day: 18, month: 6, startHour: 10, durationHrs: 1, description: 'Billing overview feature spec review with Summit Legal', status: 'DRAFT' },
    { userId: alex.id, projectIdx: 18, taskIdx: 2, day: 19, month: 6, startHour: 14, durationHrs: 1, description: 'Interactive report page content review with Atlas marketing', status: 'DRAFT' },
    { userId: alex.id, projectIdx: 9, taskIdx: 3, day: 22, month: 6, startHour: 11, durationHrs: 1, description: 'Q2 landing page performance review and Q3 planning', status: 'DRAFT' },
    { userId: alex.id, projectIdx: 5, taskIdx: 4, day: 23, month: 6, startHour: 14, durationHrs: 0.5, description: 'App store submission checklist review', status: 'DRAFT' },
    { userId: alex.id, projectIdx: 2, taskIdx: 0, day: 24, month: 6, startHour: 9, durationHrs: 1.5, description: 'Q1 marketing website performance retrospective', status: 'APPROVED' },
    { userId: alex.id, projectIdx: 6, taskIdx: 2, day: 25, month: 6, startHour: 10, durationHrs: 1, description: 'Brand guidelines final approval with GreenLeaf team', status: 'APPROVED' },
    { userId: alex.id, projectIdx: 14, taskIdx: 2, day: 26, month: 6, startHour: 11, durationHrs: 1, description: 'Donation receipt system QA sign-off and deployment', status: 'APPROVED' },
  ]

  const timeEntries: any[] = []
  for (let i = 0; i < timeEntryInputs.length; i += 25) {
    const batch = timeEntryInputs.slice(i, i + 25)
    const results = await Promise.all(
      batch.map((t) => {
        const project = projects[t.projectIdx]
        const taskArr = tasksByProject[t.projectIdx]
        const task = taskArr && taskArr.length > t.taskIdx ? taskArr[t.taskIdx] : null
        const start = d(2026, t.month, t.day, t.startHour)
        const endH = t.startHour + Math.floor(t.durationHrs)
        const endM = Math.round((t.durationHrs % 1) * 60)
        const end = d(2026, t.month, t.day, endH, endM)
        const isApproved = t.status === 'APPROVED'
        return prisma.timeEntry.create({
          data: {
            workspaceId: workspace.id,
            userId: t.userId,
            projectId: project.id,
            taskId: task?.id ?? null,
            description: t.description,
            startTime: start,
            endTime: end,
            durationMinutes: Math.round(t.durationHrs * 60),
            status: t.status as any,
            approvedById: isApproved ? alex.id : null,
            approvedAt: isApproved ? d(2026, t.month, t.day + 2, 14) : null,
          },
        })
      }),
    )
    timeEntries.push(...results)
  }

  // ── INVOICES (40) ──
  type InvoiceInput = {
    clientIdx: number; projectIdx: number; status: string
    day: number; month: number; amount: number; paidDay?: number
  }

  const invoiceInputs: InvoiceInput[] = [
    { clientIdx: 0, projectIdx: 0, status: 'PAID', day: 1, month: 6, amount: 12000, paidDay: 5 },
    { clientIdx: 0, projectIdx: 0, status: 'PAID', day: 1, month: 7, amount: 12000, paidDay: 4 },
    { clientIdx: 0, projectIdx: 0, status: 'PAID', day: 1, month: 8, amount: 12000, paidDay: 6 },
    { clientIdx: 0, projectIdx: 0, status: 'SENT', day: 1, month: 9, amount: 12000 },
    { clientIdx: 1, projectIdx: 1, status: 'PAID', day: 3, month: 6, amount: 8000, paidDay: 8 },
    { clientIdx: 1, projectIdx: 1, status: 'PAID', day: 3, month: 7, amount: 8000, paidDay: 7 },
    { clientIdx: 1, projectIdx: 1, status: 'PAID', day: 3, month: 8, amount: 8000, paidDay: 10 },
    { clientIdx: 1, projectIdx: 1, status: 'SENT', day: 3, month: 9, amount: 8000 },
    { clientIdx: 2, projectIdx: 2, status: 'PAID', day: 5, month: 6, amount: 5000, paidDay: 12 },
    { clientIdx: 2, projectIdx: 2, status: 'PAID', day: 5, month: 7, amount: 5000, paidDay: 11 },
    { clientIdx: 2, projectIdx: 2, status: 'PAID', day: 5, month: 8, amount: 5000, paidDay: 14 },
    { clientIdx: 3, projectIdx: 3, status: 'PAID', day: 7, month: 6, amount: 15000, paidDay: 15 },
    { clientIdx: 3, projectIdx: 3, status: 'PAID', day: 7, month: 7, amount: 15000, paidDay: 14 },
    { clientIdx: 3, projectIdx: 3, status: 'SENT', day: 7, month: 8, amount: 15000 },
    { clientIdx: 4, projectIdx: 4, status: 'PAID', day: 10, month: 6, amount: 9500, paidDay: 18 },
    { clientIdx: 4, projectIdx: 4, status: 'PAID', day: 10, month: 7, amount: 9500, paidDay: 17 },
    { clientIdx: 4, projectIdx: 5, status: 'PAID', day: 10, month: 8, amount: 7000, paidDay: 20 },
    { clientIdx: 4, projectIdx: 5, status: 'SENT', day: 10, month: 9, amount: 7000 },
    { clientIdx: 5, projectIdx: 6, status: 'PAID', day: 12, month: 6, amount: 3500, paidDay: 16 },
    { clientIdx: 5, projectIdx: 6, status: 'PAID', day: 12, month: 7, amount: 3500, paidDay: 15 },
    { clientIdx: 5, projectIdx: 6, status: 'OVERDUE', day: 12, month: 8, amount: 3500 },
    { clientIdx: 6, projectIdx: 7, status: 'PAID', day: 14, month: 6, amount: 11000, paidDay: 20 },
    { clientIdx: 6, projectIdx: 7, status: 'PAID', day: 14, month: 7, amount: 11000, paidDay: 22 },
    { clientIdx: 6, projectIdx: 8, status: 'PAID', day: 14, month: 8, amount: 9000, paidDay: 25 },
    { clientIdx: 6, projectIdx: 8, status: 'SENT', day: 14, month: 9, amount: 9000 },
    { clientIdx: 7, projectIdx: 9, status: 'PAID', day: 17, month: 6, amount: 4500, paidDay: 22 },
    { clientIdx: 7, projectIdx: 9, status: 'PAID', day: 17, month: 7, amount: 4500, paidDay: 21 },
    { clientIdx: 8, projectIdx: 10, status: 'PAID', day: 19, month: 6, amount: 10500, paidDay: 26 },
    { clientIdx: 8, projectIdx: 10, status: 'PAID', day: 19, month: 7, amount: 10500, paidDay: 28 },
    { clientIdx: 8, projectIdx: 11, status: 'SENT', day: 19, month: 8, amount: 6000 },
    { clientIdx: 9, projectIdx: 12, status: 'PAID', day: 21, month: 6, amount: 7500, paidDay: 28 },
    { clientIdx: 9, projectIdx: 12, status: 'PAID', day: 21, month: 7, amount: 7500, paidDay: 27 },
    { clientIdx: 9, projectIdx: 12, status: 'OVERDUE', day: 21, month: 8, amount: 7500 },
    { clientIdx: 10, projectIdx: 13, status: 'PAID', day: 23, month: 6, amount: 13000, paidDay: 30 },
    { clientIdx: 10, projectIdx: 13, status: 'PAID', day: 23, month: 7, amount: 13000, paidDay: 29 },
    { clientIdx: 10, projectIdx: 14, status: 'DRAFT', day: 23, month: 8, amount: 5000 },
    { clientIdx: 11, projectIdx: 15, status: 'PAID', day: 25, month: 6, amount: 11000, paidDay: 30 },
    { clientIdx: 12, projectIdx: 16, status: 'PAID', day: 27, month: 6, amount: 8500, paidDay: 5 },
    { clientIdx: 13, projectIdx: 17, status: 'SENT', day: 1, month: 9, amount: 10000 },
    { clientIdx: 14, projectIdx: 18, status: 'DRAFT', day: 5, month: 9, amount: 6000 },
  ]

  const invoices: any[] = []
  for (let i = 0; i < invoiceInputs.length; i += 20) {
    const batch = invoiceInputs.slice(i, i + 20)
    const results = await Promise.all(
      batch.map(async (inv) => {
        const client = clients[inv.clientIdx]
        const project = projects[inv.projectIdx]
        const issuedDate = d(2026, inv.month, inv.day)
        const dueDate = d(2026, inv.month + 1, inv.day)
        const paidAt = inv.paidDay ? d(2026, inv.month, inv.paidDay, 14) : null
        const created = await prisma.invoice.create({
          data: {
            workspaceId: workspace.id,
            clientId: client.id,
            invoiceNumber: `INV-${String(1001 + invoiceInputs.indexOf(inv)).padStart(4, '0')}`,
            status: inv.status as any,
            totalAmount: inv.amount,
            issuedDate,
            dueDate,
            paidAt,
            notes: inv.status === 'OVERDUE' ? 'Second reminder sent. Client contacted via phone.' : null,
          },
        })
        await prisma.invoiceLineItem.create({
          data: {
            invoiceId: created.id,
            description: `${project.name} - ${inv.status === 'PAID' ? 'Monthly' : 'Current'} billing`,
            quantity: 1,
            unitPrice: inv.amount,
            amount: inv.amount,
            sortOrder: 1,
          },
        })
        return created
      }),
    )
    invoices.push(...results)
  }

  // ── ACTIVITIES (20) ──
  const activityInputs: { userId: string; action: string; entityType: string; description: string; day: number; month: number }[] = [
    { userId: alex.id, action: 'task_created', entityType: 'TASK', description: 'Created new task: Dashboard analytics - Metrics grid implementation', day: 2, month: 6 },
    { userId: michael.id, action: 'time_entry_created', entityType: 'TIME_ENTRY', description: 'Submitted 4h time entry for Dashboard analytics', day: 2, month: 6 },
    { userId: emma.id, action: 'project_updated', entityType: 'PROJECT', description: 'Updated project status for Dashboard analytics to IN_PROGRESS', day: 3, month: 6 },
    { userId: alex.id, action: 'task_created', entityType: 'TASK', description: 'Created new task: Deal pipeline - Kanban board setup', day: 3, month: 6 },
    { userId: sophia.id, action: 'time_entry_created', entityType: 'TIME_ENTRY', description: 'Submitted 4h time entry for Portfolio tracker', day: 4, month: 6 },
    { userId: alex.id, action: 'client_created', entityType: 'CLIENT', description: 'Onboarded new client: Peak Wellness Inc.', day: 5, month: 6 },
    { userId: sarah.id, action: 'task_updated', entityType: 'TASK', description: 'Updated task status for Deal pipeline requirements to IN_PROGRESS', day: 5, month: 6 },
    { userId: alex.id, action: 'time_entry_approved', entityType: 'TIME_ENTRY', description: 'Approved Michael\'s time entry for Dashboard analytics', day: 6, month: 6 },
    { userId: emma.id, action: 'task_created', entityType: 'TASK', description: 'Created new task: E-commerce storefront - theme customization', day: 8, month: 6 },
    { userId: alex.id, action: 'invoice_created', entityType: 'INVOICE', description: 'Generated monthly invoice for NovaTech Solutions ($12,000)', day: 10, month: 6 },
    { userId: sarah.id, action: 'time_entry_approved', entityType: 'TIME_ENTRY', description: 'Approved Sophia\'s time entry for Portfolio tracker', day: 10, month: 6 },
    { userId: alex.id, action: 'project_started', entityType: 'PROJECT', description: 'Kicked off new project: Learning management system for LearnHub', day: 12, month: 6 },
    { userId: michael.id, action: 'comment_added', entityType: 'TASK', description: 'Added comment on task #45: "API response format needs adjustment"', day: 14, month: 6 },
    { userId: emma.id, action: 'file_uploaded', entityType: 'FILE', description: 'Uploaded design mockups for Peak Fitness brand guidelines', day: 15, month: 6 },
    { userId: alex.id, action: 'invoice_paid', entityType: 'INVOICE', description: 'Payment received for NovaTech Solutions invoice INV-1001', day: 16, month: 6 },
    { userId: sophia.id, action: 'task_completed', entityType: 'TASK', description: 'Updated task status for LMS course content editor to DONE', day: 18, month: 6 },
    { userId: alex.id, action: 'milestone_reached', entityType: 'WORKSPACE', description: 'Q2 milestone: 15 active projects and $180K billed', day: 22, month: 6 },
    { userId: sarah.id, action: 'task_created', entityType: 'TASK', description: 'Created new task: Energy dashboard - Solar tracking integration', day: 24, month: 6 },
    { userId: emma.id, action: 'time_entry_approved', entityType: 'TIME_ENTRY', description: 'Approved Emma\'s time entry for Brand guidelines design', day: 25, month: 6 },
    { userId: alex.id, action: 'client_updated', entityType: 'CLIENT', description: 'Updated client contact info for Peak Wellness Inc.', day: 26, month: 6 },
  ]

  const activities = await Promise.all(
    activityInputs.map((a) =>
      prisma.activity.create({
        data: {
          workspaceId: workspace.id,
          userId: a.userId,
          action: a.action,
          description: a.description,
          entityType: a.entityType,
          createdAt: d(2026, a.month, a.day, 10 + Math.floor(Math.random() * 8)),
        },
      }),
    ),
  )

  // ── NOTIFICATIONS (50) ──
  const notificationInputs: { userId: string; type: string; title: string; message: string; day: number; month: number; read: boolean }[] = [
    { userId: alex.id, type: 'TASK_ASSIGNED', title: 'Task assigned to you', message: 'Michael Chen was assigned to Metrics grid implementation', day: 2, month: 6, read: true },
    { userId: alex.id, type: 'TIME_ENTRY_SUBMITTED', title: 'Time entry submitted', message: 'Michael Chen submitted 4h for Dashboard analytics', day: 2, month: 6, read: true },
    { userId: michael.id, type: 'TASK_CREATED', title: 'New task created', message: 'You have been assigned to Metrics grid in Dashboard analytics', day: 2, month: 6, read: true },
    { userId: emma.id, type: 'PROJECT_UPDATED', title: 'Project status changed', message: 'Dashboard analytics moved to IN_PROGRESS', day: 3, month: 6, read: true },
    { userId: alex.id, type: 'TIME_ENTRY_SUBMITTED', title: 'Time entry submitted', message: 'Sophia Martinez submitted 4h for Portfolio tracker', day: 4, month: 6, read: true },
    { userId: sophia.id, type: 'TASK_CREATED', title: 'New task created', message: 'You have been assigned to WebSocket sync in Portfolio tracker', day: 4, month: 6, read: true },
    { userId: alex.id, type: 'CLIENT_CREATED', title: 'New client onboarded', message: 'Peak Wellness Inc. has been added as a client', day: 5, month: 6, read: true },
    { userId: sarah.id, type: 'TASK_UPDATED', title: 'Task status updated', message: 'Deal pipeline requirements moved to IN_PROGRESS', day: 5, month: 6, read: true },
    { userId: michael.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 4h entry for Dashboard analytics was approved', day: 6, month: 6, read: true },
    { userId: alex.id, type: 'INVOICE_CREATED', title: 'Invoice generated', message: 'INV-1001 for NovaTech Solutions ($12,000) is ready', day: 10, month: 6, read: true },
    { userId: sophia.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 4h entry for Portfolio tracker was approved', day: 10, month: 6, read: true },
    { userId: emma.id, type: 'TASK_CREATED', title: 'New task created', message: 'You have been assigned to E-commerce storefront theme', day: 8, month: 6, read: true },
    { userId: alex.id, type: 'PROJECT_CREATED', title: 'New project started', message: 'LMS project for LearnHub has been kicked off', day: 12, month: 6, read: true },
    { userId: michael.id, type: 'COMMENT_ADDED', title: 'New comment on task', message: 'Alex commented on task #45: "API format needs adjustment"', day: 14, month: 6, read: true },
    { userId: emma.id, type: 'TIME_ENTRY_SUBMITTED', title: 'Time entry submitted', message: 'Emma Wilson submitted 5h for Brand guidelines', day: 15, month: 6, read: true },
    { userId: alex.id, type: 'INVOICE_PAID', title: 'Payment received', message: 'INV-1001 payment of $12,000 received from NovaTech', day: 16, month: 6, read: true },
    { userId: sarah.id, type: 'TIME_ENTRY_SUBMITTED', title: 'Time entry submitted', message: 'Sarah Thompson submitted 3h for Contact management', day: 16, month: 6, read: true },
    { userId: sophia.id, type: 'TASK_UPDATED', title: 'Task completed', message: 'LMS course content editor marked as DONE', day: 18, month: 6, read: true },
    { userId: alex.id, type: 'MILESTONE_REACHED', title: 'Q2 milestone achieved', message: '15 active projects with $180K billed this quarter', day: 22, month: 6, read: false },
    { userId: michael.id, type: 'TIME_ENTRY_SUBMITTED', title: 'Time entry submitted', message: 'Michael Chen submitted 3h for Document management', day: 19, month: 6, read: true },
    { userId: alex.id, type: 'TASK_ASSIGNED', title: 'New hire onboarded', message: 'Sarah Thompson joined the team as Technical PM', day: 1, month: 6, read: true },
    { userId: emma.id, type: 'TASK_UPDATED', title: 'Design review needed', message: 'Customer portal UX wireframes ready for review', day: 7, month: 6, read: true },
    { userId: sarah.id, type: 'PROJECT_UPDATED', title: 'Project milestone', message: 'E-commerce platform Phase 1 complete', day: 9, month: 6, read: true },
    { userId: sophia.id, type: 'TASK_CREATED', title: 'Bug fix assigned', message: 'Fix WebSocket reconnection issue in Portfolio tracker', day: 11, month: 6, read: true },
    { userId: alex.id, type: 'INVOICE_OVERDUE', title: 'Invoice overdue', message: 'INV-1008 for GreenLeaf ($3,500) is now overdue', day: 13, month: 8, read: false },
    { userId: michael.id, type: 'TASK_UPDATED', title: 'Code review requested', message: 'Dashboard analytics PR #142 needs your review', day: 13, month: 6, read: true },
    { userId: alex.id, type: 'CLIENT_UPDATED', title: 'Client feedback received', message: 'NovaTech provided feedback on dashboard v2', day: 17, month: 6, read: true },
    { userId: emma.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 4h entry for Donor portal UX was approved', day: 18, month: 6, read: true },
    { userId: sarah.id, type: 'TASK_CREATED', title: 'Documentation needed', message: 'API documentation for NovaTech integration required', day: 20, month: 6, read: false },
    { userId: sophia.id, type: 'TIME_ENTRY_SUBMITTED', title: 'Time entry submitted', message: 'Sophia Martinez submitted 3.5h for Membership UI', day: 11, month: 6, read: true },
    { userId: emma.id, type: 'PROJECT_UPDATED', title: 'Project completed', message: 'Brand identity project for GreenLeaf is complete', day: 21, month: 6, read: true },
    { userId: alex.id, type: 'TASK_CREATED', title: 'Sprint planning', message: 'Sprint 12 tasks have been created and assigned', day: 22, month: 6, read: false },
    { userId: michael.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 3h entry for Energy dashboard was approved', day: 24, month: 6, read: true },
    { userId: sarah.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 2h entry for Dashboard accessibility audit was approved', day: 25, month: 6, read: true },
    { userId: alex.id, type: 'CLIENT_UPDATED', title: 'Contract signed', message: 'Peak Wellness Inc. signed the extended contract', day: 25, month: 6, read: true },
    { userId: emma.id, type: 'TIME_ENTRY_SUBMITTED', title: 'Time entry submitted', message: 'Emma Wilson submitted 3h for Portfolio analytics', day: 23, month: 6, read: true },
    { userId: sophia.id, type: 'TASK_UPDATED', title: 'Task reassigned', message: 'ESG data pipeline reassigned to Sophia Martinez', day: 24, month: 6, read: true },
    { userId: michael.id, type: 'TASK_CREATED', title: 'Feature request', message: 'Add export to CSV for Document management', day: 25, month: 6, read: false },
    { userId: sarah.id, type: 'COMMENT_ADDED', title: 'Comment on invoice', message: 'Alex commented on INV-1015: "Please follow up on payment"', day: 26, month: 6, read: true },
    { userId: alex.id, type: 'TIME_ENTRY_SUBMITTED', title: 'Time entry submitted', message: 'Sarah Thompson submitted 2h for Energy dashboard', day: 22, month: 6, read: true },
    { userId: sarah.id, type: 'PROJECT_UPDATED', title: 'Project risk flagged', message: 'Summit Legal project timeline may slip by 1 week', day: 26, month: 6, read: false },
    { userId: emma.id, type: 'TIME_ENTRY_SUBMITTED', title: 'Time entry submitted', message: 'Emma Wilson submitted 4h for Legal website designs', day: 24, month: 6, read: true },
    { userId: sophia.id, type: 'TASK_CREATED', title: 'New feature', message: 'A/B test framework implementation assigned to Sophia', day: 25, month: 6, read: true },
    { userId: alex.id, type: 'INVOICE_CREATED', title: 'Invoice generated', message: 'INV-1039 for Atlas Energy ($10,000) is ready', day: 1, month: 9, read: false },
    { userId: michael.id, type: 'TASK_UPDATED', title: 'Task priority changed', message: 'Cross-store data pipeline priority changed to HIGH', day: 25, month: 6, read: true },
    { userId: alex.id, type: 'TIME_ENTRY_SUBMITTED', title: 'Time entry submitted', message: 'Emma Wilson submitted 2.5h for Social features UI', day: 18, month: 6, read: true },
    { userId: emma.id, type: 'TASK_CREATED', title: 'Design system update', message: 'New component added to corporate website library', day: 12, month: 6, read: true },
    { userId: sarah.id, type: 'INVOICE_CREATED', title: 'Invoice generated', message: 'INV-1020 for BrightPath ($8,500) is ready', day: 27, month: 6, read: true },
    { userId: sophia.id, type: 'TIME_ENTRY_APPROVED' as NotificationType, title: 'Time entry approved', message: 'Your 4h entry for QR code scanner was approved', day: 16, month: 6, read: true },
    { userId: alex.id, type: 'MILESTONE_REACHED' as NotificationType, title: 'Team milestone', message: 'Team completed 500 hours billed this month!', day: 28, month: 6, read: false },
  ]

  const notifications: any[] = []
  for (let i = 0; i < notificationInputs.length; i += 25) {
    const batch = notificationInputs.slice(i, i + 25)
    const results = await Promise.all(
      batch.map((n) =>
        prisma.notification.create({
          data: {
            workspaceId: workspace.id,
            userId: n.userId,
            type: n.type as any,
            title: n.title,
            message: n.message,
            readAt: n.read ? new Date() : null,
            createdAt: d(2026, n.month, n.day, 9 + Math.floor(Math.random() * 10)),
          },
        }),
      ),
    )
    notifications.push(...results)
  }

  // ── FILE ATTACHMENTS (16) ──
  const fileInputs: { userId: string; projectIdx: number; taskIdx: number | null; name: string; type: string; size: number; day: number; month: number }[] = [
    { userId: emma.id, projectIdx: 0, taskIdx: 1, name: 'dashboard-wireframes-v2.fig', type: 'application/fig', size: 4_200_000, day: 3, month: 6 },
    { userId: emma.id, projectIdx: 0, taskIdx: 2, name: 'metrics-grid-mockup.png', type: 'image/png', size: 1_800_000, day: 4, month: 6 },
    { userId: michael.id, projectIdx: 0, taskIdx: 3, name: 'metrics-grid-component.tsx', type: 'text/tsx', size: 45_000, day: 5, month: 6 },
    { userId: emma.id, projectIdx: 4, taskIdx: 1, name: 'storefront-theme-v1.zip', type: 'application/zip', size: 12_500_000, day: 8, month: 6 },
    { userId: emma.id, projectIdx: 12, taskIdx: 0, name: 'peak-fitness-logo-final.ai', type: 'application/postscript', size: 3_100_000, day: 10, month: 6 },
    { userId: emma.id, projectIdx: 12, taskIdx: 1, name: 'brand-guidelines-v1.pdf', type: 'application/pdf', size: 8_400_000, day: 12, month: 6 },
    { userId: sophia.id, projectIdx: 3, taskIdx: 2, name: 'websocket-client.ts', type: 'text/typescript', size: 28_000, day: 5, month: 6 },
    { userId: alex.id, projectIdx: 1, taskIdx: 0, name: 'crm-requirements-v3.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 2_100_000, day: 3, month: 6 },
    { userId: sarah.id, projectIdx: 1, taskIdx: 1, name: 'contact-api-schema.prisma', type: 'text/prisma', size: 12_000, day: 4, month: 6 },
    { userId: emma.id, projectIdx: 15, taskIdx: 0, name: 'corporate-component-library.fig', type: 'application/fig', size: 6_800_000, day: 12, month: 6 },
    { userId: sarah.id, projectIdx: 16, taskIdx: 1, name: 'esignature-integration-spec.md', type: 'text/markdown', size: 34_000, day: 13, month: 6 },
    { userId: michael.id, projectIdx: 3, taskIdx: 1, name: 'plaid-integration-config.json', type: 'application/json', size: 8_500, day: 10, month: 6 },
    { userId: emma.id, projectIdx: 0, taskIdx: null, name: 'nova-brand-assets.zip', type: 'application/zip', size: 15_200_000, day: 1, month: 6 },
    { userId: emma.id, projectIdx: 6, taskIdx: 0, name: 'social-media-template-kit.canva', type: 'application/canva', size: 5_600_000, day: 15, month: 6 },
    { userId: sophia.id, projectIdx: 8, taskIdx: 3, name: 'knowledge-base-search.tsx', type: 'text/tsx', size: 52_000, day: 11, month: 6 },
    { userId: alex.id, projectIdx: 14, taskIdx: null, name: 'scholarship-fund-proposal.pdf', type: 'application/pdf', size: 3_800_000, day: 20, month: 6 },
  ]

  const fileAttachments = await Promise.all(
    fileInputs.map((f) => {
      const project = projects[f.projectIdx]
      return prisma.fileAttachment.create({
        data: {
          workspaceId: workspace.id,
          uploadedById: f.userId,
          projectId: project.id,
          name: f.name,
          originalName: f.name,
          type: f.type,
          size: f.size,
          key: `seed/${workspace.id}/${project.id}/${f.name}`,
          url: `https://storage.example.com/${workspace.id}/${project.id}/${f.name}`,
          createdAt: d(2026, f.month, f.day, 10),
        },
      })
    }),
  )

  // ── SUMMARY ──
  const summary: [string, number][] = [
    ['Team Users', team.length],
    ['Client Users', clientPortalUsers.length],
    ['Clients', clients.length],
    ['Projects', projects.length],
    ['Tasks', tasks.length],
    ['Time Entries', timeEntries.length],
    ['Invoices', invoices.length],
    ['Activities', activities.length],
    ['Notifications', notifications.length],
    ['File Attachments', fileAttachments.length],
  ]

  console.log('')
  console.log('  ┌─────────────────────────────────────────────┐')
  console.log('  │             SEED COMPLETE ✓                │')
  console.log('  ├─────────────────────────────────────────────┤')
  for (const [label, count] of summary) {
    console.log(`  │  ${label.padEnd(26)} ${String(count).padStart(4)}            │`)
  }
  console.log('  │                                             │')
  console.log(`  │  Workspace: ${workspace.slug.padEnd(20)}       │`)
  console.log('  └─────────────────────────────────────────────┘')
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
