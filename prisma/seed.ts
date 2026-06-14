import { PrismaClient, NotificationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function d(year: number, month: number, day: number, hour = 9, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  const PASSWORD_HASH = await bcrypt.hash('password123', 10)
  const NOW = new Date()
  const CUR_YEAR = NOW.getFullYear()
  const CUR_MONTH = NOW.getMonth() + 1

  // Clean existing data
  const tables = [
    'apiKey', 'activity', 'auditLog', 'invoiceLineItem', 'invoice',
    'timeEntry', 'task', 'project', 'clientMember', 'client',
    'invite', 'workspaceMember', 'user', 'subscription', 'workspaceSettings', 'workspace',
    'fileAttachment', 'clientRequest', 'notification',
  ] as const
  for (const t of tables) {
    await (prisma as any)[t].deleteMany()
  }

  // ── WORKSPACE ──
  const workspace = await prisma.workspace.create({
    data: { name: 'Creative Orbit Studio', slug: 'creative-orbit' },
  })

  await prisma.workspaceSettings.create({
    data: {
      workspaceId: workspace.id,
      primaryColor: '#0d9488',
      timezone: 'America/New_York',
      companyName: 'Creative Orbit Studio LLC',
      companyAddress: '48 W 25th St, New York, NY 10010',
      companyTaxId: 'US-88-1234567',
      theme: { darkMode: false, fontSize: 'normal' },
    },
  })

  await prisma.subscription.create({
    data: {
      workspaceId: workspace.id,
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodStart: d(2026, 6, 1),
      currentPeriodEnd: d(2026, 7, 1),
      cancelAtPeriodEnd: false,
    },
  })

  // ── USERS ──
  const sarah = await prisma.user.create({
    data: { email: 'sarah@creativeorbit.com', passwordHash: PASSWORD_HASH, name: 'Sarah Johnson', userType: 'TEAM' },
  })
  const alex = await prisma.user.create({
    data: { email: 'alex@creativeorbit.com', passwordHash: PASSWORD_HASH, name: 'Alex Chen', userType: 'TEAM' },
  })
  const emma = await prisma.user.create({
    data: { email: 'emma@creativeorbit.com', passwordHash: PASSWORD_HASH, name: 'Emma Davis', userType: 'TEAM' },
  })
  const michael = await prisma.user.create({
    data: { email: 'michael@creativeorbit.com', passwordHash: PASSWORD_HASH, name: 'Michael Brown', userType: 'TEAM' },
  })
  const sophia = await prisma.user.create({
    data: { email: 'sophia@creativeorbit.com', passwordHash: PASSWORD_HASH, name: 'Sophia Wilson', userType: 'TEAM' },
  })

  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId: sarah.id, role: 'OWNER', joinedAt: d(2025, 9, 1) },
  })
  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId: alex.id, role: 'MANAGER', joinedAt: d(2025, 10, 15), invitedById: sarah.id },
  })
  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId: emma.id, role: 'TEAM_MEMBER', joinedAt: d(2026, 1, 10), invitedById: alex.id },
  })
  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId: michael.id, role: 'TEAM_MEMBER', joinedAt: d(2025, 11, 1), invitedById: alex.id },
  })
  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId: sophia.id, role: 'TEAM_MEMBER', joinedAt: d(2026, 2, 1), invitedById: alex.id },
  })

  const team = [sarah, alex, emma, michael, sophia]

  // ── CLIENTS (15) ──
  const clientData = [
    { name: 'NorthStar Ventures', email: 'james@northstarventures.com', phone: '(415) 555-0101', company: 'NorthStar Ventures LLC', status: 'ACTIVE' as const, notes: 'VC firm investing in early-stage SaaS. Our biggest client by revenue. Multiple ongoing projects including dashboard redesign and CRM integration.' },
    { name: 'GreenLeaf Health', email: 'diana@greenleafhealth.com', phone: '(212) 555-0202', company: 'GreenLeaf Health Inc.', status: 'ACTIVE' as const, notes: 'Organic wellness brand expanding nationally. E-commerce platform and mobile app in active development.' },
    { name: 'NovaTech Solutions', email: 'raj@novatech.io', phone: '(512) 555-0303', company: 'NovaTech Solutions Corp', status: 'ACTIVE' as const, notes: 'B2B SaaS company building analytics dashboard and customer portal for their enterprise clients.' },
    { name: 'Horizon Education', email: 'lisa@horizonedu.org', phone: '(617) 555-0505', company: 'Horizon Education Nonprofit', status: 'ACTIVE' as const, notes: 'EdTech nonprofit building a learning management platform for under-resourced schools nationwide.' },
    { name: 'Peak Fitness', email: 'marcus@peakfit.com', phone: '(917) 555-0404', company: 'Peak Fitness LLC', status: 'ACTIVE' as const, notes: 'Premium gym chain with 8 locations. Class booking system and member mobile app underway.' },
    { name: 'Urban Living Co.', email: 'nina@urbanliving.co', phone: '(646) 555-0707', company: 'Urban Living Properties', status: 'ACTIVE' as const, notes: 'Luxury real estate developer. Property showcase site and interactive floor plans in progress.' },
    { name: 'BrightPath Consulting', email: 'tom@brightpathconsult.com', phone: '(312) 555-0606', company: 'BrightPath Consulting Group', status: 'ACTIVE' as const, notes: 'Management consulting firm. Corporate website live, client intake portal in development.' },
    { name: 'Atlas Energy', email: 'maria@atlasenergy.com', phone: '(713) 555-1111', company: 'Atlas Energy Corp', status: 'ACTIVE' as const, notes: 'Renewable energy company. Building a customer dashboard and public-facing sustainability reports.' },
    { name: 'Elevate Commerce', email: 'jake@elevatecommerce.com', phone: '(310) 555-1212', company: 'Elevate Commerce Inc.', status: 'ACTIVE' as const, notes: 'DTC brand accelerator. Multiple Shopify stores and a custom analytics platform for their portfolio brands.' },
    { name: 'Summit Legal', email: 'robert@summitlegal.com', phone: '(202) 555-1313', company: 'Summit Legal Partners', status: 'ACTIVE' as const, notes: 'Boutique law firm. Modern website redesign and client intake portal with document management.' },
    { name: 'SkyBridge Finance', email: 'peter@skybridgefin.com', phone: '(212) 555-0808', company: 'SkyBridge Financial Services', status: 'LEAD' as const, notes: 'Fintech startup. Early discussions about a client dashboard MVP for wealth management.' },
    { name: 'Quantum Logistics', email: 'vikram@quantumlogistics.com', phone: '(305) 555-1010', company: 'Quantum Logistics Inc.', status: 'LEAD' as const, notes: 'Supply chain SaaS startup. Referred by NorthStar Ventures. Initial scoping meeting completed.' },
    { name: 'BlueWave Systems', email: 'amy@bluewavesystems.com', phone: '(425) 555-1414', company: 'BlueWave Systems LLC', status: 'LEAD' as const, notes: 'Cloud infrastructure startup. Exploring options for a developer portal and documentation site.' },
    { name: 'NextGen Robotics', email: 'david@nextgenrobotics.com', phone: '(408) 555-1515', company: 'NextGen Robotics Inc.', status: 'LEAD' as const, notes: 'Industrial robotics company. Initial consultation for IoT monitoring dashboard.' },
    { name: 'PixelCraft Media', email: 'zoe@pixelcraftmedia.com', phone: '(323) 555-0909', company: 'PixelCraft Media Studio', status: 'INACTIVE' as const, notes: 'Creative agency and referral partner. Portfolio project paused due to their internal restructuring.' },
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
      prisma.user.create({ data: { email, passwordHash: PASSWORD_HASH, name: clientPortalNames[i], userType: 'CLIENT' } })
    ),
  )

  for (let i = 0; i < clientPortalIds.length; i++) {
    await prisma.clientMember.create({
      data: { clientId: clientPortalIds[i], userId: clientPortalUsers[i].id, workspaceId: workspace.id, joinedAt: d(2025, 11, 1), invitedById: sarah.id },
    })
  }

  // ── PROJECTS (30) ──
  type ProjectInput = {
    clientId: string; name: string; hourlyRate: number; status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
    startDate: Date; dueDate: Date; description: string
  }

  const projectInputs: ProjectInput[] = [
    { clientId: northstar.id, name: 'SaaS Dashboard Redesign', hourlyRate: 150, status: 'ACTIVE', startDate: d(2026, 1, 15), dueDate: d(2026, 7, 30), description: 'Complete redesign of the NorthStar Ventures portfolio monitoring dashboard with real-time metrics, interactive charts, and investor reporting.' },
    { clientId: northstar.id, name: 'Investor CRM Integration', hourlyRate: 140, status: 'ACTIVE', startDate: d(2026, 3, 1), dueDate: d(2026, 8, 15), description: 'Custom CRM module for tracking investor relations, deal flow, and portfolio company communications.' },
    { clientId: northstar.id, name: 'Marketing Website Relaunch', hourlyRate: 130, status: 'COMPLETED', startDate: d(2025, 11, 1), dueDate: d(2026, 2, 28), description: 'Full website redesign with case study showcase, team profiles, and blog engine.' },
    { clientId: northstar.id, name: 'Data API Layer', hourlyRate: 160, status: 'ACTIVE', startDate: d(2026, 4, 1), dueDate: d(2026, 9, 30), description: 'GraphQL API aggregating portfolio company data from multiple sources with real-time sync.' },
    { clientId: greenleaf.id, name: 'E-Commerce Platform', hourlyRate: 120, status: 'ACTIVE', startDate: d(2026, 2, 1), dueDate: d(2026, 8, 31), description: 'Shopify Plus custom storefront with subscription boxes, loyalty program, and wholesale ordering.' },
    { clientId: greenleaf.id, name: 'Mobile App MVP', hourlyRate: 125, status: 'ACTIVE', startDate: d(2026, 4, 15), dueDate: d(2026, 10, 15), description: 'React Native wellness app with product catalog, order tracking, and wellness content library.' },
    { clientId: greenleaf.id, name: 'Brand Refresh', hourlyRate: 110, status: 'COMPLETED', startDate: d(2026, 1, 10), dueDate: d(2026, 3, 15), description: 'Complete brand overhaul including logo, packaging design, social media templates, and brand guidelines.' },
    { clientId: novatech.id, name: 'Analytics Dashboard', hourlyRate: 145, status: 'ACTIVE', startDate: d(2026, 3, 1), dueDate: d(2026, 9, 1), description: 'Real-time analytics dashboard with customizable widgets, report builder, and export functionality.' },
    { clientId: novatech.id, name: 'Customer Portal MVP', hourlyRate: 140, status: 'ACTIVE', startDate: d(2026, 5, 1), dueDate: d(2026, 11, 30), description: 'Self-service customer portal with ticket management, knowledge base, and usage analytics.' },
    { clientId: novatech.id, name: 'Landing Page Optimization', hourlyRate: 100, status: 'COMPLETED', startDate: d(2026, 2, 1), dueDate: d(2026, 3, 30), description: 'A/B tested landing page redesign with optimized conversion funnel and performance improvements.' },
    { clientId: horizon.id, name: 'Learning Management Platform', hourlyRate: 95, status: 'ACTIVE', startDate: d(2026, 4, 1), dueDate: d(2026, 12, 31), description: 'Open-source-based LMS customized for under-resourced schools. Offline-capable with sync engine.' },
    { clientId: horizon.id, name: 'Donor Portal', hourlyRate: 90, status: 'COMPLETED', startDate: d(2026, 2, 1), dueDate: d(2026, 5, 1), description: 'Donor impact portal showing real-time metrics on student outcomes and program effectiveness.' },
    { clientId: peak.id, name: 'Class Booking System', hourlyRate: 115, status: 'ACTIVE', startDate: d(2026, 3, 15), dueDate: d(2026, 7, 15), description: 'Web-based class booking system with waitlist management, membership tiers, and Stripe integration.' },
    { clientId: peak.id, name: 'Member Mobile App', hourlyRate: 125, status: 'ACTIVE', startDate: d(2026, 5, 1), dueDate: d(2026, 10, 30), description: 'Member app with class check-in, workout tracking, push notifications, and social features.' },
    { clientId: peak.id, name: 'Brand Identity System', hourlyRate: 105, status: 'COMPLETED', startDate: d(2026, 1, 15), dueDate: d(2026, 3, 1), description: 'Logo, color palette, typography system, and brand guidelines for new market positioning.' },
    { clientId: urban.id, name: 'Property Showcase Site', hourlyRate: 130, status: 'ACTIVE', startDate: d(2026, 4, 15), dueDate: d(2026, 8, 1), description: 'Luxury property listing site with virtual tours, neighborhood guides, and inquiry management.' },
    { clientId: urban.id, name: 'Interactive Floor Plans', hourlyRate: 135, status: 'ACTIVE', startDate: d(2026, 6, 1), dueDate: d(2026, 9, 15), description: 'WebGL-based interactive floor plan viewer with unit selection, finishes, and pricing.' },
    { clientId: brightpath.id, name: 'Corporate Website', hourlyRate: 110, status: 'ACTIVE', startDate: d(2026, 4, 1), dueDate: d(2026, 7, 15), description: 'Professional services website with case studies, thought leadership blog, and team directory.' },
    { clientId: brightpath.id, name: 'Client Intake Portal', hourlyRate: 120, status: 'ACTIVE', startDate: d(2026, 5, 15), dueDate: d(2026, 9, 30), description: 'Secure client onboarding portal with document upload, e-signature workflows, and project briefs.' },
    { clientId: atlas.id, name: 'Customer Energy Dashboard', hourlyRate: 135, status: 'ACTIVE', startDate: d(2026, 5, 1), dueDate: d(2026, 10, 1), description: 'Customer-facing energy monitoring dashboard with real-time usage data, savings insights, and solar production tracking.' },
    { clientId: atlas.id, name: 'Sustainability Report Site', hourlyRate: 125, status: 'ACTIVE', startDate: d(2026, 6, 1), dueDate: d(2026, 9, 30), description: 'Public-facing annual sustainability report with interactive data visualizations and ESG metrics.' },
    { clientId: elevate.id, name: 'Portfolio Analytics Platform', hourlyRate: 140, status: 'ACTIVE', startDate: d(2026, 4, 1), dueDate: d(2026, 10, 31), description: 'Centralized analytics platform for tracking performance across all portfolio brand stores.' },
    { clientId: elevate.id, name: 'Shopify Store Optimization', hourlyRate: 115, status: 'COMPLETED', startDate: d(2026, 3, 1), dueDate: d(2026, 5, 15), description: 'Performance audit and optimization for 3 Shopify stores including theme, speed, and conversion improvements.' },
    { clientId: summit.id, name: 'Law Firm Website Redesign', hourlyRate: 130, status: 'ACTIVE', startDate: d(2026, 5, 1), dueDate: d(2026, 8, 15), description: 'Modern website redesign with practice area pages, attorney profiles, and legal blog.' },
    { clientId: summit.id, name: 'Client Intake & Document Portal', hourlyRate: 135, status: 'ACTIVE', startDate: d(2026, 6, 15), dueDate: d(2026, 11, 30), description: 'Secure client portal with document sharing, e-signature, case status tracking, and billing overview.' },
    { clientId: skybridge.id, name: 'Investor Dashboard MVP', hourlyRate: 145, status: 'ARCHIVED', startDate: d(2026, 6, 1), dueDate: d(2026, 9, 1), description: 'Preliminary investor dashboard with portfolio performance, risk metrics, and reporting. On hold pending funding.' },
    { clientId: quantum.id, name: 'Supply Chain Tracking Portal', hourlyRate: 130, status: 'ARCHIVED', startDate: d(2026, 6, 1), dueDate: d(2026, 8, 15), description: 'Scoping phase for a real-time shipment tracking portal. Paused after initial consultation.' },
    { clientId: bluewave.id, name: 'Developer Documentation Portal', hourlyRate: 120, status: 'ARCHIVED', startDate: d(2026, 6, 15), dueDate: d(2026, 9, 30), description: 'Technical documentation site with API reference, SDK guides, and interactive code examples.' },
    { clientId: nextgen.id, name: 'IoT Monitoring Dashboard', hourlyRate: 150, status: 'ARCHIVED', startDate: d(2026, 7, 1), dueDate: d(2026, 11, 30), description: 'Industrial IoT monitoring dashboard for robotic arm fleet. Initial discovery phase completed.' },
    { clientId: pixelcraft.id, name: 'Creative Portfolio Website', hourlyRate: 100, status: 'ARCHIVED', startDate: d(2026, 3, 1), dueDate: d(2026, 5, 1), description: 'Creative portfolio site for PixelCraft Media. Paused due to client restructuring.' },
  ]

  const projects = await Promise.all(
    projectInputs.map((p) => prisma.project.create({
      data: { workspaceId: workspace.id, ...p },
    })),
  )

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
    { projectIdx: 10, title: 'Class schedule database design', status: 'DONE', assigneeIdx: 3, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 10, title: 'Week calendar view component', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 35, sortOrder: 2 },
    { projectIdx: 10, title: 'Booking flow with waitlist', status: 'IN_PROGRESS', assigneeIdx: 0, dueDateOffset: 55, sortOrder: 3 },
    { projectIdx: 10, title: 'Membership tier management', status: 'TODO', assigneeIdx: 4, dueDateOffset: 75, sortOrder: 4 },
    { projectIdx: 10, title: 'Stripe checkout integration', status: 'TODO', assigneeIdx: 3, dueDateOffset: 95, sortOrder: 5 },
    { projectIdx: 10, title: 'Class reminder email/SMS notifications', status: 'TODO', assigneeIdx: 4, dueDateOffset: 110, sortOrder: 6 },
    { projectIdx: 11, title: 'App architecture and navigation setup', status: 'DONE', assigneeIdx: 3, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 11, title: 'Class check-in with QR code scanning', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 50, sortOrder: 2 },
    { projectIdx: 11, title: 'Workout tracking and history', status: 'TODO', assigneeIdx: 0, dueDateOffset: 80, sortOrder: 3 },
    { projectIdx: 11, title: 'Social features -- challenges and leaderboards', status: 'TODO', assigneeIdx: 2, dueDateOffset: 110, sortOrder: 4 },
    { projectIdx: 11, title: 'Apple Watch companion app', status: 'TODO', assigneeIdx: 3, dueDateOffset: 140, sortOrder: 5 },
    { projectIdx: 12, title: 'Logo exploration and finalization', status: 'DONE', assigneeIdx: 2, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 12, title: 'Typography and color system', status: 'DONE', assigneeIdx: 2, dueDateOffset: 25, sortOrder: 2 },
    { projectIdx: 12, title: 'Brand guidelines PDF', status: 'DONE', assigneeIdx: 1, dueDateOffset: 40, sortOrder: 3 },
    { projectIdx: 13, title: 'LMS requirements gathering and tech selection', status: 'DONE', assigneeIdx: 0, dueDateOffset: 25, sortOrder: 1 },
    { projectIdx: 13, title: 'Course content authoring tool', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 60, sortOrder: 2 },
    { projectIdx: 13, title: 'Offline sync engine for low-connectivity areas', status: 'TODO', assigneeIdx: 3, dueDateOffset: 95, sortOrder: 3 },
    { projectIdx: 13, title: 'Student progress tracking and assessments', status: 'TODO', assigneeIdx: 0, dueDateOffset: 130, sortOrder: 4 },
    { projectIdx: 13, title: 'Teacher dashboard and analytics', status: 'TODO', assigneeIdx: 4, dueDateOffset: 160, sortOrder: 5 },
    { projectIdx: 13, title: 'Mobile-responsive student interface', status: 'TODO', assigneeIdx: 2, dueDateOffset: 180, sortOrder: 6 },
    { projectIdx: 14, title: 'Impact metrics data model', status: 'DONE', assigneeIdx: 3, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 14, title: 'Donor dashboard with real-time metrics', status: 'DONE', assigneeIdx: 0, dueDateOffset: 35, sortOrder: 2 },
    { projectIdx: 14, title: 'Student story showcase component', status: 'DONE', assigneeIdx: 2, dueDateOffset: 50, sortOrder: 3 },
    { projectIdx: 14, title: 'Donation receipt and tax document generation', status: 'DONE', assigneeIdx: 4, dueDateOffset: 65, sortOrder: 4 },
    { projectIdx: 15, title: 'Design system and component library', status: 'DONE', assigneeIdx: 2, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 15, title: 'Service pages with case study integration', status: 'IN_PROGRESS', assigneeIdx: 2, dueDateOffset: 45, sortOrder: 2 },
    { projectIdx: 15, title: 'Thought leadership blog with CMS', status: 'TODO', assigneeIdx: 4, dueDateOffset: 65, sortOrder: 3 },
    { projectIdx: 15, title: 'Team directory with search and filters', status: 'TODO', assigneeIdx: 3, dueDateOffset: 85, sortOrder: 4 },
    { projectIdx: 15, title: 'Analytics and lead capture optimization', status: 'TODO', assigneeIdx: 4, dueDateOffset: 100, sortOrder: 5 },
    { projectIdx: 16, title: 'Secure document upload with encryption', status: 'DONE', assigneeIdx: 3, dueDateOffset: 25, sortOrder: 1 },
    { projectIdx: 16, title: 'E-signature workflow integration', status: 'IN_PROGRESS', assigneeIdx: 0, dueDateOffset: 50, sortOrder: 2 },
    { projectIdx: 16, title: 'Project brief builder with templates', status: 'TODO', assigneeIdx: 2, dueDateOffset: 75, sortOrder: 3 },
    { projectIdx: 16, title: 'Status tracking and notification system', status: 'TODO', assigneeIdx: 4, dueDateOffset: 100, sortOrder: 4 },
    { projectIdx: 16, title: 'Client onboarding flow and welcome sequence', status: 'TODO', assigneeIdx: 1, dueDateOffset: 120, sortOrder: 5 },
    { projectIdx: 17, title: 'Energy data visualization wireframes', status: 'DONE', assigneeIdx: 2, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 17, title: 'Real-time usage API integration', status: 'IN_PROGRESS', assigneeIdx: 3, dueDateOffset: 45, sortOrder: 2 },
    { projectIdx: 17, title: 'Solar production tracking widget', status: 'TODO', assigneeIdx: 4, dueDateOffset: 70, sortOrder: 3 },
    { projectIdx: 17, title: 'Savings insights and recommendations engine', status: 'TODO', assigneeIdx: 0, dueDateOffset: 95, sortOrder: 4 },
    { projectIdx: 17, title: 'Bill comparison and forecasting', status: 'TODO', assigneeIdx: 3, dueDateOffset: 115, sortOrder: 5 },
    { projectIdx: 18, title: 'Data visualization component library', status: 'DONE', assigneeIdx: 2, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 18, title: 'ESG metric aggregation pipeline', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 35, sortOrder: 2 },
    { projectIdx: 18, title: 'Interactive annual report pages', status: 'TODO', assigneeIdx: 2, dueDateOffset: 55, sortOrder: 3 },
    { projectIdx: 18, title: 'PDF report generation and download', status: 'TODO', assigneeIdx: 3, dueDateOffset: 75, sortOrder: 4 },
    { projectIdx: 19, title: 'Cross-store data unification schema', status: 'DONE', assigneeIdx: 3, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 19, title: 'Performance dashboard with comparative views', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 50, sortOrder: 2 },
    { projectIdx: 19, title: 'Automated reporting and email summaries', status: 'TODO', assigneeIdx: 0, dueDateOffset: 80, sortOrder: 3 },
    { projectIdx: 19, title: 'Inventory health monitoring alerts', status: 'TODO', assigneeIdx: 3, dueDateOffset: 105, sortOrder: 4 },
    { projectIdx: 19, title: 'Marketing channel attribution model', status: 'TODO', assigneeIdx: 4, dueDateOffset: 130, sortOrder: 5 },
    { projectIdx: 20, title: 'Store performance audit and benchmarking', status: 'DONE', assigneeIdx: 4, dueDateOffset: 10, sortOrder: 1 },
    { projectIdx: 20, title: 'Theme optimization and Core Web Vitals', status: 'DONE', assigneeIdx: 3, dueDateOffset: 20, sortOrder: 2 },
    { projectIdx: 20, title: 'Conversion funnel analysis and checkout improvements', status: 'DONE', assigneeIdx: 0, dueDateOffset: 35, sortOrder: 3 },
    { projectIdx: 20, title: 'A/B test framework implementation', status: 'DONE', assigneeIdx: 4, dueDateOffset: 50, sortOrder: 4 },
    { projectIdx: 21, title: 'Practice area page templates', status: 'DONE', assigneeIdx: 2, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 21, title: 'Attorney profile pages with search', status: 'IN_PROGRESS', assigneeIdx: 2, dueDateOffset: 40, sortOrder: 2 },
    { projectIdx: 21, title: 'Legal blog with category taxonomy', status: 'TODO', assigneeIdx: 4, dueDateOffset: 60, sortOrder: 3 },
    { projectIdx: 21, title: 'Contact and consultation request forms', status: 'TODO', assigneeIdx: 4, dueDateOffset: 80, sortOrder: 4 },
    { projectIdx: 21, title: 'Dark mode and accessibility compliance', status: 'TODO', assigneeIdx: 2, dueDateOffset: 95, sortOrder: 5 },
    { projectIdx: 22, title: 'Document management system architecture', status: 'DONE', assigneeIdx: 3, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 22, title: 'Secure file upload with encryption at rest', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 45, sortOrder: 2 },
    { projectIdx: 22, title: 'E-signature workflow (DocuSign API)', status: 'TODO', assigneeIdx: 0, dueDateOffset: 70, sortOrder: 3 },
    { projectIdx: 22, title: 'Case status tracking timeline component', status: 'TODO', assigneeIdx: 4, dueDateOffset: 95, sortOrder: 4 },
    { projectIdx: 22, title: 'Client billing overview and invoice history', status: 'TODO', assigneeIdx: 3, dueDateOffset: 115, sortOrder: 5 },
    { projectIdx: 25, title: 'Initial market research and requirements doc', status: 'DONE', assigneeIdx: 1, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 25, title: 'Wireframes and user flow diagrams', status: 'DONE', assigneeIdx: 2, dueDateOffset: 30, sortOrder: 2 },
    { projectIdx: 26, title: 'Discovery sessions and requirements gathering', status: 'DONE', assigneeIdx: 1, dueDateOffset: 10, sortOrder: 1 },
    { projectIdx: 26, title: 'Technical feasibility assessment', status: 'DONE', assigneeIdx: 0, dueDateOffset: 20, sortOrder: 2 },
    { projectIdx: 27, title: 'Documentation platform evaluation and selection', status: 'DONE', assigneeIdx: 1, dueDateOffset: 20, sortOrder: 1 },
    { projectIdx: 27, title: 'Information architecture and content outline', status: 'DONE', assigneeIdx: 2, dueDateOffset: 35, sortOrder: 2 },
    { projectIdx: 28, title: 'IoT protocol research and data pipeline design', status: 'DONE', assigneeIdx: 3, dueDateOffset: 25, sortOrder: 1 },
    { projectIdx: 28, title: 'Dashboard wireframes and KPI definition', status: 'DONE', assigneeIdx: 2, dueDateOffset: 40, sortOrder: 2 },
    { projectIdx: 29, title: 'Homepage and project grid layout', status: 'DONE', assigneeIdx: 2, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 29, title: 'Project detail page template', status: 'DONE', assigneeIdx: 2, dueDateOffset: 25, sortOrder: 2 },
    { projectIdx: 29, title: 'About and contact pages', status: 'DONE', assigneeIdx: 0, dueDateOffset: 35, sortOrder: 3 },
    { projectIdx: 29, title: 'Responsive QA and cross-browser testing', status: 'DONE', assigneeIdx: 4, dueDateOffset: 42, sortOrder: 4 },
    { projectIdx: 29, title: 'SEO audit and metadata optimization', status: 'DONE', assigneeIdx: 1, dueDateOffset: 48, sortOrder: 5 },
    // ── Summit Legal Website (idx 23) ──
    { projectIdx: 23, title: 'Navigation and information architecture', status: 'IN_PROGRESS', assigneeIdx: 2, dueDateOffset: 30, sortOrder: 3 },
    { projectIdx: 23, title: 'Responsive layout and mobile optimization', status: 'TODO', assigneeIdx: 4, dueDateOffset: 50, sortOrder: 4 },
    { projectIdx: 23, title: 'Content migration and copy review', status: 'TODO', assigneeIdx: 2, dueDateOffset: 70, sortOrder: 5 },
    // ── Summit Legal Portal (idx 24) ──
    { projectIdx: 24, title: 'User authentication and role-based access', status: 'IN_PROGRESS', assigneeIdx: 4, dueDateOffset: 35, sortOrder: 3 },
    { projectIdx: 24, title: 'Case status dashboard UI', status: 'TODO', assigneeIdx: 2, dueDateOffset: 55, sortOrder: 4 },
    { projectIdx: 24, title: 'Notification preferences and email alerts', status: 'TODO', assigneeIdx: 3, dueDateOffset: 75, sortOrder: 5 },
    // ── SkyBridge MVP (idx 25) ──
    { projectIdx: 25, title: 'Risk metrics data model design', status: 'DONE', assigneeIdx: 3, dueDateOffset: 22, sortOrder: 3 },
    { projectIdx: 25, title: 'Portfolio performance prototype API', status: 'DONE', assigneeIdx: 0, dueDateOffset: 35, sortOrder: 4 },
    // ── Quantum Logistics (idx 26) ──
    { projectIdx: 26, title: 'Shipment tracking data models', status: 'DONE', assigneeIdx: 3, dueDateOffset: 18, sortOrder: 3 },
    { projectIdx: 26, title: 'API vendor research and comparison matrix', status: 'DONE', assigneeIdx: 1, dueDateOffset: 28, sortOrder: 4 },
    // ── BlueWave Docs Portal (idx 27) ──
    { projectIdx: 27, title: 'API reference page template design', status: 'DONE', assigneeIdx: 2, dueDateOffset: 28, sortOrder: 5 },
    { projectIdx: 27, title: 'Interactive code example playground', status: 'DONE', assigneeIdx: 3, dueDateOffset: 38, sortOrder: 6 },
    // ── NextGen IoT Dashboard (idx 28) ──
    { projectIdx: 28, title: 'IoT sensor data format analysis', status: 'DONE', assigneeIdx: 3, dueDateOffset: 15, sortOrder: 1 },
    { projectIdx: 28, title: 'Dashboard wireframes and KPI selection', status: 'DONE', assigneeIdx: 2, dueDateOffset: 30, sortOrder: 2 },
    { projectIdx: 28, title: 'Real-time data pipeline assessment', status: 'DONE', assigneeIdx: 1, dueDateOffset: 42, sortOrder: 3 },
    // ── Creative Portfolio Website (idx 29) ──
    { projectIdx: 29, title: 'Visual mood board and design direction', status: 'DONE', assigneeIdx: 2, dueDateOffset: 12, sortOrder: 1 },
    { projectIdx: 29, title: 'Homepage hero and project grid design', status: 'DONE', assigneeIdx: 2, dueDateOffset: 22, sortOrder: 2 },
    { projectIdx: 29, title: 'Project detail page with image lightbox', status: 'DONE', assigneeIdx: 0, dueDateOffset: 32, sortOrder: 3 },
    { projectIdx: 29, title: 'Contact form with file upload', status: 'DONE', assigneeIdx: 4, dueDateOffset: 40, sortOrder: 4 },
    // ── Additional tasks for completed projects ──
    { projectIdx: 2, title: 'Load time optimization and image compression', status: 'DONE', assigneeIdx: 4, dueDateOffset: 55, sortOrder: 5 },
    { projectIdx: 6, title: 'Packaging mockups and physical asset delivery', status: 'DONE', assigneeIdx: 2, dueDateOffset: 58, sortOrder: 5 },
    { projectIdx: 9, title: 'Heatmap analysis and UX improvement recommendations', status: 'DONE', assigneeIdx: 0, dueDateOffset: 45, sortOrder: 5 },
    { projectIdx: 11, title: 'Donor impact report PDF template', status: 'DONE', assigneeIdx: 2, dueDateOffset: 55, sortOrder: 5 },
    { projectIdx: 12, title: 'Social media template kit expansion', status: 'DONE', assigneeIdx: 2, dueDateOffset: 48, sortOrder: 4 },
  ]

  const tasks = await Promise.all(
    taskTemplates.map((t) => {
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
    { userId: emma.id, projectIdx: 0, taskIdx: 1, day: 1, month: 6, startHour: 10, durationHrs: 3, description: 'Dashboard wireframes -- layout exploration and client feedback', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 0, taskIdx: 2, day: 2, month: 6, startHour: 9, durationHrs: 6, description: 'High-fidelity mockups in Figma -- metrics grid and charts', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 4, taskIdx: 0, day: 3, month: 6, startHour: 9, durationHrs: 4, description: 'Shopify storefront theme customization and component styling', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 5, taskIdx: 1, day: 4, month: 6, startHour: 13, durationHrs: 3.5, description: 'Mobile app product catalog screen and search designs', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 8, taskIdx: 0, day: 5, month: 6, startHour: 9, durationHrs: 5, description: 'Customer portal UX wireframes and user flow diagrams', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 12, taskIdx: 0, day: 8, month: 6, startHour: 9, durationHrs: 3, description: 'Peak Fitness logo refinement -- color variations and lockups', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 12, taskIdx: 1, day: 9, month: 6, startHour: 10, durationHrs: 4, description: 'Typography scale and color palette documentation', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 15, taskIdx: 0, day: 10, month: 6, startHour: 9, durationHrs: 5, description: 'Corporate website component library in Figma', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 15, taskIdx: 1, day: 11, month: 6, startHour: 13, durationHrs: 3, description: 'Service page layouts with case study integration points', status: 'APPROVED' },
    { userId: emma.id, projectIdx: 21, taskIdx: 0, day: 12, month: 6, startHour: 9, durationHrs: 4, description: 'Practice area page template designs for law firm site', status: 'SUBMITTED' },
    { userId: emma.id, projectIdx: 6, taskIdx: 3, day: 15, month: 6, startHour: 9, durationHrs: 2, description: 'Social media template kit -- Canva template creation', status: 'SUBMITTED' },
    { userId: emma.id, projectIdx: 6, taskIdx: 2, day: 16, month: 6, startHour: 10, durationHrs: 3, description: 'Brand guidelines document layout and visual design', status: 'SUBMITTED' },
    { userId: emma.id, projectIdx: 14, taskIdx: 0, day: 17, month: 6, startHour: 9, durationHrs: 3, description: 'Donor portal dashboard visual design and impact metric cards', status: 'SUBMITTED' },
    { userId: emma.id, projectIdx: 11, taskIdx: 3, day: 18, month: 6, startHour: 13, durationHrs: 2.5, description: 'Social features -- challenge and leaderboard UI designs', status: 'DRAFT' },
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
    { userId: alex.id, projectIdx: 14, taskIdx: 3, day: 26, month: 6, startHour: 11, durationHrs: 1, description: 'Donation receipt system QA sign-off and deployment', status: 'APPROVED' },
  ]

  const timeEntries = await Promise.all(
    timeEntryInputs.map((t) => {
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


  // ── INVOICES (40) ──
  type InvoiceInput = {
    clientId: string; invoiceNumber: string; status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELED'
    totalAmount: number; issuedDate: Date; dueDate: Date; paidAt?: Date; notes: string
    lineItems: { description: string; quantity: number; unitPrice: number }[]
  }

  const invoiceInputs: InvoiceInput[] = [
    { clientId: northstar.id, invoiceNumber: 'INV-2026-001', status: 'PAID', totalAmount: 5850.00, issuedDate: d(2026, 1, 31), dueDate: d(2026, 2, 28), paidAt: d(2026, 2, 20), notes: 'Marketing Website Relaunch homepage and case study milestone.', lineItems: [{ description: 'Homepage design and development', quantity: 20, unitPrice: 150 }, { description: 'Case study template with CMS integration', quantity: 15, unitPrice: 150 }, { description: 'Team directory and individual profile pages', quantity: 10, unitPrice: 150 }] },
    { clientId: northstar.id, invoiceNumber: 'INV-2026-002', status: 'PAID', totalAmount: 4200.00, issuedDate: d(2026, 3, 15), dueDate: d(2026, 4, 15), paidAt: d(2026, 4, 10), notes: 'Marketing Website Relaunch blog engine and SEO final milestone.', lineItems: [{ description: 'Blog engine with MDX and categories', quantity: 15, unitPrice: 150 }, { description: 'SEO optimization meta tags and sitemap', quantity: 8, unitPrice: 150 }, { description: 'Performance optimization and launch', quantity: 7, unitPrice: 150 }] },
    { clientId: northstar.id, invoiceNumber: 'INV-2026-003', status: 'PAID', totalAmount: 9200.00, issuedDate: d(2026, 5, 1), dueDate: d(2026, 6, 1), paidAt: d(2026, 5, 25), notes: 'SaaS Dashboard Redesign UI/UX milestone and data layer.', lineItems: [{ description: 'User research and stakeholder interviews', quantity: 12, unitPrice: 150 }, { description: 'Dashboard wireframes and information architecture', quantity: 15, unitPrice: 150 }, { description: 'High-fidelity mockups and design system', quantity: 18, unitPrice: 150 }, { description: 'GraphQL schema design and data source connectors', quantity: 16, unitPrice: 150 }] },
    { clientId: northstar.id, invoiceNumber: 'INV-2026-004', status: 'SENT', totalAmount: 6400.00, issuedDate: d(2026, 6, 5), dueDate: d(2026, 7, 5), notes: 'Investor CRM Integration contact management and deal pipeline milestone.', lineItems: [{ description: 'Contact management CRUD and backend API', quantity: 14, unitPrice: 140 }, { description: 'Deal flow pipeline Kanban board', quantity: 18, unitPrice: 140 }, { description: 'Investor profile schema and data migration', quantity: 12, unitPrice: 140 }] },
    { clientId: northstar.id, invoiceNumber: 'INV-2026-005', status: 'SENT', totalAmount: 8000.00, issuedDate: d(2026, 6, 15), dueDate: d(2026, 7, 15), notes: 'Data API Layer GraphQL and real-time sync milestone.', lineItems: [{ description: 'Data source connector integration Plaid Stripe', quantity: 20, unitPrice: 160 }, { description: 'Real-time sync engine with WebSockets', quantity: 16, unitPrice: 160 }, { description: 'Caching layer with Redis', quantity: 14, unitPrice: 160 }] },
    { clientId: greenleaf.id, invoiceNumber: 'INV-2026-006', status: 'PAID', totalAmount: 3300.00, issuedDate: d(2026, 3, 20), dueDate: d(2026, 4, 20), paidAt: d(2026, 4, 15), notes: 'Brand Refresh logo design and brand guidelines.', lineItems: [{ description: 'Brand audit and mood board exploration', quantity: 10, unitPrice: 110 }, { description: 'Logo design 3 concept rounds', quantity: 15, unitPrice: 110 }, { description: 'Brand guidelines documentation', quantity: 8, unitPrice: 110 }] },
    { clientId: greenleaf.id, invoiceNumber: 'INV-2026-007', status: 'PAID', totalAmount: 4800.00, issuedDate: d(2026, 4, 1), dueDate: d(2026, 5, 1), paidAt: d(2026, 4, 28), notes: 'E-Commerce Platform Shopify setup and subscription module.', lineItems: [{ description: 'Shopify Plus store setup and theme customization', quantity: 20, unitPrice: 120 }, { description: 'Subscription box recurring order logic', quantity: 15, unitPrice: 120 }, { description: 'Product catalog migration and data import', quantity: 10, unitPrice: 120 }] },
    { clientId: greenleaf.id, invoiceNumber: 'INV-2026-008', status: 'SENT', totalAmount: 6250.00, issuedDate: d(2026, 6, 1), dueDate: d(2026, 7, 1), notes: 'Mobile App MVP product catalog and search milestone.', lineItems: [{ description: 'React Native navigation and auth flow', quantity: 12, unitPrice: 125 }, { description: 'Product catalog and search screens', quantity: 18, unitPrice: 125 }, { description: 'Order tracking and push notification architecture', quantity: 15, unitPrice: 125 }] },
    { clientId: greenleaf.id, invoiceNumber: 'INV-2026-009', status: 'OVERDUE', totalAmount: 2750.00, issuedDate: d(2026, 5, 15), dueDate: d(2026, 6, 15), notes: 'Loyalty points system and referral program.', lineItems: [{ description: 'Loyalty points system technical design', quantity: 8, unitPrice: 120 }, { description: 'Referral program frontend and backend', quantity: 12, unitPrice: 120 }, { description: 'Points redemption workflow and testing', quantity: 10, unitPrice: 120 }] },
    { clientId: novatech.id, invoiceNumber: 'INV-2026-010', status: 'PAID', totalAmount: 2175.00, issuedDate: d(2026, 4, 5), dueDate: d(2026, 5, 5), paidAt: d(2026, 4, 28), notes: 'Landing Page Optimization A/B test and CRO milestone.', lineItems: [{ description: 'A/B test variant design and copywriting', quantity: 8, unitPrice: 100 }, { description: 'Conversion funnel tracking and analytics setup', quantity: 7, unitPrice: 100 }, { description: 'Core Web Vitals and performance optimization', quantity: 6, unitPrice: 100 }] },
    { clientId: novatech.id, invoiceNumber: 'INV-2026-011', status: 'PAID', totalAmount: 7250.00, issuedDate: d(2026, 5, 15), dueDate: d(2026, 6, 15), paidAt: d(2026, 6, 10), notes: 'Analytics Dashboard widget system and chart components milestone.', lineItems: [{ description: 'Dashboard widget system architecture', quantity: 15, unitPrice: 145 }, { description: 'Chart components with Recharts integration', quantity: 20, unitPrice: 145 }, { description: 'Data source connectors and API layer', quantity: 10, unitPrice: 145 }, { description: 'Real-time dashboard WebSocket integration', quantity: 10, unitPrice: 145 }] },
    { clientId: novatech.id, invoiceNumber: 'INV-2026-012', status: 'DRAFT', totalAmount: 4500.00, issuedDate: d(2026, 6, 20), dueDate: d(2026, 7, 20), notes: 'Customer Portal MVP initial sprint deliverables.', lineItems: [{ description: 'Portal UX wireframes and user flows', quantity: 10, unitPrice: 140 }, { description: 'Authentication and team member management', quantity: 12, unitPrice: 140 }, { description: 'Ticket management system prototype', quantity: 8, unitPrice: 140 }] },
    { clientId: novatech.id, invoiceNumber: 'INV-2026-013', status: 'DRAFT', totalAmount: 5600.00, issuedDate: d(2026, 6, 25), dueDate: d(2026, 7, 25), notes: 'Customer Portal knowledge base and billing sprint.', lineItems: [{ description: 'Knowledge base with search functionality', quantity: 15, unitPrice: 140 }, { description: 'Usage analytics and billing overview', quantity: 12, unitPrice: 140 }, { description: 'Portal testing and QA', quantity: 10, unitPrice: 140 }] },
    { clientId: horizon.id, invoiceNumber: 'INV-2026-014', status: 'PAID', totalAmount: 2700.00, issuedDate: d(2026, 5, 10), dueDate: d(2026, 6, 10), paidAt: d(2026, 6, 5), notes: 'Donor Portal impact metrics milestone.', lineItems: [{ description: 'Impact metrics data model and dashboard', quantity: 15, unitPrice: 90 }, { description: 'Student story showcase component', quantity: 10, unitPrice: 90 }, { description: 'Donation receipt and tax document generation', quantity: 5, unitPrice: 90 }] },
    { clientId: horizon.id, invoiceNumber: 'INV-2026-015', status: 'PAID', totalAmount: 3800.00, issuedDate: d(2026, 4, 1), dueDate: d(2026, 5, 1), paidAt: d(2026, 4, 25), notes: 'Learning Management Platform technical setup sprint.', lineItems: [{ description: 'LMS requirements gathering and tech selection', quantity: 15, unitPrice: 95 }, { description: 'Open-source LMS customization and configuration', quantity: 20, unitPrice: 95 }, { description: 'Course content authoring tool prototype', quantity: 10, unitPrice: 95 }] },
    { clientId: horizon.id, invoiceNumber: 'INV-2026-016', status: 'SENT', totalAmount: 4750.00, issuedDate: d(2026, 6, 5), dueDate: d(2026, 7, 5), notes: 'Learning Management Platform content authoring milestone.', lineItems: [{ description: 'Rich text editor and media embedding', quantity: 15, unitPrice: 95 }, { description: 'Offline sync engine development', quantity: 20, unitPrice: 95 }, { description: 'Student progress tracking and assessments', quantity: 15, unitPrice: 95 }] },
    { clientId: peak.id, invoiceNumber: 'INV-2026-017', status: 'PAID', totalAmount: 3450.00, issuedDate: d(2026, 3, 15), dueDate: d(2026, 4, 15), paidAt: d(2026, 4, 10), notes: 'Brand Identity System full brand package delivered.', lineItems: [{ description: 'Logo design and visual identity system', quantity: 15, unitPrice: 115 }, { description: 'Typography and color system documentation', quantity: 10, unitPrice: 115 }, { description: 'Brand guidelines PDF and asset delivery', quantity: 5, unitPrice: 115 }] },
    { clientId: peak.id, invoiceNumber: 'INV-2026-018', status: 'SENT', totalAmount: 2875.00, issuedDate: d(2026, 6, 1), dueDate: d(2026, 7, 1), notes: 'Class Booking System database and calendar component milestone.', lineItems: [{ description: 'Class schedule database schema design', quantity: 8, unitPrice: 115 }, { description: 'Week calendar view component', quantity: 12, unitPrice: 115 }, { description: 'Class type filtering and instructor management', quantity: 5, unitPrice: 115 }] },
    { clientId: peak.id, invoiceNumber: 'INV-2026-019', status: 'DRAFT', totalAmount: 5750.00, issuedDate: d(2026, 6, 20), dueDate: d(2026, 7, 20), notes: 'Class Booking System booking flow and Stripe integration.', lineItems: [{ description: 'Booking flow with waitlist management', quantity: 18, unitPrice: 115 }, { description: 'Membership tier management', quantity: 14, unitPrice: 115 }, { description: 'Stripe checkout integration', quantity: 12, unitPrice: 115 }] },
    { clientId: peak.id, invoiceNumber: 'INV-2026-020', status: 'DRAFT', totalAmount: 5000.00, issuedDate: d(2026, 6, 25), dueDate: d(2026, 7, 25), notes: 'Member Mobile App QR check-in and workout tracking milestone.', lineItems: [{ description: 'QR code scanner integration', quantity: 10, unitPrice: 125 }, { description: 'Workout tracking and history', quantity: 15, unitPrice: 125 }, { description: 'Social features and leaderboards', quantity: 15, unitPrice: 125 }] },
    { clientId: urban.id, invoiceNumber: 'INV-2026-021', status: 'PAID', totalAmount: 2600.00, issuedDate: d(2026, 5, 1), dueDate: d(2026, 6, 1), paidAt: d(2026, 5, 28), notes: 'Property Showcase Site listing template and virtual tour milestone.', lineItems: [{ description: 'Property listing template design and development', quantity: 12, unitPrice: 130 }, { description: 'Virtual tour embedding with Matterport', quantity: 8, unitPrice: 130 }] },
    { clientId: urban.id, invoiceNumber: 'INV-2026-022', status: 'SENT', totalAmount: 3900.00, issuedDate: d(2026, 6, 10), dueDate: d(2026, 7, 10), notes: 'Property Showcase Site neighborhood guides and inquiry system.', lineItems: [{ description: 'Neighborhood guide with map integration', quantity: 10, unitPrice: 130 }, { description: 'Inquiry management CRM integration', quantity: 12, unitPrice: 130 }, { description: 'Mortgage calculator and affordability tools', quantity: 8, unitPrice: 130 }] },
    { clientId: urban.id, invoiceNumber: 'INV-2026-023', status: 'SENT', totalAmount: 5400.00, issuedDate: d(2026, 6, 20), dueDate: d(2026, 7, 20), notes: 'Interactive Floor Plans WebGL viewer milestone.', lineItems: [{ description: 'WebGL renderer and 3D model pipeline', quantity: 16, unitPrice: 135 }, { description: 'Unit selection and finish customization', quantity: 12, unitPrice: 135 }, { description: 'Pricing and availability overlay', quantity: 8, unitPrice: 135 }, { description: 'Mobile touch optimization', quantity: 6, unitPrice: 135 }] },
    { clientId: brightpath.id, invoiceNumber: 'INV-2026-024', status: 'PAID', totalAmount: 2200.00, issuedDate: d(2026, 5, 1), dueDate: d(2026, 6, 1), paidAt: d(2026, 5, 25), notes: 'Corporate Website design system and service pages milestone.', lineItems: [{ description: 'Design system and component library', quantity: 10, unitPrice: 110 }, { description: 'Service pages with case study integration', quantity: 10, unitPrice: 110 }] },
    { clientId: brightpath.id, invoiceNumber: 'INV-2026-025', status: 'SENT', totalAmount: 3300.00, issuedDate: d(2026, 6, 5), dueDate: d(2026, 7, 5), notes: 'Corporate Website blog and team directory milestone.', lineItems: [{ description: 'Thought leadership blog with CMS', quantity: 12, unitPrice: 110 }, { description: 'Team directory with search and filters', quantity: 10, unitPrice: 110 }, { description: 'Analytics and lead capture optimization', quantity: 8, unitPrice: 110 }] },
    { clientId: brightpath.id, invoiceNumber: 'INV-2026-026', status: 'DRAFT', totalAmount: 4800.00, issuedDate: d(2026, 6, 25), dueDate: d(2026, 7, 25), notes: 'Client Intake Portal document upload and e-signature milestone.', lineItems: [{ description: 'Secure document upload with encryption', quantity: 12, unitPrice: 120 }, { description: 'E-signature workflow DocuSign API', quantity: 15, unitPrice: 120 }, { description: 'Project brief builder with templates', quantity: 10, unitPrice: 120 }, { description: 'Status tracking and notification system', quantity: 8, unitPrice: 120 }] },
    { clientId: atlas.id, invoiceNumber: 'INV-2026-027', status: 'PAID', totalAmount: 4050.00, issuedDate: d(2026, 6, 1), dueDate: d(2026, 7, 1), paidAt: d(2026, 6, 20), notes: 'Customer Energy Dashboard wireframes and API integration milestone.', lineItems: [{ description: 'Energy data visualization wireframes', quantity: 10, unitPrice: 135 }, { description: 'Real-time usage API integration', quantity: 12, unitPrice: 135 }, { description: 'Solar production tracking widget', quantity: 8, unitPrice: 135 }] },
    { clientId: atlas.id, invoiceNumber: 'INV-2026-028', status: 'SENT', totalAmount: 5000.00, issuedDate: d(2026, 6, 15), dueDate: d(2026, 7, 15), notes: 'Sustainability Report Site data visualization and ESG metrics.', lineItems: [{ description: 'Data visualization component library', quantity: 12, unitPrice: 125 }, { description: 'ESG metric aggregation and chart pipeline', quantity: 15, unitPrice: 125 }, { description: 'Interactive annual report pages', quantity: 13, unitPrice: 125 }] },
    { clientId: atlas.id, invoiceNumber: 'INV-2026-029', status: 'DRAFT', totalAmount: 3750.00, issuedDate: d(2026, 6, 28), dueDate: d(2026, 7, 28), notes: 'Sustainability Report Site report generation and final milestone.', lineItems: [{ description: 'PDF report generation and download', quantity: 10, unitPrice: 125 }, { description: 'Content integration and CMS setup', quantity: 12, unitPrice: 125 }, { description: 'QA testing and launch preparation', quantity: 8, unitPrice: 125 }] },
    { clientId: elevate.id, invoiceNumber: 'INV-2026-030', status: 'PAID', totalAmount: 2300.00, issuedDate: d(2026, 4, 1), dueDate: d(2026, 5, 1), paidAt: d(2026, 4, 20), notes: 'Shopify Store Optimization audit and benchmark milestone.', lineItems: [{ description: 'Performance audit and benchmarking', quantity: 8, unitPrice: 115 }, { description: 'Theme optimization and Core Web Vitals', quantity: 12, unitPrice: 115 }] },
    { clientId: elevate.id, invoiceNumber: 'INV-2026-031', status: 'PAID', totalAmount: 3450.00, issuedDate: d(2026, 5, 1), dueDate: d(2026, 6, 1), paidAt: d(2026, 5, 25), notes: 'Shopify Store Optimization conversion funnel and A/B test milestone.', lineItems: [{ description: 'Conversion funnel analysis and checkout improvements', quantity: 12, unitPrice: 115 }, { description: 'A/B test framework implementation', quantity: 10, unitPrice: 115 }, { description: 'Post-launch performance report', quantity: 8, unitPrice: 115 }] },
    { clientId: elevate.id, invoiceNumber: 'INV-2026-032', status: 'DRAFT', totalAmount: 7000.00, issuedDate: d(2026, 6, 25), dueDate: d(2026, 7, 25), notes: 'Portfolio Analytics Platform data unification and dashboard milestone.', lineItems: [{ description: 'Cross-store data unification and ETL pipeline', quantity: 15, unitPrice: 140 }, { description: 'Performance dashboard with comparative views', quantity: 20, unitPrice: 140 }, { description: 'Automated reporting and email summaries', quantity: 15, unitPrice: 140 }] },
    { clientId: summit.id, invoiceNumber: 'INV-2026-033', status: 'SENT', totalAmount: 3900.00, issuedDate: d(2026, 6, 10), dueDate: d(2026, 7, 10), notes: 'Law Firm Website Redesign templates and profiles milestone.', lineItems: [{ description: 'Practice area page templates', quantity: 10, unitPrice: 130 }, { description: 'Attorney profile pages with search', quantity: 12, unitPrice: 130 }, { description: 'Website theme and component library', quantity: 8, unitPrice: 130 }] },
    { clientId: summit.id, invoiceNumber: 'INV-2026-034', status: 'DRAFT', totalAmount: 2600.00, issuedDate: d(2026, 6, 25), dueDate: d(2026, 7, 25), notes: 'Law Firm Website Redesign blog and contact forms milestone.', lineItems: [{ description: 'Legal blog with category taxonomy', quantity: 8, unitPrice: 130 }, { description: 'Contact and consultation request forms', quantity: 8, unitPrice: 130 }, { description: 'Dark mode and accessibility compliance', quantity: 4, unitPrice: 130 }] },
    { clientId: summit.id, invoiceNumber: 'INV-2026-035', status: 'DRAFT', totalAmount: 5400.00, issuedDate: d(2026, 6, 28), dueDate: d(2026, 7, 28), notes: 'Client Intake and Document Portal initial sprint.', lineItems: [{ description: 'Document management system architecture', quantity: 12, unitPrice: 135 }, { description: 'Secure file upload with encryption', quantity: 14, unitPrice: 135 }, { description: 'E-signature workflow integration', quantity: 14, unitPrice: 135 }] },
    { clientId: skybridge.id, invoiceNumber: 'INV-2026-036', status: 'CANCELED', totalAmount: 2900.00, issuedDate: d(2026, 6, 5), dueDate: d(2026, 7, 5), notes: 'Investor Dashboard MVP discovery and wireframes.', lineItems: [{ description: 'Market research and requirements documentation', quantity: 8, unitPrice: 145 }, { description: 'Dashboard wireframes and user flow diagrams', quantity: 10, unitPrice: 145 }, { description: 'Technical feasibility assessment', quantity: 5, unitPrice: 145 }] },
    { clientId: quantum.id, invoiceNumber: 'INV-2026-037', status: 'CANCELED', totalAmount: 2600.00, issuedDate: d(2026, 6, 10), dueDate: d(2026, 7, 10), notes: 'Supply Chain Tracking Portal discovery phase.', lineItems: [{ description: 'Discovery sessions and requirements gathering', quantity: 8, unitPrice: 130 }, { description: 'Technical feasibility assessment', quantity: 6, unitPrice: 130 }, { description: 'Solution architecture document', quantity: 6, unitPrice: 130 }] },
    { clientId: bluewave.id, invoiceNumber: 'INV-2026-038', status: 'CANCELED', totalAmount: 2400.00, issuedDate: d(2026, 6, 20), dueDate: d(2026, 7, 20), notes: 'Developer Documentation Portal platform evaluation milestone.', lineItems: [{ description: 'Documentation platform evaluation and selection', quantity: 8, unitPrice: 120 }, { description: 'Information architecture and content outline', quantity: 10, unitPrice: 120 }, { description: 'Developer experience research report', quantity: 4, unitPrice: 120 }] },
    { clientId: nextgen.id, invoiceNumber: 'INV-2026-039', status: 'CANCELED', totalAmount: 4500.00, issuedDate: d(2026, 7, 1), dueDate: d(2026, 8, 1), notes: 'IoT Monitoring Dashboard discovery and wireframes.', lineItems: [{ description: 'IoT protocol research and data pipeline design', quantity: 12, unitPrice: 150 }, { description: 'Dashboard wireframes and KPI definition', quantity: 10, unitPrice: 150 }, { description: 'Technical architecture document', quantity: 8, unitPrice: 150 }] },
    { clientId: pixelcraft.id, invoiceNumber: 'INV-2026-040', status: 'PAID', totalAmount: 3000.00, issuedDate: d(2026, 4, 1), dueDate: d(2026, 5, 1), paidAt: d(2026, 4, 20), notes: 'Creative Portfolio Website initial design milestone.', lineItems: [{ description: 'Homepage and project grid layout', quantity: 12, unitPrice: 100 }, { description: 'Project detail page template', quantity: 10, unitPrice: 100 }, { description: 'About and contact pages', quantity: 8, unitPrice: 100 }] },
  ]

  for (const inv of invoiceInputs) {
    const created = await prisma.invoice.create({
      data: {
        workspaceId: workspace.id, clientId: inv.clientId, invoiceNumber: inv.invoiceNumber,
        status: inv.status, totalAmount: inv.totalAmount,
        issuedDate: inv.issuedDate, dueDate: inv.dueDate,
        paidAt: inv.paidAt ?? null, notes: inv.notes,
      },
    })
    await Promise.all(
      inv.lineItems.map((li, idx) =>
        prisma.invoiceLineItem.create({
          data: {
            invoiceId: created.id, description: li.description,
            quantity: li.quantity, unitPrice: li.unitPrice,
            amount: li.quantity * li.unitPrice, sortOrder: idx + 1,
          },
        }),
      ),
    )
  }

  // ── ACTIVITIES (for dashboard feed) ──
  const activityData = [
    { userId: michael.id, action: 'time_entry_created', description: 'Michael Brown logged 4h on SaaS Dashboard Redesign', entityType: 'TIME_ENTRY', createdAt: d(2026, 6, 2, 14) },
    { userId: sarah.id, action: 'invoice_paid', description: 'Sarah Johnson marked INV-2026-003 as paid ($9,200.00)', entityType: 'INVOICE', createdAt: d(2026, 5, 25, 11) },
    { userId: alex.id, action: 'project_completed', description: 'Alex Chen completed Donor Portal for Horizon Education', entityType: 'PROJECT', createdAt: d(2026, 5, 1, 16) },
    { userId: emma.id, action: 'task_completed', description: 'Emma Davis completed High-fidelity mockups (Figma)', entityType: 'TASK', createdAt: d(2026, 6, 3, 15) },
    { userId: sophia.id, action: 'task_completed', description: 'Sophia Wilson completed WebSocket data binding implementation', entityType: 'TASK', createdAt: d(2026, 6, 5, 13) },
    { userId: alex.id, action: 'client_created', description: 'Alex Chen added Atlas Energy as a new client', entityType: 'CLIENT', createdAt: d(2026, 4, 15, 10) },
    { userId: sarah.id, action: 'invoice_sent', description: 'Sarah Johnson sent INV-2026-004 to NorthStar Ventures ($6,400.00)', entityType: 'INVOICE', createdAt: d(2026, 6, 5, 9) },
    { userId: michael.id, action: 'time_entry_created', description: 'Michael Brown logged 5.5h on Class Booking System', entityType: 'TIME_ENTRY', createdAt: d(2026, 6, 12, 15) },
    { userId: alex.id, action: 'project_started', description: 'Alex Chen kicked off Client Intake and Document Portal for Summit Legal', entityType: 'PROJECT', createdAt: d(2026, 6, 15, 11) },
    { userId: emma.id, action: 'task_completed', description: 'Emma Davis completed Peak Fitness logo design', entityType: 'TASK', createdAt: d(2026, 6, 8, 14) },
    { userId: sophia.id, action: 'time_entry_created', description: 'Sophia Wilson logged 4h on Customer Portal knowledge base', entityType: 'TIME_ENTRY', createdAt: d(2026, 6, 9, 15) },
    { userId: sarah.id, action: 'invoice_paid', description: 'Sarah Johnson marked INV-2026-011 as paid ($7,250.00)', entityType: 'INVOICE', createdAt: d(2026, 6, 10, 10) },
    { userId: alex.id, action: 'client_converted', description: 'Alex Chen converted SkyBridge Finance from lead to active', entityType: 'CLIENT', createdAt: d(2026, 5, 20, 14) },
    { userId: michael.id, action: 'task_completed', description: 'Michael Brown completed GraphQL schema design for Data API Layer', entityType: 'TASK', createdAt: d(2026, 6, 6, 16) },
    { userId: emma.id, action: 'time_entry_created', description: 'Emma Davis logged 5h on Corporate Website design system', entityType: 'TIME_ENTRY', createdAt: d(2026, 6, 10, 15) },
    { userId: alex.id, action: 'invoice_overdue', description: 'INV-2026-009 for GreenLeaf Health is now overdue ($2,750.00)', entityType: 'INVOICE', createdAt: d(2026, 6, 16, 9) },
    { userId: sophia.id, action: 'task_started', description: 'Sophia Wilson started work on ESG metric aggregation pipeline', entityType: 'TASK', createdAt: d(2026, 6, 22, 10) },
    { userId: sarah.id, action: 'project_completed', description: 'Sarah Johnson completed Shopify Store Optimization for Elevate Commerce', entityType: 'PROJECT', createdAt: d(2026, 5, 15, 13) },
    { userId: michael.id, action: 'time_entry_created', description: 'Michael Brown logged 4h on Summit Legal document management system', entityType: 'TIME_ENTRY', createdAt: d(2026, 6, 19, 14) },
    { userId: alex.id, action: 'sprint_planning', description: 'Alex Chen completed sprint planning for 6 active projects', entityType: 'WORKSPACE', createdAt: d(2026, 6, 1, 10) },
  ]

  for (const act of activityData) {
    await prisma.activity.create({
      data: { workspaceId: workspace.id, userId: act.userId, action: act.action, description: act.description, entityType: act.entityType, createdAt: act.createdAt },
    })
  }

  // ── NOTIFICATIONS (50) ──
  const notificationData = [
    { userId: sarah.id, type: 'INVOICE_PAID', title: 'Invoice INV-2026-003 paid', message: 'NorthStar Ventures paid $9,200.00 via wire transfer.', link: '/creative-orbit/invoices', createdAt: d(2026, 5, 25, 11, 30), readAt: d(2026, 5, 25, 12, 0) },
    { userId: sarah.id, type: 'INVOICE_PAID', title: 'Invoice INV-2026-011 paid', message: 'NovaTech Solutions paid $7,250.00 via ACH transfer.', link: '/creative-orbit/invoices', createdAt: d(2026, 6, 10, 10, 15), readAt: d(2026, 6, 10, 11, 0) },
    { userId: sarah.id, type: 'PROJECT_COMPLETED', title: 'Donor Portal completed', message: 'Horizon Education donor portal project completed ahead of schedule.', link: `/creative-orbit/projects/${projects[14].id}`, createdAt: d(2026, 5, 1, 16, 0), readAt: d(2026, 5, 2, 9, 0) },
    { userId: sarah.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Custom report builder for NovaTech Analytics Dashboard.', link: `/creative-orbit/projects/${projects[7].id}`, createdAt: d(2026, 6, 1, 9, 0) },
    { userId: sarah.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned E-signature workflow for BrightPath Client Intake Portal.', link: `/creative-orbit/projects/${projects[16].id}`, createdAt: d(2026, 6, 15, 9, 0) },
    { userId: sarah.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 4h Dashboard widget architecture entry was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 5, 14, 0), readAt: d(2026, 6, 5, 15, 0) },
    { userId: sarah.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 2.5h Booking flow state machine entry was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 9, 14, 0) },
    { userId: sarah.id, type: 'CLIENT_CREATED', title: 'New client added', message: 'Atlas Energy was added as an active client.', link: '/creative-orbit/clients', createdAt: d(2026, 4, 15, 10, 0), readAt: d(2026, 4, 15, 11, 0) },
    { userId: sarah.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Savings insights engine for Atlas Energy Dashboard.', link: `/creative-orbit/projects/${projects[17].id}`, createdAt: d(2026, 6, 20, 9, 0) },
    { userId: sarah.id, type: 'INVOICE_PAID', title: 'Invoice INV-2026-014 paid', message: 'Horizon Education paid $2,700.00 via credit card.', link: '/creative-orbit/invoices', createdAt: d(2026, 6, 5, 14, 0) },
    { userId: sarah.id, type: 'PROJECT_COMPLETED', title: 'Shopify Store Optimization completed', message: 'Elevate Commerce store optimization completed. Results: +23% conversion rate.', link: `/creative-orbit/projects/${projects[20].id}`, createdAt: d(2026, 5, 15, 13, 0) },
    { userId: sarah.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Automated reporting for Elevate Portfolio Analytics.', link: `/creative-orbit/projects/${projects[19].id}`, createdAt: d(2026, 6, 22, 9, 0) },
    { userId: alex.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Email integration for NorthStar Investor CRM.', link: `/creative-orbit/projects/${projects[1].id}`, createdAt: d(2026, 6, 1, 9, 0) },
    { userId: alex.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Role-based access for NovaTech Analytics dashboard.', link: `/creative-orbit/projects/${projects[7].id}`, createdAt: d(2026, 6, 2, 9, 0) },
    { userId: alex.id, type: 'PROJECT_COMPLETED', title: 'Marketing Website Relaunch completed', message: 'NorthStar Ventures website project completed and launched.', link: `/creative-orbit/projects/${projects[2].id}`, createdAt: d(2026, 2, 28, 15, 0), readAt: d(2026, 3, 1, 9, 0) },
    { userId: alex.id, type: 'INVOICE_PAID', title: 'Invoice INV-2026-010 paid', message: 'NovaTech Solutions paid $2,175.00.', link: '/creative-orbit/invoices', createdAt: d(2026, 4, 28, 11, 0), readAt: d(2026, 4, 28, 14, 0) },
    { userId: alex.id, type: 'INVOICE_PAID', title: 'Invoice INV-2026-014 paid', message: 'Horizon Education paid $2,700.00.', link: '/creative-orbit/invoices', createdAt: d(2026, 6, 5, 14, 30) },
    { userId: alex.id, type: 'CLIENT_CREATED', title: 'New lead added', message: 'NextGen Robotics added as a lead.', link: '/creative-orbit/clients', createdAt: d(2026, 6, 1, 14, 0) },
    { userId: alex.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 1h Membership tier pricing review was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 4, 14, 0) },
    { userId: alex.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Client onboarding flow for BrightPath Consulting.', link: `/creative-orbit/projects/${projects[16].id}`, createdAt: d(2026, 6, 15, 9, 0) },
    { userId: alex.id, type: 'INVOICE_PAID', title: 'Invoice INV-2026-017 paid', message: 'Peak Fitness paid $3,450.00.', link: '/creative-orbit/invoices', createdAt: d(2026, 4, 10, 10, 0), readAt: d(2026, 4, 10, 11, 0) },
    { userId: alex.id, type: 'CLIENT_CREATED', title: 'New client added', message: 'Summit Legal added as an active client.', link: '/creative-orbit/clients', createdAt: d(2026, 5, 1, 11, 0) },
    { userId: alex.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Billing overview for Summit Legal portal.', link: `/creative-orbit/projects/${projects[22].id}`, createdAt: d(2026, 6, 18, 9, 0) },
    { userId: alex.id, type: 'INVOICE_PAID', title: 'Invoice INV-2026-024 paid', message: 'BrightPath Consulting paid $2,200.00.', link: '/creative-orbit/invoices', createdAt: d(2026, 5, 25, 11, 0) },
    { userId: michael.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Real-time data integration for SaaS Dashboard.', link: `/creative-orbit/projects/${projects[0].id}`, createdAt: d(2026, 6, 5, 9, 0) },
    { userId: michael.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Deal flow pipeline Kanban board for Investor CRM.', link: `/creative-orbit/projects/${projects[1].id}`, createdAt: d(2026, 6, 1, 9, 0) },
    { userId: michael.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 4h Metrics grid layout entry was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 2, 16, 0), readAt: d(2026, 6, 3, 9, 0) },
    { userId: michael.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 6h Plaid API integration entry was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 8, 16, 0) },
    { userId: michael.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 5h Deal pipeline state machine entry was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 5, 16, 0) },
    { userId: michael.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Class schedule database for Peak Fitness.', link: `/creative-orbit/projects/${projects[10].id}`, createdAt: d(2026, 6, 1, 9, 0) },
    { userId: michael.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Apple Watch companion app for Peak Fitness.', link: `/creative-orbit/projects/${projects[11].id}`, createdAt: d(2026, 6, 15, 9, 0) },
    { userId: michael.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 3h Subscription order logic entry was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 15, 16, 0) },
    { userId: michael.id, type: 'INVOICE_PAID', title: 'Invoice INV-2026-003 paid', message: 'NorthStar Ventures paid $9,200.00 for SaaS Dashboard work.', link: '/creative-orbit/invoices', createdAt: d(2026, 5, 25, 11, 0) },
    { userId: michael.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Real-time energy API for Atlas Dashboard.', link: `/creative-orbit/projects/${projects[17].id}`, createdAt: d(2026, 6, 20, 9, 0) },
    { userId: michael.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Document management system for Summit Legal.', link: `/creative-orbit/projects/${projects[22].id}`, createdAt: d(2026, 6, 15, 9, 0) },
    { userId: michael.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 4h Course content editor entry was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 16, 16, 0) },
    { userId: emma.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned High-fidelity mockups for SaaS Dashboard.', link: `/creative-orbit/projects/${projects[0].id}`, createdAt: d(2026, 6, 1, 9, 0) },
    { userId: emma.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Social features UI for Peak Fitness App.', link: `/creative-orbit/projects/${projects[11].id}`, createdAt: d(2026, 6, 15, 9, 0) },
    { userId: emma.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 6h Figma mockups entry was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 2, 16, 0), readAt: d(2026, 6, 3, 10, 0) },
    { userId: emma.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 5h Customer portal UX wireframes entry was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 5, 16, 0) },
    { userId: emma.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 5h Figma component library entry was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 10, 16, 0) },
    { userId: emma.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Service pages for BrightPath Website.', link: `/creative-orbit/projects/${projects[15].id}`, createdAt: d(2026, 6, 1, 9, 0) },
    { userId: emma.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Energy dashboard wireframes for Atlas Energy.', link: `/creative-orbit/projects/${projects[17].id}`, createdAt: d(2026, 6, 15, 9, 0) },
    { userId: emma.id, type: 'PROJECT_COMPLETED', title: 'Brand Refresh completed', message: 'GreenLeaf Health brand project completed. Assets delivered.', link: `/creative-orbit/projects/${projects[6].id}`, createdAt: d(2026, 3, 15, 15, 0), readAt: d(2026, 3, 16, 9, 0) },
    { userId: sophia.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned WebSocket real-time sync for Data API Layer.', link: `/creative-orbit/projects/${projects[3].id}`, createdAt: d(2026, 6, 1, 9, 0) },
    { userId: sophia.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 4h WebSocket implementation was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 2, 16, 0) },
    { userId: sophia.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Redis caching layer for Data API.', link: `/creative-orbit/projects/${projects[3].id}`, createdAt: d(2026, 6, 1, 9, 0) },
    { userId: sophia.id, type: 'TIME_ENTRY_APPROVED', title: 'Time entry approved', message: 'Your 4h Knowledge base search entry was approved.', link: '/creative-orbit/time', createdAt: d(2026, 6, 9, 16, 0) },
    { userId: sophia.id, type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'Assigned Drag-and-drop report builder for NovaTech.', link: `/creative-orbit/projects/${projects[7].id}`, createdAt: d(2026, 6, 1, 9, 0) },
    { userId: sophia.id, type: 'INVOICE_PAID', title: 'Invoice INV-2026-011 paid', message: 'NovaTech Solutions paid $7,250.00 for Analytics Dashboard.', link: '/creative-orbit/invoices', createdAt: d(2026, 6, 10, 10, 0) },
  ]

  for (const n of notificationData) {
    await prisma.notification.create({
      data: {
        workspaceId: workspace.id, userId: n.userId, type: n.type as NotificationType,
        title: n.title, message: n.message, link: n.link,
        readAt: n.readAt ?? null, createdAt: n.createdAt,
      },
    })
  }

  // ── FILE ATTACHMENTS ──
  const fileData = [
    { projectId: projects[0].id, uploadedById: emma.id, name: 'dashboard-wireframes-v2.pdf', originalName: 'SaaS_Dashboard_Wireframes_v2.pdf', size: 4_200_000, type: 'application/pdf', key: 'uploads/dashboard-wireframes-v2.pdf' },
    { projectId: projects[0].id, uploadedById: emma.id, name: 'design-system.fig', originalName: 'Dashboard_Design_System.fig', size: 12_800_000, type: 'application/figma', key: 'uploads/dashboard-design-system.fig' },
    { projectId: projects[4].id, uploadedById: emma.id, name: 'shopify-theme-v1.zip', originalName: 'GreenLeaf_Shopify_Theme_v1.zip', size: 8_300_000, type: 'application/zip', key: 'uploads/greenleaf-shopify-theme.zip' },
    { projectId: projects[2].id, uploadedById: emma.id, name: 'brand-assets-final.zip', originalName: 'GreenLeaf_Brand_Assets_Final.zip', size: 15_600_000, type: 'application/zip', key: 'uploads/greenleaf-brand-assets.zip' },
    { projectId: projects[6].id, uploadedById: emma.id, name: 'brand-guidelines.pdf', originalName: 'GreenLeaf_Brand_Guidelines.pdf', size: 3_100_000, type: 'application/pdf', key: 'uploads/greenleaf-brand-guidelines.pdf' },
    { projectId: projects[12].id, uploadedById: emma.id, name: 'peak-logo-suite.ai', originalName: 'Peak_Fitness_Logo_Suite.ai', size: 6_500_000, type: 'application/illustrator', key: 'uploads/peak-logo-suite.ai' },
    { projectId: projects[5].id, uploadedById: sophia.id, name: 'app-screens-v2.zip', originalName: 'GreenLeaf_App_Screens_v2.zip', size: 4_800_000, type: 'application/zip', key: 'uploads/greenleaf-app-screens.zip' },
    { projectId: projects[7].id, uploadedById: michael.id, name: 'chart-components.tsx', originalName: 'chart-components.tsx', size: 45_000, type: 'text/plain', key: 'uploads/chart-components.tsx' },
    { projectId: projects[3].id, uploadedById: michael.id, name: 'graphql-schema.graphql', originalName: 'schema.graphql', size: 28_000, type: 'text/plain', key: 'uploads/graphql-schema.graphql' },
    { projectId: projects[10].id, uploadedById: sophia.id, name: 'calendar-component.tsx', originalName: 'WeekCalendar.tsx', size: 32_000, type: 'text/plain', key: 'uploads/week-calendar.tsx' },
    { clientId: northstar.id, uploadedById: sarah.id, name: 'Q2-investor-report.pdf', originalName: 'NorthStar_Q2_2026_Report.pdf', size: 2_100_000, type: 'application/pdf', key: 'uploads/northstar-q2-report.pdf' },
    { clientId: horizon.id, uploadedById: alex.id, name: 'grant-proposal.docx', originalName: 'Horizon_Grant_Proposal_2026.docx', size: 1_800_000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', key: 'uploads/horizon-grant-proposal.docx' },
    { projectId: projects[15].id, uploadedById: emma.id, name: 'brightpath-style-guide.pdf', originalName: 'BrightPath_Style_Guide.pdf', size: 5_200_000, type: 'application/pdf', key: 'uploads/brightpath-style-guide.pdf' },
    { projectId: projects[17].id, uploadedById: michael.id, name: 'energy-api-spec.yaml', originalName: 'atlas-energy-api-spec.yaml', size: 18_000, type: 'text/yaml', key: 'uploads/atlas-energy-api-spec.yaml' },
    { projectId: projects[19].id, uploadedById: sophia.id, name: 'analytics-dashboard-mockup.fig', originalName: 'Elevate_Analytics_Dashboard.fig', size: 9_400_000, type: 'application/figma', key: 'uploads/elevate-analytics-dashboard.fig' },
    { projectId: projects[21].id, uploadedById: emma.id, name: 'summit-wireframes.pdf', originalName: 'Summit_Legal_Wireframes.pdf', size: 3_600_000, type: 'application/pdf', key: 'uploads/summit-wireframes.pdf' },
  ]

  for (const f of fileData) {
    await prisma.fileAttachment.create({
      data: {
        workspaceId: workspace.id, projectId: f.projectId, clientId: f.clientId ?? null,
        uploadedById: f.uploadedById, name: f.name, originalName: f.originalName,
        size: f.size, type: f.type, key: f.key, url: `https://storage.creativeorbit.com/${f.key}`,
      },
    })
  }

  console.log('')
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║        Creative Orbit Studio — Demo Environment        ║')
  console.log('╠══════════════════════════════════════════════════════════╣')
  console.log('║                                                         ║')
  console.log('║  Workspace: creative-orbit                              ║')
  console.log('║  Login at: http://localhost:3000/creative-orbit/        ║')
  console.log('║                                                         ║')
  console.log('║  All passwords: password123                             ║')
  console.log('║                                                         ║')
  console.log('║  ── Team Accounts ──                                    ║')
  console.log('║  sarah@creativeorbit.com  (Owner / Creative Director)   ║')
  console.log('║  alex@creativeorbit.com   (Manager / Project Manager)   ║')
  console.log('║  emma@creativeorbit.com   (Designer / UX/UI Designer)   ║')
  console.log('║  michael@creativeorbit.com  (Developer / Full-Stack)    ║')
  console.log('║  sophia@creativeorbit.com  (Frontend Engineer)          ║')
  console.log('║                                                         ║')
  console.log('║  ── Client Portal Accounts ──                           ║')
  console.log('║  james@northstarventures.com  (James Wilson)            ║')
  console.log('║  diana@greenleafhealth.com    (Diana Ruiz)              ║')
  console.log('║  raj@novatech.io              (Raj Patel)               ║')
  console.log('║  lisa@horizonedu.org          (Lisa Thompson)           ║')
  console.log('║  marcus@peakfit.com           (Marcus Johnson)          ║')
  console.log('║  Portal at: http://localhost:3000/portal                 ║')
  console.log('║                                                         ║')
  console.log('║  ── Stats ──                                            ║')
  console.log('║  15 clients  ·  30 projects  ·  150 tasks               ║')
  console.log('║  100 time entries  ·  40 invoices  ·  50 notifications  ║')
  console.log('║  16 file attachments  ·  20 activity entries            ║')
  console.log('║                                                         ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
