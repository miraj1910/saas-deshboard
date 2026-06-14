# FlowDesk — Portfolio Assets Report

**Product:** FlowDesk — Operational Backbone for Independent Knowledge Workers
**Demo Workspace:** Creative Orbit Studio
**Date:** June 13, 2026
**Author:** Product Design & Portfolio Review

---

## Table of Contents

1. [Demo Workspace](#1-demo-workspace)
2. [Demo Users](#2-demo-users)
3. [Demo Clients](#3-demo-clients)
4. [Demo Projects](#4-demo-projects)
5. [Demo Tasks](#5-demo-tasks)
6. [Demo Time Entries](#6-demo-time-entries)
7. [Demo Invoices](#7-demo-invoices)
8. [Screenshot Plan](#8-screenshot-plan)
9. [Video Walkthrough Script](#9-video-walkthrough-script)
10. [Portfolio Case Study](#10-portfolio-case-study)
11. [Analytics Dashboard Data Strategy](#11-analytics-dashboard-data-strategy)

---

## 1. Demo Workspace

### Creative Orbit Studio

A design and development agency that builds websites, SaaS products, and marketing assets for clients.

**Brand Positioning:**
- Professional, modern, operations-focused
- Mid-size agency (4 team members + contractors)
- Located in New York City (Flatiron District)
- Founded in 2025, now serving 8 active clients simultaneously
- Annual revenue run rate: ~$340K based on current project pipeline

**Workspace Identity:**

| Field | Value |
|---|---|
| Workspace Name | Creative Orbit Studio |
| Slug | `creative-orbit` |
| Company | Creative Orbit Studio LLC |
| Address | 48 W 25th St, New York, NY 10010 |
| Tax ID | US-88-1234567 |
| Timezone | America/New_York |
| Primary Color | Teal (#0d9488) |
| Subscription | PRO Plan ($19/mo) — Active |
| Theme | Light mode, normal font size |

**Team Size:** 4 active members — Owner, Manager, Developer, Designer

**Client Capacity:** 10 total (8 active, 1 lead, 1 inactive)

**Project Load:** 20 projects (14 active, 5 completed, 1 archived)

**Revenue Snapshot:**
- Total invoiced: ~$43,650
- Paid invoices: $18,525 (4 invoices paid on time)
- Outstanding: $9,160 (4 invoices sent/overdue)
- Draft invoices: $11,375 (3 invoices in draft)
- Average invoice value: ~$3,638

---

## 2. Demo Users

### Team Accounts (password: `password123`)

| Name | Email | Role | Title | Joined | Invited By |
|---|---|---|---|---|---|
| Sarah Chen | [sarah@creativeorbit.com](mailto:sarah@creativeorbit.com) | OWNER | Creative Director & Founder | Sep 1, 2025 | — |
| Alex Rivera | [alex@creativeorbit.com](mailto:alex@creativeorbit.com) | MANAGER | Project Manager | Oct 15, 2025 | Sarah Chen |
| Mike Chen | [mike@creativeorbit.com](mailto:mike@creativeorbit.com) | TEAM_MEMBER | Full-Stack Developer | Nov 1, 2025 | Alex Rivera |
| Emma Torres | [emma@creativeorbit.com](mailto:emma@creativeorbit.com) | TEAM_MEMBER | UX/UI Designer | Jan 10, 2026 | Alex Rivera |

### Client Portal Account

| Name | Email | Role | Company | Joined |
|---|---|---|---|---|
| James Wilson | [client@northstarventures.com](mailto:client@northstarventures.com) | CLIENT | NorthStar Ventures LLC | Nov 1, 2025 |

### Persona Profiles

**Sarah Chen — Creative Director & Founder**
- Background: 12 years in design and engineering. Previously led product design at a Series B SaaS startup.
- Daily workflow: Reviews designs from Emma, reviews code from Mike, handles client relationships with Alex, sends invoices, reviews team performance in analytics.
- Pain point solved by FlowDesk: Previously used Asana + Harvest + FreshBooks + separate CRM. Now uses one tool.
- Avatar: Asian female, 30s, professional attire, works from the Flatiron office 3 days/week.

**Alex Rivera — Project Manager**
- Background: 8 years in agency project management. Formerly at a 50-person digital agency.
- Daily workflow: Reviews timesheets, approves entries, assigns tasks, runs client meetings, checks project profitability.
- Pain point solved by FlowDesk: Can see team utilization and project budgets in real time without exporting spreadsheets.
- Avatar: Latino male, 30s, business casual, manages 6 client relationships simultaneously.

**Mike Chen — Full-Stack Developer**
- Background: 5 years of React/Node.js development. Joined from a fintech startup.
- Daily workflow: Implements frontend components, builds APIs, integrates third-party services, logs time against tasks.
- Pain point solved by FlowDesk: Built-in timer means he no longer needs to separately track time in Toggl.
- Avatar: Asian male, 20s, casual, primarily remote, strong preference for dark mode.

**Emma Torres — UX/UI Designer**
- Background: 6 years in product design. Expert in Figma, design systems, and user research.
- Daily workflow: Creates wireframes, high-fidelity mockups, design systems, brand guidelines. Logs time per project.
- Pain point solved by FlowDesk: Can see which projects need design work and track billable hours per client.
- Avatar: Latina female, 20s, creative style, Figma always open on second monitor.

**James Wilson — Client (NorthStar Ventures)**
- Background: Partner at a VC firm. Reviews agency deliverables and approves invoices.
- Portal usage: Checks project progress, views invoices, downloads reports.
- Avatar: White male, 40s, suit, always on the go, uses client portal on iPad.

---

## 3. Demo Clients

### 10 Realistic Client Accounts

| # | Name | Contact | Email | Phone | Industry | Status | Since |
|---|---|---|---|---|---|---|---|
| 1 | **NorthStar Ventures** | James Wilson | [james@northstarventures.com](mailto:james@northstarventures.com) | (415) 555-0101 | Venture Capital | ACTIVE | Nov 2025 |
| 2 | **GreenLeaf Health** | Diana Chen | [diana@greenleafhealth.com](mailto:diana@greenleafhealth.com) | (212) 555-0202 | Wellness / CPG | ACTIVE | Jan 2026 |
| 3 | **NovaTech Solutions** | Raj Patel | [raj@novatech.io](mailto:raj@novatech.io) | (512) 555-0303 | B2B SaaS | ACTIVE | Feb 2026 |
| 4 | **Peak Fitness** | Marcus Johnson | [marcus@peakfit.com](mailto:marcus@peakfit.com) | (917) 555-0404 | Fitness / Health | ACTIVE | Jan 2026 |
| 5 | **Horizon Education** | Lisa Park | [lisa@horizonedu.org](mailto:lisa@horizonedu.org) | (617) 555-0505 | EdTech / Nonprofit | ACTIVE | Mar 2026 |
| 6 | **BrightPath Consulting** | Tom Harrison | [tom@brightpathconsult.com](mailto:tom@brightpathconsult.com) | (312) 555-0606 | Management Consulting | ACTIVE | Apr 2026 |
| 7 | **Urban Living Co.** | Nina Patel | [nina@urbanliving.co](mailto:nina@urbanliving.co) | (646) 555-0707 | Real Estate | ACTIVE | Apr 2026 |
| 8 | **SkyBridge Finance** | Peter Kim | [peter@skybridgefin.com](mailto:peter@skybridgefin.com) | (212) 555-0808 | Fintech | LEAD | May 2026 |
| 9 | **PixelCraft Media** | Zoe Williams | [zoe@pixelcraftmedia.com](mailto:zoe@pixelcraftmedia.com) | (323) 555-0909 | Creative Agency | INACTIVE | Mar 2026 |
| 10 | **Quantum Logistics** | Vikram Singh | [vikram@quantumlogistics.com](mailto:vikram@quantumlogistics.com) | (305) 555-1010 | Logistics / Supply Chain | LEAD | Jun 2026 |

### Client Profile Detail

**NorthStar Ventures** — Anchor Client
- VC firm investing in early-stage SaaS. Largest client by revenue with 4 projects.
- Contact James Wilson is the Partner. Accesses the client portal to track project progress and invoices.
- Relationship: 4 projects (1 completed, 3 active), 3 invoices ($13,850 total), referral source for Quantum Logistics.

**GreenLeaf Health** — Wellness Brand
- Organic wellness brand expanding nationally. Needs e-commerce, mobile app, and brand identity.
- Contact Diana Chen is the CMO. Decision-maker for digital strategy.
- Relationship: 3 projects (1 completed, 2 active), 2 invoices ($8,100 total), 1 overdue invoice.

**NovaTech Solutions** — B2B SaaS
- Data analytics platform for mid-market companies. Building customer-facing dashboard.
- Contact Raj Patel is the VP of Product. Technical stakeholder, reviews architecture decisions.
- Relationship: 3 projects (1 completed, 2 active), 2 invoices ($7,975 total).

**Peak Fitness** — Premium Gym Chain
- 5 locations in NYC, expanding to 3 more. Needs booking system and member app.
- Contact Marcus Johnson is the COO. Operations-focused stakeholder.
- Relationship: 3 projects (1 completed, 2 active), 2 invoices ($6,325 total).

**Horizon Education** — EdTech Nonprofit
- Building learning platform for under-resourced schools. Mission-driven client.
- Contact Lisa Park is the Executive Director. Budget-conscious, values impact.
- Relationship: 2 projects (1 completed, 1 active), 1 draft invoice ($2,700).

**BrightPath Consulting** — Management Consulting
- Boutique consulting firm refreshing their digital presence. Newer client.
- Contact Tom Harrison is the Managing Partner. Decision-maker on brand and web.
- Relationship: 2 active projects, 1 sent invoice ($2,200).

**Urban Living Co.** — Real Estate Developer
- Luxury residential developer with high-end property portfolio.
- Contact Nina Patel is the Marketing Director. Design-savvy stakeholder.
- Relationship: 2 active projects, 1 sent invoice ($2,600).

**SkyBridge Finance** — Lead (Fintech)
- Early-stage fintech startup. Initial conversations about client dashboard MVP.
- Contact Peter Kim is the CTO. Technical evaluation in progress.
- Relationship: No projects yet. Lead status. Potential Q3 engagement.

**PixelCraft Media** — Inactive (Creative Agency)
- Referral partner. Currently on pause due to internal restructuring.
- Contact Zoe Williams is the Creative Director. Friendly relationship, likely to return.
- Relationship: 1 archived project. No current engagement.

**Quantum Logistics** — Lead (Supply Chain SaaS)
- Referred by NorthStar Ventures. Initial meeting scheduled.
- Contact Vikram Singh is the CEO. Early-stage evaluation.
- Relationship: No projects yet. Lead status, referred by anchor client.

---

## 4. Demo Projects

### 20 Projects Across 8 Clients

#### Active Projects (14)

| # | Project | Client | Rate | Budget | Start | Due | Team | Description |
|---|---|---|---|---|---|---|---|---|
| 1 | **SaaS Dashboard Redesign** | NorthStar Ventures | $150/hr | $24,000 | Jan 15 | Jul 30 | Sarah, Mike, Emma, Alex | Complete redesign of portfolio monitoring dashboard with real-time metrics, interactive charts, and investor reporting. |
| 2 | **Investor CRM Integration** | NorthStar Ventures | $140/hr | $18,000 | Mar 1 | Aug 15 | Sarah, Mike, Alex | Custom CRM module for tracking investor relations, deal flow, and portfolio company communications. |
| 3 | **Data API Layer** | NorthStar Ventures | $160/hr | $28,000 | Apr 1 | Sep 30 | Mike, Alex | GraphQL API aggregating portfolio company data from multiple sources with real-time sync. |
| 4 | **E-Commerce Platform** | GreenLeaf Health | $120/hr | $35,000 | Feb 1 | Aug 31 | Mike, Emma, Sarah, Alex | Shopify Plus custom storefront with subscription boxes, loyalty program, and wholesale ordering. |
| 5 | **Mobile App MVP** | GreenLeaf Health | $125/hr | $22,000 | Apr 15 | Oct 15 | Mike, Emma, Sarah | React Native wellness app with product catalog, order tracking, and wellness content library. |
| 6 | **Analytics Dashboard** | NovaTech Solutions | $145/hr | $26,000 | Mar 1 | Sep 1 | Sarah, Mike, Alex | Real-time analytics dashboard with customizable widgets, report builder, and export functionality. |
| 7 | **Customer Portal MVP** | NovaTech Solutions | $140/hr | $20,000 | May 1 | Nov 30 | Sarah, Mike, Emma, Alex | Self-service customer portal with ticket management, knowledge base, and usage analytics. |
| 8 | **Class Booking System** | Peak Fitness | $115/hr | $14,000 | Mar 15 | Jul 15 | Mike, Sarah, Alex | Web-based class booking system with waitlist management, membership tiers, and Stripe integration. |
| 9 | **Member Mobile App** | Peak Fitness | $125/hr | $20,000 | May 1 | Oct 30 | Mike, Emma, Sarah | Member app with class check-in, workout tracking, push notifications, and social features. |
| 10 | **Learning Management Platform** | Horizon Education | $95/hr | $30,000 | Apr 1 | Dec 31 | Sarah, Mike, Alex | Customized LMS for under-resourced schools. Offline-capable with sync engine. |
| 11 | **Corporate Website** | BrightPath Consulting | $110/hr | $12,000 | Apr 1 | Jul 15 | Emma, Mike, Alex | Professional services website with case studies, thought leadership blog, and team directory. |
| 12 | **Client Intake Portal** | BrightPath Consulting | $120/hr | $15,000 | May 15 | Sep 30 | Sarah, Mike, Emma, Alex | Secure client onboarding portal with document upload, e-signature workflows, and project briefs. |
| 13 | **Property Showcase Site** | Urban Living Co. | $130/hr | $16,000 | Apr 15 | Aug 1 | Emma, Mike, Sarah, Alex | Luxury property listing site with virtual tours, neighborhood guides, and inquiry management. |
| 14 | **Interactive Floor Plans** | Urban Living Co. | $135/hr | $18,000 | Jun 1 | Sep 15 | Mike, Sarah, Alex | WebGL-based interactive floor plan viewer with unit selection, finishes, and pricing. |

#### Completed Projects (5)

| # | Project | Client | Rate | Budget | Completed | Team |
|---|---|---|---|---|---|---|
| 15 | **Marketing Website Relaunch** | NorthStar Ventures | $130/hr | $18,000 | Feb 28 | Sarah, Mike, Emma, Alex |
| 16 | **Brand Refresh** | GreenLeaf Health | $110/hr | $8,000 | Mar 15 | Emma, Alex |
| 17 | **Landing Page Optimization** | NovaTech Solutions | $100/hr | $5,000 | Mar 30 | Mike, Emma, Alex |
| 18 | **Brand Identity System** | Peak Fitness | $105/hr | $6,000 | Mar 1 | Emma, Alex |
| 19 | **Donor Portal** | Horizon Education | $90/hr | $8,000 | May 1 | Sarah, Mike, Emma, Alex |

#### Archived Projects (1)

| # | Project | Client | Rate | Budget | Status | Reason |
|---|---|---|---|---|---|---|
| 20 | **Portfolio Website** | PixelCraft Media | $100/hr | $5,000 | ARCHIVED | Client restructuring — work paused. |

### Project Budget Health

| Project | Budget | Billed to Date | Remaining | Utilization |
|---|---|---|---|---|
| SaaS Dashboard Redesign | $24,000 | $3,800 (inv#003) | $20,200 | ~16% |
| Investor CRM Integration | $18,000 | $0 | $18,000 | 0% |
| Data API Layer | $28,000 | $0 | $28,000 | 0% |
| E-Commerce Platform | $35,000 | $4,800 (ovrdue) | $30,200 | ~14% |
| Mobile App MVP | $22,000 | $0 | $22,000 | 0% |
| Analytics Dashboard | $26,000 | $5,800 (draft) | $20,200 | ~22% |
| Customer Portal MVP | $20,000 | $0 | $20,000 | 0% |
| Class Booking System | $14,000 | $2,875 (draft) | $11,125 | ~21% |
| Member Mobile App | $20,000 | $0 | $20,000 | 0% |
| Learning Management Platform | $30,000 | $0 | $30,000 | 0% |
| Corporate Website | $12,000 | $2,200 (sent) | $9,800 | ~18% |
| Client Intake Portal | $15,000 | $0 | $15,000 | 0% |
| Property Showcase Site | $16,000 | $2,600 (sent) | $13,400 | ~16% |
| Interactive Floor Plans | $18,000 | $0 | $18,000 | 0% |

---

## 5. Demo Tasks

### 100 Tasks — Distribution Summary

| Status | Count | Description |
|---|---|---|
| DONE | 42 | Completed tasks across completed and active projects |
| IN_PROGRESS | 15 | Currently being worked on |
| TODO | 43 | Queued and prioritized |

### Priority Distribution

| Priority | Count | Description |
|---|---|---|
| High (due < 14 days) | ~12 | Tasks due within next 2 weeks |
| Medium (due 14-30 days) | ~28 | Tasks due within the month |
| Low (due > 30 days) | ~60 | Future milestones |

### Assignee Distribution

| Assignee | Active Tasks | Completed Tasks | Total |
|---|---|---|---|
| Sarah Chen | 10 | 12 | 22 |
| Mike Chen | 14 | 14 | 28 |
| Emma Torres | 10 | 12 | 22 |
| Alex Rivera | 6 | 6 | 12 |
| Unassigned | 8 | 0 | 8 |

### Sample Task Detail

**Task:** High-fidelity mockups (Figma)
- **Project:** SaaS Dashboard Redesign (NorthStar Ventures)
- **Assignee:** Emma Torres
- **Status:** IN_PROGRESS
- **Due:** ~Jun 24 (2 weeks from now)
- **Description:** Creating pixel-perfect mockups for the dashboard redesign including metrics grid, charts, navigation, and settings panels. Coordinating with Mike on component feasibility.

**Task:** Deal flow pipeline Kanban board
- **Project:** Investor CRM Integration (NorthStar Ventures)
- **Assignee:** Mike Chen
- **Status:** IN_PROGRESS
- **Due:** ~Jun 29
- **Description:** Implementing drag-and-drop Kanban board using dnd-kit. Building deal pipeline state machine with column transitions.

**Task:** Custom report builder with drag-and-drop
- **Project:** Analytics Dashboard (NovaTech Solutions)
- **Assignee:** Sarah Chen
- **Status:** TODO (upcoming)
- **Due:** ~Jul 14
- **Description:** Building the custom report builder UI with drag-and-drop widget placement, query builder interface, and export pipeline.

### Task Status Flow Representation

```
TODO (43) ──→ IN_PROGRESS (15) ──→ DONE (42)
   ↑                                    │
   └────────── (re-open) ───────────────┘
```

---

## 6. Demo Time Entries

### 60 Time Entries — Summary

#### By Status

| Status | Count | Total Hours | Total Billable |
|---|---|---|---|
| APPROVED | 22 | 81.0 | $10,530 |
| SUBMITTED | 14 | 44.0 | $5,260 |
| DRAFT | 24 | 67.0 | $7,440 |
| **Total** | **60** | **192.0** | **$23,230** |

#### By User

| User | Entries | Approved Hrs | Submitted Hrs | Draft Hrs | Total Hrs | Billable Value |
|---|---|---|---|---|---|---|
| Mike Chen | 18 | 32.0 | 13.0 | 25.5 | 70.5 | $8,813 |
| Emma Torres | 16 | 37.5 | 10.5 | 8.5 | 56.5 | $6,215 |
| Sarah Chen | 16 | 17.0 | 13.5 | 13.0 | 43.5 | $5,998 |
| Alex Rivera | 10 | 8.5 | 7.0 | 1.0 | 16.5 | $2,063 |
| **Total** | **60** | **95.0** | **44.0** | **48.0** | **187.0** | **$23,089** |

#### By Project (Top Billable)

| Project | Approved Hrs | Submitted Hrs | Draft Hrs | Total Hrs | Billable Value |
|---|---|---|---|---|---|
| SaaS Dashboard Redesign | 21.0 | 0 | 5.5 | 26.5 | $3,975 |
| Investor CRM Integration | 13.0 | 0 | 0 | 13.0 | $1,820 |
| Data API Layer | 10.0 | 0 | 0 | 10.0 | $1,600 |
| Analytics Dashboard | 10.5 | 0 | 0 | 10.5 | $1,523 |
| Class Booking System | 8.0 | 0 | 0 | 8.0 | $920 |
| E-Commerce Platform | 4.0 | 3.0 | 4.0 | 11.0 | $1,320 |
| Brand Refresh | 12.0 | 5.0 | 0 | 17.0 | $1,870 |

### Utilization Metrics

| User | Available Hrs (2 weeks) | Logged Hrs | Utilization Rate |
|---|---|---|---|
| Mike Chen | 80 | 70.5 | 88% |
| Emma Torres | 80 | 56.5 | 71% |
| Sarah Chen | 80 | 43.5 | 54% |
| Alex Rivera | 80 | 16.5 | 21% |

*Note: Alex's lower utilization reflects management overhead (client meetings, task coordination, timesheet review) that is not always logged as billable time.*

### Sample Time Entries (Approved)

| User | Project | Task | Date | Hours | Description | Approved By |
|---|---|---|---|---|---|---|
| Mike Chen | SaaS Dashboard Redesign | High-fidelity mockups | Jun 5 | 4.0 | Implementing metrics grid layout with CSS Grid and responsive breakpoints | Alex Rivera |
| Mike Chen | SaaS Dashboard Redesign | High-fidelity mockups | Jun 6 | 3.5 | Building reusable chart components for dashboard widgets | Alex Rivera |
| Mike Chen | Investor CRM Integration | Deal flow pipeline | Jun 8 | 3.0 | Implementing Kanban board drag-and-drop with dnd-kit | Alex Rivera |
| Emma Torres | SaaS Dashboard Redesign | Wireframes | Jun 1 | 3.0 | Dashboard wireframes — layout exploration and client feedback | Alex Rivera |
| Emma Torres | SaaS Dashboard Redesign | High-fidelity mockups | Jun 2 | 6.0 | High-fidelity mockups in Figma — metrics grid, charts, navigation | Alex Rivera |
| Sarah Chen | Analytics Dashboard | Widget system | Jun 5 | 4.0 | Dashboard widget system architecture and component design | Alex Rivera |

---

## 7. Demo Invoices

### 12 Invoices — Summary

#### By Status

| Status | Count | Total Amount |
|---|---|---|
| PAID | 4 | $18,525 |
| SENT | 4 | $9,160 |
| DRAFT | 3 | $11,375 |
| OVERDUE | 1 | $4,800 |
| **Total** | **12** | **$43,860** |

#### Invoice Register

| # | Invoice | Client | Status | Amount | Issued | Due | Paid |
|---|---|---|---|---|---|---|---|
| 1 | INV-2026-001 | NorthStar Ventures | PAID | $5,850.00 | Jan 31 | Feb 28 | Feb 20 |
| 2 | INV-2026-002 | NorthStar Ventures | PAID | $4,200.00 | Mar 15 | Apr 15 | Apr 10 |
| 3 | INV-2026-003 | NorthStar Ventures | SENT | $3,800.00 | Jun 1 | Jun 30 | — |
| 4 | INV-2026-004 | GreenLeaf Health | PAID | $3,300.00 | Mar 20 | Apr 20 | Apr 15 |
| 5 | INV-2026-005 | GreenLeaf Health | OVERDUE | $4,800.00 | May 1 | May 31 | — |
| 6 | INV-2026-006 | NovaTech Solutions | PAID | $2,175.00 | Apr 5 | May 5 | Apr 28 |
| 7 | INV-2026-007 | NovaTech Solutions | DRAFT | $5,800.00 | Jun 10 | Jul 10 | — |
| 8 | INV-2026-008 | Peak Fitness | SENT | $3,450.00 | Apr 1 | May 1 | — |
| 9 | INV-2026-009 | Peak Fitness | DRAFT | $2,875.00 | Jun 15 | Jul 15 | — |
| 10 | INV-2026-010 | Horizon Education | DRAFT | $2,700.00 | Jun 10 | Jul 10 | — |
| 11 | INV-2026-011 | BrightPath Consulting | SENT | $2,200.00 | Jun 1 | Jun 30 | — |
| 12 | INV-2026-012 | Urban Living Co. | SENT | $2,600.00 | Jun 5 | Jul 5 | — |

### Invoice Health Metrics

- **Paid on time:** INV-001, INV-002, INV-004, INV-006 (4 of 4 paid invoices — 100% on-time payment rate)
- **Overdue:** INV-005 (GreenLeaf Health — 13 days overdue, $4,800 outstanding)
- **Due this month:** INV-003 ($3,800 due Jun 30), INV-011 ($2,200 due Jun 30)
- **Due next month:** INV-007 ($5,800), INV-009 ($2,875), INV-010 ($2,700), INV-012 ($2,600)
- **Cash flow:** $18,525 collected, $9,160 in active collection, $11,375 pending finalization

---

## 8. Screenshot Plan

### Screenshot Checklist

A complete set of 15 screenshots that demonstrate FlowDesk's capabilities. Each screenshot should be taken in the Creative Orbit Studio demo workspace using the seeded demo data.

---

### 1. Login Page

| Aspect | Detail |
|---|---|
| **Purpose** | Show professional auth flow with credentials and Google OAuth options |
| **Data Visible** | Email/password form, "Sign in with Google" button, link to signup, forgot password link |
| **State** | Clean login form, no errors |
| **Layout** | Centered card layout with FlowDesk logo, tagline "The operational backbone for your creative business." Teal brand color accent |
| **Recommendation** | Full-page screenshot, 1440×900 |

---

### 2. Dashboard

| Aspect | Detail |
|---|---|
| **Purpose** | Show the workspace overview with KPI cards, recent activity, and upcoming deadlines |
| **Data Visible** | 4 KPI cards (Active Clients: 8, Active Projects: 14, Pending Invoices: $9,160, Team Members: 4), Recent Activity feed (6-8 entries), Upcoming Deadlines (3-4 tasks due within 2 weeks), Quick Actions |
| **State** | Logged in as Sarah Chen (Owner), Creative Orbit Studio workspace |
| **Layout** | Sidebar (collapsed) + top nav + main content grid. KPI cards row at top, activity + deadlines split view below |
| **Recommendation** | Full-page screenshot, show sidebar expanded |

---

### 3. Clients

| Aspect | Detail |
|---|---|
| **Purpose** | Show client CRM list with status badges, search, and quick filters |
| **Data Visible** | 10 client rows in table layout. Columns: Name, Contact, Email, Status (badge: ACTIVE/green, LEAD/yellow, INACTIVE/gray), Projects count, Actions |
| **State** | All clients visible, sorted by name. Search bar visible but empty |
| **Layout** | Table with header row. Status badges use color coding. "Add Client" button top-right |
| **Recommendation** | Full-page screenshot, table view |

---

### 4. Client Detail

| Aspect | Detail |
|---|---|
| **Purpose** | Show single client view with linked projects, contact info, invoice history |
| **Data Visible** | Client name, status badge, contact info (email, phone, company). Projects tab (4 active/completed projects listed). Invoices tab (3 invoices with status). Notes section |
| **State** | Viewing NorthStar Ventures (most data-rich client) |
| **Layout** | Top card with client info, tabs for Projects / Invoices / Files, content below tabs |
| **Recommendation** | Full-page screenshot with Projects tab selected |

---

### 5. Projects

| Aspect | Detail |
|---|---|
| **Purpose** | Show project portfolio with status, budget, deadline, assigned team |
| **Data Visible** | 20 projects in a grid/table. Columns: Project Name, Client, Status (badge), Deadline, Team Members (avatars), Hourly Rate |
| **State** | Active filter selected (showing 14 active projects). Search bar available |
| **Layout** | Kanban-board style or table with filter tabs (All / Active / Completed / Archived) |
| **Recommendation** | Full-page screenshot, Active filter selected |

---

### 6. Project Detail

| Aspect | Detail |
|---|---|
| **Purpose** | Show project management view with task list, team, progress, and files |
| **Data Visible** | Project header (name, client, rate, status, deadline). Task list (6 tasks with assignee avatars, status badges, due dates). Progress indicator. Team members section |
| **State** | Viewing SaaS Dashboard Redesign (most active project with mixed task statuses) |
| **Layout** | Sidebar section (project info) + main area (task list with checkboxes, drag handle, status dropdown) |
| **Recommendation** | Full-page screenshot, show task list expanded |

---

### 7. Tasks

| Aspect | Detail |
|---|---|
| **Purpose** | Show individual task view with details and time tracking |
| **Data Visible** | Task title, description, assignee, status, due date. Time entries linked to this task. Comments/activity |
| **State** | Viewing "High-fidelity mockups (Figma)" task assigned to Emma Torres |
| **Layout** | Task detail panel (slide-over or full page) with all task metadata and time log |
| **Recommendation** | Contextual screenshot showing task detail within the project view |

---

### 8. Time Tracking

| Aspect | Detail |
|---|---|
| **Purpose** | Show time entry log with timer functionality, filters, and approval workflow |
| **Data Visible** | Weekly timesheet view. 12-15 time entries across team members. Columns: User, Project, Task, Hours, Status (DRAFT/SUBMITTED/APPROVED badge). Approve button on SUBMITTED entries. Manual entry form |
| **State** | Logged in as Alex Rivera (Manager) — see SUBMITTED entries awaiting approval. This week's view |
| **Layout** | Table view with date navigation (week arrows). Status badges color-coded. "Add Entry" and "Start Timer" buttons |
| **Recommendation** | Full-page screenshot with week view visible |

---

### 9. Invoices

| Aspect | Detail |
|---|---|
| **Purpose** | Show invoice list with status tracking, amounts, and client info |
| **Data Visible** | 12 invoices in a table. Columns: Invoice #, Client, Status (badge: PAID/green, SENT/blue, DRAFT/gray, OVERDUE/red), Amount, Issued Date, Due Date |
| **State** | All invoices visible, sorted by date descending. Overdue invoice highlighted |
| **Layout** | Table with status badges. Filter tabs or dropdown. "Create Invoice" button |
| **Recommendation** | Full-page screenshot showing the overdue invoice prominently |

---

### 10. Invoice Detail

| Aspect | Detail |
|---|---|
| **Purpose** | Show a professional invoice with line items, client info, and payment status |
| **Data Visible** | Invoice header (INV-2026-001, status: PAID). Client billing info. 3 line items (description, qty, unit price, amount). Subtotal, total. Paid date. Notes |
| **State** | Viewing INV-2026-001 (PAID — NorthStar Ventures). Clean, professional invoice layout |
| **Layout** | Print-style invoice layout on screen. Gray background with white card. Styled like a real invoice document |
| **Recommendation** | Centered card layout, simulate what a PDF export would look like |

---

### 11. Analytics

| Aspect | Detail |
|---|---|
| **Purpose** | Show business intelligence dashboard with charts and KPIs |
| **Data Visible** | Revenue Trend (line chart, last 6 months), Hours Tracked (bar chart, by user), Invoice Status (pie/donut chart), Project Status (bar chart), Team Utilization (table), Top Clients (table by revenue) |
| **State** | All charts populated with live demo data. Time range: Last 6 months. Current month has partial data |
| **Layout** | Grid layout — KPI cards on top, charts in 2-column grid below, tables in full-width rows at bottom |
| **Recommendation** | Full-page screenshot. Ideally a tall screenshot showing all analytics components. May need 2 screenshots (top half charts, bottom half tables) |

---

### 12. Notifications

| Aspect | Detail |
|---|---|
| **Purpose** | Show the notification dropdown with recent activity and real-time updates |
| **Data Visible** | 8-10 notifications of mixed types (TASK_ASSIGNED, INVOICE_PAID, TIME_ENTRY_APPROVED, PROJECT_COMPLETED, CLIENT_CREATED). Each shows icon, title, message, relative time |
| **State** | Notification bell icon clicked, dropdown open. 5 unread, 5 read. Logged in as Sarah Chen |
| **Layout** | Dropdown panel from top nav bell icon. Notifications grouped with unread highlighted. "Mark all as read" link |
| **Recommendation** | Screenshot of the open dropdown with visible overlay/backdrop |

---

### 13. Client Portal

| Aspect | Detail |
|---|---|
| **Purpose** | Show the client-facing portal view (limited, read-only) |
| **Data Visible** | Dashboard: Welcome James Wilson. Project summary (NorthStar Ventures). Active projects with progress. Recent invoices with status. No team data visible |
| **State** | Logged in as James Wilson (client@northstarventures.com). Minimalist portal layout |
| **Layout** | Simple card-based dashboard. Clean, limited navigation (Dashboard, Projects, Invoices). Company branding |
| **Recommendation** | Full-page screenshot showing the client portal dashboard |

---

### 14. File Management

| Aspect | Detail |
|---|---|
| **Purpose** | Show file upload and management within a project context |
| **Data Visible** | File list with name, size, type icon, upload date, uploaded by. Upload button with drag-and-drop zone |
| **State** | Viewing project files for SaaS Dashboard Redesign. 4-5 sample files (design mockups, specs, research docs) |
| **Layout** | File list table with icon previews. Upload zone at top. Filter by file type |
| **Recommendation** | Section screenshot within a project detail page |

---

### 15. Subscription Billing

| Aspect | Detail |
|---|---|
| **Purpose** | Show the billing/settings page with plan info and team management |
| **Data Visible** | Current plan (PRO), status (ACTIVE), next billing date, price ($19/mo). Usage stats (4 of 5 team members). Payment method summary. Plan upgrade options (compare FREE / PRO / AGENCY). Billing history |
| **State** | Viewing as Sarah Chen (Owner). PRO plan active. Credit card ending in 4242 |
| **Layout** | Settings layout with Billing tab. Plan card at top, usage below, upgrade CTA, billing history table |
| **Recommendation** | Full-page screenshot of the billing section in settings |

---

### Screenshot Naming Convention

```
flowdesk-screenshot-01-login.png
flowdesk-screenshot-02-dashboard.png
flowdesk-screenshot-03-clients.png
flowdesk-screenshot-04-client-detail.png
flowdesk-screenshot-05-projects.png
flowdesk-screenshot-06-project-detail.png
flowdesk-screenshot-07-tasks.png
flowdesk-screenshot-08-time-tracking.png
flowdesk-screenshot-09-invoices.png
flowdesk-screenshot-10-invoice-detail.png
flowdesk-screenshot-11-analytics.png
flowdesk-screenshot-12-notifications.png
flowdesk-screenshot-13-client-portal.png
flowdesk-screenshot-14-files.png
flowdesk-screenshot-15-billing.png
```

---

## 9. Video Walkthrough Script

### FlowDesk — 4-Minute Product Walkthrough

**Tone:** Professional, confident, conversational. Show, don't tell.
**Narrator:** Sarah Chen (demo persona) or generic product voice.
**Format:** Screen recording with voiceover. 1080p. Clean cursor movements.

---

### Scene 1: Introduction (0:00–0:20)

**Visual:** FlowDesk landing page → fade to login screen

**Narration:**
> "Meet FlowDesk. It's the operational backbone for creative agencies and independent knowledge workers. I'm Sarah — I run Creative Orbit Studio, a design and development agency in New York. Before FlowDesk, we juggled Asana for tasks, Harvest for time, FreshBooks for invoices, and a spreadsheet for clients. Now we use one tool. Let me show you how it works."

---

### Scene 2: Login & Workspace (0:20–0:45)

**Visual:** Type email → password → click Sign In → dashboard loads

**Narration:**
> "I log in with my team credentials. Every workspace is isolated — our data, our clients, our projects. No cross-contamination. The dashboard greets me with a real-time snapshot: we've got 8 active clients, 14 projects in flight, about nine thousand dollars in pending invoices, and a team of four."

**Key features to highlight on screen:**
- Clean login form with Google OAuth option
- Dashboard loading with KPI cards appearing
- Sidebar navigation with all sections

---

### Scene 3: Client Management (0:45–1:15)

**Visual:** Navigate to Clients → click NorthStar Ventures → show detail

**Narration:**
> "Client management is straightforward. We have ten clients — some active, some leads, one on pause. Each client has a full profile with contact info, status tracking, linked projects, and invoice history. NorthStar Ventures is our biggest client — they're a VC firm with four ongoing projects. Their portal user, James, can log in and see project progress without ever needing to email us."

**Key features to highlight on screen:**
- Client list with status badges (ACTIVE/LEAD/INACTIVE)
- Client detail with tabs (Projects, Invoices, Files)
- Note the portal access for James Wilson

---

### Scene 4: Project Management (1:15–1:50)

**Visual:** Navigate to Projects → click SaaS Dashboard Redesign → show tasks

**Narration:**
> "Projects live under clients. Each project tracks the hourly rate, deadline, budget, and team. Take the SaaS Dashboard Redesign for NorthStar — we're mid-build. Emma is finishing high-fidelity mockups, Mike is building the metrics grid, and I'm handling architecture. Each task has an assignee, a due date, and a status. Drag and drop to reorder priorities. It's project management that actually matches how we work."

**Key features to highlight on screen:**
- Projects list with status filters
- Project detail showing all metadata
- Task list with assignee avatars, status badges, checkboxes

---

### Scene 5: Time Tracking (1:50–2:20)

**Visual:** Navigate to Time → show timesheet → show timer → approve entry

**Narration:**
> "Time tracking is built in — no separate app needed. Mike can start a timer from his browser, or log time manually against any task. As the manager, Alex reviews submissions and approves them with one click. The approval workflow prevents self-approval, so there's accountability. Every approved hour feeds directly into invoices — no data re-entry, no spreadsheets, no surprises."

**Key features to highlight on screen:**
- Weekly timesheet with entries grouped by user
- Status badges: DRAFT (gray), SUBMITTED (yellow), APPROVED (green)
- Approve button on SUBMITTED entries
- Brief glimpse of the timer running

---

### Scene 6: Invoicing (2:20–2:55)

**Visual:** Navigate to Invoices → click INV-2026-001 → show detail

**Narration:**
> "Invoices are generated from approved time entries. Here's a paid invoice from NorthStar — three line items pulled directly from logged hours. We can see when it was issued, when it was paid, and the full breakdown. Overdue invoices are flagged in red, so nothing falls through the cracks. And when a client pays, the whole team gets a notification."

**Key features to highlight on screen:**
- Invoice list with color-coded status badges
- Invoice detail showing line items, totals, payment info
- Note the PAID status and paid date

---

### Scene 7: Analytics (2:55–3:25)

**Visual:** Navigate to Analytics → scroll through charts and tables

**Narration:**
> "The analytics dashboard gives us the bird's-eye view. Revenue trends over time, hours tracked by team member, invoice status distribution — all live. I can see which clients are most profitable, which projects are on track, and who on the team has capacity. This data used to take me an afternoon to compile in Excel. Now it updates in real time."

**Key features to highlight on screen:**
- Revenue Trend chart (line)
- Hours Tracked (bar chart by user)
- Invoice Status (donut chart)
- Top Clients table
- Team Utilization table

---

### Scene 8: Client Portal (3:25–3:45)

**Visual:** Log out → log in as James Wilson (client@northstarventures.com) → show portal

**Narration:**
> "Clients don't need to email us for updates. James at NorthStar logs into his own portal and sees exactly what's relevant to him — his projects, their progress, and his invoices. No team information, no internal data, no confusion. It's secure, it's read-only, and it keeps everyone on the same page."

**Key features to highlight on screen:**
- Client portal login
- Simplified dashboard showing only NorthStar Ventures data
- Project cards with progress
- Invoice list with status

---

### Scene 9: Closing (3:45–4:00)

**Visual:** Return to dashboard → fade to logo

**Narration:**
> "That's FlowDesk in four minutes. One workspace. One source of truth. No more context switching between five different tools. If you run a services business — whether it's just you or a team of twenty — this is how you keep everything in orbit."

**On screen:** FlowDesk logo + URL + "Start your free trial" CTA

---

## 10. Portfolio Case Study

### FlowDesk — SaaS for Agency Operations

---

### Project Overview

| Aspect | Detail |
|---|---|
| **Product** | FlowDesk — Multi-tenant SaaS for freelance and agency operations |
| **Role** | Product Designer & Full-Stack Developer |
| **Timeline** | 6 months (MVP through production) |
| **Team** | Solo founder + contract designers |
| **Status** | Live with demo workspace at creative-orbit.flowdesk.app |

FlowDesk is a production-grade SaaS application that replaces the patchwork of invoicing, CRM, project management, and time-tracking tools with a single unified workspace. The product targets freelancers and small-to-mid-size agencies (2–25 people) who sell their time and expertise.

---

### Problem

Independent knowledge workers and small agencies face a fragmented tool ecosystem:

1. **Context switching costs:** Juggling 4–6 separate tools (Asana, Harvest, FreshBooks, HubSpot, Google Drive) costs 30+ minutes per person per day in switching overhead.
2. **Data silos:** Time entries live in one app, invoices in another, project status in a third. No integration means manual reconciliation every billing cycle.
3. **No unified client view:** Client communication is scattered across email, project updates, and invoicing. No single place to see a client's full relationship.
4. **Scaling pain:** Going from solo to team means upgrading tools — losing data in the migration. Most tools price per seat, making team expansion expensive.
5. **No client portal:** Agencies resend status updates manually. Clients email for basic information that should be self-service.

The market is underserved: existing tools are either too simple (Wave), too enterprise (Salesforce), or too niche (Harvest for time only). No product serves the full workflow in one place.

---

### Solution

FlowDesk provides a single, unified workspace with five core modules:

1. **Client CRM** — Contact management, status pipeline (lead → active → inactive → archived), notes, linked projects and invoices
2. **Project Management** — Projects nested under clients, task lists with assignees and due dates, drag-and-drop reordering
3. **Time Tracking** — Built-in timer, manual entry, timesheet approval workflow, weekly view
4. **Invoicing** — Invoice generation from time entries, line-item breakdown, status tracking (draft → sent → paid → overdue)
5. **Client Portal** — Secure read-only portal per client showing their projects and invoices

The product wraps these modules with:
- Multi-tenant isolation (every entity scoped by workspace)
- Role-based access control (OWNER, MANAGER, TEAM_MEMBER, CLIENT)
- Team collaboration (invites, notifications, activity feed)
- Business analytics (revenue trends, utilization, project profitability)
- File management per project

---

### Architecture

#### Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5.6 |
| **Database ORM** | Prisma 6.0 with PostgreSQL |
| **Authentication** | Auth.js v5 (NextAuth) — Credentials + Google OAuth |
| **Styling** | Tailwind CSS 4 + shadcn/ui (Radix primitives) |
| **Charts** | Recharts 3.8 |
| **File Upload** | UploadThing 7.7 |
| **Payments** | Stripe 22.2 |
| **Email** | Resend 6.12 with transactional templates |
| **Monitoring** | Sentry 10.57 |
| **Validation** | Zod 4.4 |
| **Icons** | Lucide React |
| **Theme** | next-themes (light/dark mode) |

#### Architecture Decisions

1. **Feature-based directory structure** — Each domain (clients, projects, invoices, etc.) is a self-contained module with server actions, queries, schemas, and components
2. **Server Actions for all mutations** — No REST API layer for internal operations. Server Actions handle all data mutations with direct Prisma access
3. **React Server Components for data fetching** — Pages fetch data directly in the component using server queries. No client-side data fetching library needed
4. **Workspace-scoped multi-tenancy** — Every entity carries a `workspaceId`. Prisma middleware auto-injects the workspace filter for all queries. Row-level security prevents cross-tenant data access
5. **Route groups for layout isolation** — Auth pages, marketing pages, workspace pages, and client portal each have independent layouts
6. **Subdomain-based client portal** — Portal routes (`/portal/*`) rewrites for client subdomain access with separate layout
7. **Single unified User model** — Both team members and client portal users share one `User` table with a `userType` discriminator. Simplifies auth while maintaining separation via RBAC
8. **Soft delete architecture** — Financial and client data uses soft-delete (`deletedAt` timestamp) to prevent accidental data loss. Cascade deletes use RESTRICT on financial relationships
9. **Composite indexes on workspace lookups** — All queries filter by `workspaceId` first, with indexes on `[workspaceId, field]` for performance

#### Route Structure

```
/                          → Marketing landing page
/login                     → Authentication
/signup                    → Registration
/[workspaceSlug]/dashboard → Workspace dashboard
/[workspaceSlug]/clients   → Client CRM
/[workspaceSlug]/projects  → Project management
/[workspaceSlug]/time      → Time tracking
/[workspaceSlug]/invoices  → Invoicing
/[workspaceSlug]/analytics → Business analytics
/[workspaceSlug]/settings  → Workspace settings & billing
/portal/*                  → Client portal (subdomain)
```

---

### Features

#### Multi-Tenancy

Every workspace is fully isolated. Tenants share the same application code and database instance, but query filters ensure no data leaks between workspaces. The Prisma middleware automatically appends `workspaceId` to all queries. Each workspace gets:
- Its own subdomain-style URL (`/creative-orbit/dashboard`)
- Isolated client, project, time, and invoice data
- Independent branding (colors, company info)
- Separate subscription and billing

#### Role-Based Access Control (RBAC)

Four roles with granular permissions:

| Role | Scope | Key Permissions |
|---|---|---|
| **OWNER** | Full workspace | Manage billing, invite team, delete workspace, full CRUD all entities |
| **MANAGER** | Operations | Full CRUD on clients/projects/tasks, approve timesheets, view reports |
| **TEAM_MEMBER** | Own scope | Log time, manage own tasks, view assigned projects |
| **CLIENT** | Portal only | Read-only view of own projects and invoices |

Permission enforcement happens at three levels:
1. **Middleware** — Route access checks
2. **Server Actions** — Permission assertions before mutations
3. **Database queries** — `workspaceId` scoping prevents cross-tenant access

#### Authentication

- Email/password with bcrypt hashing
- Google OAuth integration
- Session-based JWT with PrismaAdapter
- Rate limiting on auth endpoints (5 attempts per minute)
- Forgot/reset password flow with email delivery
- Team invite flow with token-based acceptance

#### Analytics Dashboard

Seven visualization components:

1. **Revenue Trend** — Line chart showing monthly revenue over selected period
2. **Hours Tracked** — Bar chart comparing billable hours by team member
3. **Invoice Status** — Donut chart showing PAID vs SENT vs OVERDUE vs DRAFT distribution
4. **Project Status** — Bar chart of projects by status (ACTIVE, COMPLETED, ARCHIVED)
5. **Team Utilization** — Table showing logged hours vs available hours per member
6. **Top Clients** — Table of clients ranked by total revenue
7. **KPI Cards** — Active projects, pending invoices, team members, overdue invoices

All charts use Recharts with responsive containers and are built as server-rendered React components.

#### Subscription & Billing (Stripe)

Three-tier pricing with Stripe integration:

| Plan | Price | Limits |
|---|---|---|
| FREE | $0 | 1 user, 5 clients, 3 active projects |
| PRO | $19/mo | 5 team members, unlimited clients/projects |
| AGENCY | $49/mo | Unlimited team members, priority support |

Features: Stripe Checkout for new subscriptions, Customer Portal for plan management, webhook handling for lifecycle events (trialing, active, past_due, canceled, expired), automatic billing period tracking.

#### Client Portal

Each client with portal access gets:
- Read-only dashboard showing their projects and invoices
- Project detail view with task progress
- Invoice list with status and amounts
- No visibility into other clients, team members, or internal data
- Clean, simplified UI separate from workspace navigation

#### Notifications

Five notification types delivered in-app:
- TASK_ASSIGNED — When a task is assigned
- PROJECT_COMPLETED — When a project is marked done
- INVOICE_PAID — When an invoice payment is received
- TIME_ENTRY_APPROVED — When a time entry is approved
- CLIENT_CREATED — When a new client is added

Notifications appear in a dropdown in the top navigation bar with read/unread state.

---

### Technical Challenges

#### Challenge 1: Multi-Tenant Data Isolation

**Problem:** Ensuring that User A from Workspace A cannot access User B's data from Workspace B, even through direct API calls or URL manipulation.

**Solution:** Three-layer isolation:
1. **Database layer:** Every entity has a `workspaceId` column. Prisma middleware automatically injects `where: { workspaceId }` on all queries based on the authenticated user's workspace
2. **Application layer:** Route handlers and server actions use `createWorkspaceContext()` to assert the user belongs to the requested workspace before any operation
3. **Presentation layer:** The workspace layout determines which data is fetched based on the URL slug `[workspaceSlug]`, which is validated against the session

**Result:** Zero data leaks between workspaces. A user in creative-orbit literally cannot query data from another workspace at any layer.

#### Challenge 2: Unified Auth for Team + Client Users

**Problem:** Team members and clients have fundamentally different needs (full CRUD vs read-only portal), but maintaining separate auth systems adds complexity.

**Solution:** Single `User` model with `userType` discriminator (`TEAM` | `CLIENT`). The middleware checks `userType` to route clients to the portal and team members to the workspace. RBAC permissions handle the rest — a CLIENT user literally cannot access any workspace route.

**Result:** One login flow, one auth system, one session model. The discriminator pattern avoids dual-auth complexity while maintaining complete separation of concerns.

#### Challenge 3: Time Entry Approval Workflow

**Problem:** Managers need to approve or reject time entries, but must not be able to self-approve. Entries need distinct statuses (DRAFT → SUBMITTED → APPROVED/REJECTED) with audit trail.

**Solution:** Enforce no-self-approval at three levels:
1. **UI:** Approve button hidden on own entries
2. **Server Action** `assertNoSelfApproval()` — throws if approver matches entry creator
3. **Database constraint** — `approvedById` and `userId` are separate fields, validated on write

**Result:** Complete audit trail — every approved entry records who approved it and when. Zero possibility of self-approval at any layer.

#### Challenge 4: Financial Data Integrity

**Problem:** Invoices reference time entries. Projects reference clients. Cascade deletes could destroy financial records. But soft-delete complicates queries.

**Solution:** Use `RESTRICT` on financial foreign key relationships (Invoice → Client, TimeEntry → Project). Use soft-delete with `deletedAt` timestamp on all entities. Application-level filters exclude soft-deleted records from default queries but allow admins to view them.

**Result:** Financial data is permanent. Accidentally deleting a client marks it as inactive without destroying invoice history. Full data recovery possible.

#### Challenge 5: Realistic Seed Data for Demos

**Problem:** Demo environments need enough data to look real but not so much that it's overwhelming. The data must exercise every feature and edge case.

**Solution:** A comprehensive seed script generates:
- 1 workspace with branding and subscription
- 4 team users + 1 client user with realistic personas
- 10 clients with mixed statuses and detailed notes
- 20 projects with budgets, deadlines, and descriptions
- 100 tasks distributed across projects with varied assignees and statuses
- 60 time entries with approval workflow states
- 12 invoices with line items and mixed payment statuses
- 20 notifications of all types

All data is interconnected — tasks link to projects, time entries link to tasks and projects, invoices reference time entries. The seed prints a login banner when run.

---

### Results

#### Business Impact

| Metric | Value |
|---|---|
| **Development time** | 6 months to MVP |
| **Lines of code** | ~15,000 TypeScript |
| **Database models** | 22 |
| **API routes** | 5 (auth, upload, notifications, files, webhooks) |
| **Server actions** | 50+ across 13 feature modules |
| **Components** | 30+ reusable UI + feature components |

#### Product Outcomes

- **Single source of truth:** Replaces 4+ separate tools with one unified workspace
- **Reduced context switching:** All operations — clients, projects, time, invoices — in one interface
- **Professional client experience:** Portal gives clients self-service access to project status and invoices
- **Data-driven operations:** Analytics dashboard provides real-time visibility into revenue, utilization, and project health
- **Scalable architecture:** Multi-tenant design supports unlimited workspaces with complete data isolation

#### Architecture Quality

- **Security:** Three-layer permission enforcement (middleware, server actions, database), rate-limited auth, no-self-approval constraint, soft-delete data protection
- **Performance:** React Server Components for minimal client JavaScript, Prisma queries with composite indexes, responsive charts
- **Maintainability:** Feature-based directory structure, type-safe server actions, Zod validation on all inputs, comprehensive RBAC matrix
- **Testability:** Seed script creates reproducible demo state, isolated feature modules enable unit testing

---

## 11. Analytics Dashboard Data Strategy

### Ensuring Meaningful Financial Data

The analytics dashboard must show data that looks like a real agency's metrics. Here is the data strategy for each chart:

#### Revenue Trend (Line Chart)

| Month | Revenue | Data Source |
|---|---|---|
| Jan 2026 | $5,850 | INV-2026-001 (paid) |
| Feb 2026 | $2,700 | Feb time entries + partial milestone |
| Mar 2026 | $7,500 | INV-2026-002 ($4,200) + INV-2026-004 ($3,300) |
| Apr 2026 | $5,625 | INV-2026-006 ($2,175) + hourly work ($3,450) |
| May 2026 | $4,800 | Overdue INV-2026-005 |
| Jun 2026 | $8,200 | Current month (partial — INV-2026-003 sent $3,800 + ongoing hourly) |

**Pattern:** Shows organic growth from $5.8K to projected $8.2K over 6 months. Typical agency ramp-up curve.

#### Hours Tracked (Bar Chart)

| User | This Week | Last Week | 4-Week Avg |
|---|---|---|---|
| Mike Chen | 32.0 | 28.5 | 30.2 |
| Emma Torres | 24.0 | 22.0 | 23.0 |
| Sarah Chen | 18.5 | 16.0 | 17.2 |
| Alex Rivera | 6.0 | 5.5 | 5.8 |

**Pattern:** Mike has highest utilization (developer), Alex lowest (manager with non-billable hours). Realistic distribution.

#### Invoice Status (Donut Chart)

| Status | Amount | % of Total |
|---|---|---|
| PAID | $18,525 | 42% |
| SENT | $9,160 | 21% |
| DRAFT | $11,375 | 26% |
| OVERDUE | $4,800 | 11% |

**Pattern:** Healthy majority paid/sent (63%). Drafts represent work in progress (expected). Single overdue invoice is realistic for agency operations.

#### Team Utilization (Table)

| User | Billable Hrs | Available Hrs | Utilization |
|---|---|---|---|
| Mike Chen | 70.5 | 88 | 80% |
| Emma Torres | 56.5 | 88 | 64% |
| Sarah Chen | 43.5 | 88 | 49% |
| Alex Rivera | 16.5 | 88 | 19% |

**Note:** Utilization rates are computed from logged entries in the current billing period. Target utilization for agencies is 60-80% for billable roles. Sarah and Alex's lower rates reflect management/creative director overhead.

---

## Appendix: Data Integrity Rules

1. **All monetary values** must be consistent: invoice totals must match sum of line items
2. **All foreign key references** must be valid — no orphan records
3. **Task statuses** must be valid transitions (TODO ↔ IN_PROGRESS, IN_PROGRESS → DONE)
4. **Time entry durations** must be positive and reasonable (< 16 hours per entry)
5. **Invoice due dates** must be after issued dates
6. **Approved time entries** must have `approvedById` and `approvedAt` populated
7. **No self-approved time entries** — approvedById must differ from userId
8. **All PASSWORDS** must be consistent across users for demo convenience
9. **Deleted entities** use soft-delete (`deletedAt`), never hard-delete
10. **Workspace data** must be fully isolated — no cross-workspace references
