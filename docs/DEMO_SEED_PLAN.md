# FlowDesk — Demo Seed Plan

**Context date:** June 13, 2026
**Workspace created:** September 1, 2025
**Seed target:** `prisma/seed.ts`

---

## 1. Entity Map

```
Workspace: Creative Orbit Studio
  ├── WorkspaceSettings (1:1 branding, timezone, company info)
  ├── Subscription (1: PRO plan, active)
  ├── WorkspaceMember (4)
  │   ├── Sarah Chen — OWNER (joined Sep 1, 2025)
  │   ├── Alex Rivera — MANAGER (invited by Sarah, joined Oct 15, 2025)
  │   ├── Mike Chen — TEAM_MEMBER (invited by Alex, joined Nov 1, 2025)
  │   └── Emma Torres — TEAM_MEMBER (invited by Alex, joined Jan 10, 2026)
  ├── User (5)
  │   ├── Sarah Chen (TEAM)
  │   ├── Alex Rivera (TEAM)
  │   ├── Mike Chen (TEAM)
  │   ├── Emma Torres (TEAM)
  │   └── James Wilson (CLIENT)
  ├── Client (10)
  │   ├── NorthStar Ventures [ACTIVE] — 4 projects, 3 invoices, 1 portal user
  │   ├── GreenLeaf Health [ACTIVE] — 3 projects, 2 invoices
  │   ├── NovaTech Solutions [ACTIVE] — 3 projects, 2 invoices
  │   ├── Peak Fitness [ACTIVE] — 3 projects, 2 invoices
  │   ├── Horizon Education [ACTIVE] — 2 projects, 1 invoice
  │   ├── BrightPath Consulting [ACTIVE] — 2 projects, 1 invoice
  │   ├── Urban Living Co. [ACTIVE] — 2 projects, 1 invoice
  │   ├── SkyBridge Finance [LEAD] — 0 projects, 0 invoices
  │   ├── PixelCraft Media [INACTIVE] — 1 project (archived), 0 invoices
  │   └── Quantum Logistics [LEAD] — 0 projects, 0 invoices
  ├── ClientMember (1)
  │   └── NorthStar Ventures → James Wilson
  ├── Project (20)
  │   ├── Active (14)
  │   ├── Completed (5)
  │   └── Archived (1)
  ├── Task (100)
  │   ├── DONE (42)
  │   ├── IN_PROGRESS (15)
  │   └── TODO (43)
  ├── TimeEntry (60)
  │   ├── APPROVED (22)
  │   ├── SUBMITTED (14)
  │   └── DRAFT (24)
  ├── Invoice (12)
  │   ├── PAID (4)
  │   ├── SENT (4)
  │   ├── DRAFT (3)
  │   └── OVERDUE (1)
  ├── InvoiceLineItem (varies per invoice)
  ├── Notification (20)
  │   ├── TASK_ASSIGNED (8)
  │   ├── PROJECT_COMPLETED (3)
  │   ├── INVOICE_PAID (4)
  │   ├── TIME_ENTRY_APPROVED (5)
  │   └── CLIENT_CREATED (1)
  └── Invite (2 — planned but not seeded in current version)
```

---

## 2. Workspace

| Field | Value |
|---|---|
| name | Creative Orbit Studio |
| slug | creative-orbit |
| deletedAt | null |

### WorkspaceSettings

| Field | Value |
|---|---|
| logoUrl | null |
| primaryColor | `#0d9488` (teal) |
| timezone | America/New_York |
| companyName | Creative Orbit Studio LLC |
| companyAddress | 48 W 25th St, New York, NY 10010 |
| companyTaxId | US-88-1234567 |
| theme | `{"darkMode": false, "fontSize": "normal"}` |

### Subscription

| Field | Value |
|---|---|
| plan | PRO |
| status | ACTIVE |
| currentPeriodStart | 2026-06-01 |
| currentPeriodEnd | 2026-07-01 |
| trialEndsAt | null |
| cancelAtPeriodEnd | false |
| stripeSubscriptionId | null |
| stripeCustomerId | null |

---

## 3. Users

All passwords: `password123` (bcrypt hashed)

### Sarah Chen — Owner / Creative Director

| Field | Value |
|---|---|
| name | Sarah Chen |
| email | sarah@creativeorbit.com |
| userType | TEAM |
| passwordHash | bcrypt('password123', 10) |
| avatarUrl | null |

Sarah is the founder. Runs the agency, manages clients, reviews timesheets, sends invoices, and oversees all projects. Joined Sep 1, 2025 as OWNER.

### Alex Rivera — Manager / Project Manager

| Field | Value |
|---|---|
| name | Alex Rivera |
| email | alex@creativeorbit.com |
| userType | TEAM |
| passwordHash | bcrypt('password123', 10) |
| avatarUrl | null |

Alex handles day-to-day client communication, task assignment, timesheet approval. Reports to Sarah. Invited by Sarah on Oct 15, 2025 as MANAGER.

### Mike Chen — Developer / Full-Stack Developer

| Field | Value |
|---|---|
| name | Mike Chen |
| email | mike@creativeorbit.com |
| userType | TEAM |
| passwordHash | bcrypt('password123', 10) |
| avatarUrl | null |

Mike is a full-stack developer. Works on React frontend, Node.js APIs, integrations. Invited by Alex on Nov 1, 2025 as TEAM_MEMBER.

### Emma Torres — Designer / UX/UI Designer

| Field | Value |
|---|---|
| name | Emma Torres |
| email | emma@creativeorbit.com |
| userType | TEAM |
| passwordHash | bcrypt('password123', 10) |
| avatarUrl | null |

Emma is a UX/UI designer. Creates wireframes, mockups, design systems, brand guidelines. Invited by Alex on Jan 10, 2026 as TEAM_MEMBER.

### James Wilson — Client Portal User

| Field | Value |
|---|---|
| name | James Wilson |
| email | client@northstarventures.com |
| userType | CLIENT |
| passwordHash | bcrypt('password123', 10) |
| avatarUrl | null |

James is a Partner at NorthStar Ventures. Uses the client portal to view project progress and invoices. Invited by Sarah on Nov 1, 2025.

---

## 4. WorkspaceMembers

| User | Role | Joined | Invited By |
|---|---|---|---|
| Sarah Chen (sarah@creativeorbit.com) | OWNER | 2025-09-01 | null (self-created) |
| Alex Rivera (alex@creativeorbit.com) | MANAGER | 2025-10-15 | Sarah Chen |
| Mike Chen (mike@creativeorbit.com) | TEAM_MEMBER | 2025-11-01 | Alex Rivera |
| Emma Torres (emma@creativeorbit.com) | TEAM_MEMBER | 2026-01-10 | Alex Rivera |

---

## 5. Clients

### NorthStar Ventures

| Field | Value |
|---|---|
| name | NorthStar Ventures |
| email | james@northstarventures.com |
| phone | (415) 555-0101 |
| company | NorthStar Ventures LLC |
| status | ACTIVE |
| notes | VC firm investing in early-stage SaaS. Our biggest client by revenue. Multiple ongoing projects. |

**Portal user:** James Wilson (client@northstarventures.com)

### GreenLeaf Health

| Field | Value |
|---|---|
| name | GreenLeaf Health |
| email | diana@greenleafhealth.com |
| phone | (212) 555-0202 |
| company | GreenLeaf Health Inc. |
| status | ACTIVE |
| notes | Organic wellness brand expanding nationally. Needs e-commerce and membership platform. |

### NovaTech Solutions

| Field | Value |
|---|---|
| name | NovaTech Solutions |
| email | raj@novatech.io |
| phone | (512) 555-0303 |
| company | NovaTech Solutions Corp |
| status | ACTIVE |
| notes | B2B SaaS company. Building analytics dashboard and customer portal. |

### Peak Fitness

| Field | Value |
|---|---|
| name | Peak Fitness |
| email | marcus@peakfit.com |
| phone | (917) 555-0404 |
| company | Peak Fitness LLC |
| status | ACTIVE |
| notes | Premium gym chain with 5 locations. App and booking system needed. |

### Horizon Education

| Field | Value |
|---|---|
| name | Horizon Education |
| email | lisa@horizonedu.org |
| phone | (617) 555-0505 |
| company | Horizon Education Nonprofit |
| status | ACTIVE |
| notes | EdTech nonprofit building a learning management platform for under-resourced schools. |

### BrightPath Consulting

| Field | Value |
|---|---|
| name | BrightPath Consulting |
| email | tom@brightpathconsult.com |
| phone | (312) 555-0606 |
| company | BrightPath Consulting Group |
| status | ACTIVE |
| notes | Management consulting firm. Needs a modern website and client intake portal. |

### Urban Living Co.

| Field | Value |
|---|---|
| name | Urban Living Co. |
| email | nina@urbanliving.co |
| phone | (646) 555-0707 |
| company | Urban Living Properties |
| status | ACTIVE |
| notes | Real estate developer with luxury residential projects. Needs property showcase site. |

### SkyBridge Finance

| Field | Value |
|---|---|
| name | SkyBridge Finance |
| email | peter@skybridgefin.com |
| phone | (212) 555-0808 |
| company | SkyBridge Financial Services |
| status | LEAD |
| notes | Fintech startup. Early discussions about a client dashboard MVP. |

### PixelCraft Media

| Field | Value |
|---|---|
| name | PixelCraft Media |
| email | zoe@pixelcraftmedia.com |
| phone | (323) 555-0909 |
| company | PixelCraft Media Studio |
| status | INACTIVE |
| notes | Creative agency referral partner. Currently on pause due to internal hiring. |

### Quantum Logistics

| Field | Value |
|---|---|
| name | Quantum Logistics |
| email | vikram@quantumlogistics.com |
| phone | (305) 555-1010 |
| company | Quantum Logistics Inc. |
| status | LEAD |
| notes | Supply chain SaaS startup. Referred by NorthStar Ventures. Initial meeting scheduled. |

---

## 6. ClientMembers

| Client | User | Joined | Invited By |
|---|---|---|---|
| NorthStar Ventures | James Wilson (client@northstarventures.com) | 2025-11-01 | Sarah Chen |

James authenticates via the client portal. He sees:
- NorthStar Ventures — his own client record
- SaaS Dashboard Redesign, Investor CRM, Data API Layer, Marketing Website — projects where his client is the billing party
- Invoices billed to NorthStar Ventures

---

## 7. Projects

### Active (14)

#### NorthStar Ventures (3 active)

| # | Project | Rate | Budget | Start | Due | Team |
|---|---|---|---|---|---|---|
| 1 | SaaS Dashboard Redesign | $150/hr | $24,000 | Jan 15, 2026 | Jul 30, 2026 | Sarah, Mike, Emma, Alex |
| 2 | Investor CRM Integration | $140/hr | $18,000 | Mar 1, 2026 | Aug 15, 2026 | Sarah, Mike, Alex |
| 3 | Data API Layer | $160/hr | $28,000 | Apr 1, 2026 | Sep 30, 2026 | Mike, Alex |

#### GreenLeaf Health (2 active)

| # | Project | Rate | Budget | Start | Due | Team |
|---|---|---|---|---|---|---|
| 4 | E-Commerce Platform | $120/hr | $35,000 | Feb 1, 2026 | Aug 31, 2026 | Mike, Emma, Sarah, Alex |
| 5 | Mobile App MVP | $125/hr | $22,000 | Apr 15, 2026 | Oct 15, 2026 | Mike, Emma, Sarah |

#### NovaTech Solutions (2 active)

| # | Project | Rate | Budget | Start | Due | Team |
|---|---|---|---|---|---|---|
| 6 | Analytics Dashboard | $145/hr | $26,000 | Mar 1, 2026 | Sep 1, 2026 | Sarah, Mike, Alex |
| 7 | Customer Portal MVP | $140/hr | $20,000 | May 1, 2026 | Nov 30, 2026 | Sarah, Mike, Emma, Alex |

#### Peak Fitness (2 active)

| # | Project | Rate | Budget | Start | Due | Team |
|---|---|---|---|---|---|---|
| 8 | Class Booking System | $115/hr | $14,000 | Mar 15, 2026 | Jul 15, 2026 | Mike, Sarah, Alex |
| 9 | Member Mobile App | $125/hr | $20,000 | May 1, 2026 | Oct 30, 2026 | Mike, Emma, Sarah |

#### Other Active Projects (5)

| # | Project | Client | Rate | Budget | Start | Due | Team |
|---|---|---|---|---|---|---|---|
| 10 | Learning Management Platform | Horizon Education | $95/hr | $30,000 | Apr 1, 2026 | Dec 31, 2026 | Sarah, Mike, Alex |
| 11 | Corporate Website | BrightPath Consulting | $110/hr | $12,000 | Apr 1, 2026 | Jul 15, 2026 | Emma, Mike, Alex |
| 12 | Client Intake Portal | BrightPath Consulting | $120/hr | $15,000 | May 15, 2026 | Sep 30, 2026 | Sarah, Mike, Emma, Alex |
| 13 | Property Showcase Site | Urban Living Co. | $130/hr | $16,000 | Apr 15, 2026 | Aug 1, 2026 | Emma, Mike, Sarah, Alex |
| 14 | Interactive Floor Plans | Urban Living Co. | $135/hr | $18,000 | Jun 1, 2026 | Sep 15, 2026 | Mike, Sarah, Alex |

### Completed (5)

| # | Project | Client | Rate | Completed | Team |
|---|---|---|---|---|---|
| 15 | Marketing Website Relaunch | NorthStar Ventures | $130/hr | Feb 28, 2026 | Sarah, Mike, Emma, Alex |
| 16 | Brand Refresh | GreenLeaf Health | $110/hr | Mar 15, 2026 | Emma, Alex |
| 17 | Landing Page Optimization | NovaTech Solutions | $100/hr | Mar 30, 2026 | Mike, Emma, Alex |
| 18 | Brand Identity System | Peak Fitness | $105/hr | Mar 1, 2026 | Emma, Alex |
| 19 | Donor Portal | Horizon Education | $90/hr | May 1, 2026 | Sarah, Mike, Emma, Alex |

### Archived (1)

| # | Project | Client | Rate | Status | Reason |
|---|---|---|---|---|---|
| 20 | Portfolio Website | PixelCraft Media | $100/hr | ARCHIVED | Client restructuring — work paused |

---

## 8. Task Distribution

### By Project

| Project | Tasks | DONE | IN_PROGRESS | TODO | Unassigned |
|---|---|---|---|---|---|
| SaaS Dashboard Redesign | 6 | 2 | 1 | 3 | 1 |
| Investor CRM Integration | 5 | 2 | 1 | 2 | 0 |
| Marketing Website Relaunch | 5 | 5 | 0 | 0 | 0 |
| Data API Layer | 5 | 1 | 1 | 3 | 1 |
| E-Commerce Platform | 6 | 1 | 1 | 4 | 1 |
| Mobile App MVP | 5 | 1 | 1 | 3 | 0 |
| Brand Refresh | 4 | 4 | 0 | 0 | 0 |
| Analytics Dashboard | 6 | 1 | 1 | 4 | 1 |
| Customer Portal MVP | 5 | 1 | 0 | 4 | 0 |
| Landing Page Optimization | 4 | 4 | 0 | 0 | 0 |
| Class Booking System | 6 | 1 | 1 | 4 | 1 |
| Member Mobile App | 5 | 1 | 1 | 3 | 1 |
| Brand Identity System | 3 | 3 | 0 | 0 | 0 |
| Learning Management Platform | 5 | 1 | 1 | 3 | 0 |
| Donor Portal | 4 | 4 | 0 | 0 | 0 |
| Corporate Website | 5 | 1 | 1 | 3 | 0 |
| Client Intake Portal | 4 | 1 | 1 | 2 | 0 |
| Property Showcase Site | 5 | 1 | 1 | 3 | 1 |
| Interactive Floor Plans | 4 | 0 | 1 | 3 | 0 |
| Portfolio Website | 3 | 3 | 0 | 0 | 0 |

### By Assignee

| User | Tasks | DONE | IN_PROGRESS | TODO |
|---|---|---|---|---|
| Sarah Chen | 22 | 11 | 3 | 8 |
| Mike Chen | 28 | 13 | 8 | 7 |
| Emma Torres | 22 | 11 | 3 | 8 |
| Alex Rivera | 12 | 5 | 1 | 6 |
| Unassigned | 8 | 0 | 0 | 8 |

### Task Generation Rules

1. Each active/completed project gets 3-6 tasks
2. Archived project (Portfolio Website) gets 3 completed tasks
3. Task status distribution: ~42% DONE, ~15% IN_PROGRESS, ~43% TODO
4. Due dates are based on project start date + offset (days)
5. Sort order has gaps for future insertion (1, 2, 3... or floats)
6. 8 tasks deliberately unassigned to show open assignments
7. Tasks reference real development/design work descriptions
8. Completed projects have all tasks marked DONE
9. Active projects have mix: some DONE, some IN_PROGRESS, some TODO

---

## 9. Time Entry Generation

### By User & Status

| User | Total | APPROVED | SUBMITTED | DRAFT | Est. Value |
|---|---|---|---|---|---|
| Mike Chen | 18 | 8 | 4 | 6 | ~$8,813 |
| Emma Torres | 16 | 9 | 3 | 4 | ~$6,215 |
| Sarah Chen | 16 | 7 | 5 | 4 | ~$5,998 |
| Alex Rivera | 10 | 4 | 4 | 2 | ~$2,063 |
| **Total** | **60** | **28** | **16** | **16** | **~$23,089** |

### Time Entry Generation Rules

1. Each entry includes: userId, projectId, taskId (optional), date, start time, duration (hours), description, status
2. Approved entries must include approvedById and approvedAt
3. Alex Rivera is the only approver (Manager role)
4. No self-approved entries — Alex's entries are approved by Sarah or left as SUBMITTED
5. Duration range: 1.0–6.0 hours per entry (realistic for focused work)
6. Dates: June 1–26, 2026 (current month for demo relevance)
7. Descriptions are specific to the task and project (not generic)
8. Approximately 45% of entries link to a specific taskId
9. Status distribution: APPROVED 37%, SUBMITTED 23%, DRAFT 40%
10. DRAFT entries represent time still being edited or timer still running

### Sample Entry Generation Pattern

```
For each user in [mike, emma, sarah, alex]:
  For each assigned task that is IN_PROGRESS or DONE:
    If random() < 0.6:  // 60% chance of having time logged
      Create 1-3 time entries
      Duration: randInt(2, 6) hours
      Status: weighted random (APPROVED 40%, SUBMITTED 30%, DRAFT 30%)
```

---

## 10. Invoice Generation

### Invoice Register

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

### Invoice Generation Rules

1. PAID invoices (4): oldest invoices, already collected revenue
2. SENT invoices (4): currently awaiting payment, due this month or next
3. DRAFT invoices (3): work completed but not yet sent to client
4. OVERDUE invoices (1): past due date, flagged for follow-up
5. Line items: 2-3 per invoice, with description, quantity (usually hours), unit price (project rate), and calculated amount
6. Invoice numbers: sequential with year prefix (`INV-YYYY-NNN`)
7. Status over time: DRAFT → SENT → PAID or OVERDUE
8. Paid invoices include paidAt date (typically within 30 days of due date for reliable clients, or early for prompt payers)

### Line Item Generation

Each invoice has 2-3 line items:

```
For each invoice:
  Select 2-3 milestones or task categories from the project
  For each line item:
    description: Clear, professional milestone description
    quantity: hours worked (range 5-20 hours)
    unitPrice: project's hourlyRate
    amount: quantity × unitPrice
    sortOrder: 1, 2, 3...
```

---

## 11. Notification Generation

### Notification Types

| Type | Count | Description |
|---|---|---|
| TASK_ASSIGNED | 8 | Task assigned to user |
| PROJECT_COMPLETED | 3 | Project marked complete |
| INVOICE_PAID | 4 | Invoice payment received |
| TIME_ENTRY_APPROVED | 5 | Time entry approved by manager |
| CLIENT_CREATED | 1 | New client added to workspace |

### Notification Distribution

| User | Notifications |
|---|---|
| Sarah Chen | 4 |
| Alex Rivera | 5 |
| Mike Chen | 6 |
| Emma Torres | 5 |

### Generation Rules

1. Each notification has: userId, type, title, message, link, createdAt
2. Links point to relevant workspace routes (`/creative-orbit/projects/{id}`, etc.)
3. Created dates: June 1-12, 2026 (past 2 weeks)
4. Messages are specific and mention amounts, project names, user names
5. No duplicate notifications for the same event

---

## 12. Seeding Order

The seed must follow this order to satisfy foreign key constraints:

```
1. Workspace
2. WorkspaceSettings (depends on: workspace)
3. Subscription (depends on: workspace)
4. User (independent)
5. WorkspaceMember (depends on: workspace, user)
6. Client (depends on: workspace)
7. ClientMember (depends on: client, user, workspace)
8. Project (depends on: workspace, client)
9. Task (depends on: project, user)
10. TimeEntry (depends on: workspace, user, project, task)
11. Invoice (depends on: workspace, client)
12. InvoiceLineItem (depends on: invoice)
13. Notification (depends on: workspace, user)
```

---

## 13. Enum Coverage

| Enum | Values in Seed | Coverage |
|---|---|---|
| UserType | TEAM (4), CLIENT (1) | 2/2 100% |
| WorkspaceRole | OWNER, MANAGER, TEAM_MEMBER | 3/3 100% |
| Plan | PRO | 1/3 (only PRO for demo) |
| SubscriptionStatus | ACTIVE | 1/5 (healthy demo state) |
| ClientStatus | ACTIVE (7), LEAD (2), INACTIVE (1) | 3/4 (ARCHIVED not exercised at client level) |
| ProjectStatus | ACTIVE (14), COMPLETED (5), ARCHIVED (1) | 3/3 100% |
| TaskStatus | TODO (43), IN_PROGRESS (15), DONE (42) | 3/3 100% |
| TimeEntryStatus | APPROVED (22), SUBMITTED (14), DRAFT (24) | 3/4 (REJECTED not exercised) |
| InvoiceStatus | PAID (4), SENT (4), DRAFT (3), OVERDUE (1) | 4/5 (CANCELED not exercised) |
| NotificationType | TASK_ASSIGNED, PROJECT_COMPLETED, INVOICE_PAID, TIME_ENTRY_APPROVED, CLIENT_CREATED | 5/5 100% |

---

## 14. Financial Summary

| Category | Amount |
|---|---|
| Total Invoiced | $43,860 |
| Total Collected (PAID) | $18,525 |
| Outstanding (SENT) | $9,160 |
| Overdue | $4,800 |
| Draft (not yet sent) | $11,375 |
| Collection Rate | 42% collected, 21% in collection, 26% pending, 11% overdue |

### Revenue by Client (PAID + SENT + OVERDUE)

| Client | Revenue | Status Notes |
|---|---|---|
| NorthStar Ventures | $13,850 | 2 paid, 1 sent — anchor client |
| GreenLeaf Health | $8,100 | 1 paid, 1 overdue |
| NovaTech Solutions | $7,975 | 1 paid, 1 draft |
| Peak Fitness | $6,325 | 1 sent, 1 draft |
| Horizon Education | $2,700 | 1 draft |
| BrightPath Consulting | $2,200 | 1 sent |
| Urban Living Co. | $2,600 | 1 sent |

---

## 15. Data Cleanup

Before seeding, all existing data must be deleted in reverse dependency order:

```typescript
const tables = [
  'notification',
  'invoiceLineItem',
  'invoice',
  'timeEntry',
  'task',
  'project',
  'clientMember',
  'client',
  'workspaceMember',
  'invite',
  'user',
  'subscription',
  'workspaceSettings',
  'workspace',
  'fileAttachment',
  'clientRequest',
]
```

---

## 16. Verification Checklist

After seeding, verify:

- [ ] All 5 users exist with correct passwords
- [ ] All 4 workspace members have correct roles
- [ ] James Wilson is linked to NorthStar Ventures via ClientMember
- [ ] All 10 clients exist with correct statuses
- [ ] All 20 projects exist with correct statuses and client associations
- [ ] All 100 tasks exist with correct statuses and assignees
- [ ] 8 tasks have null assignee (unassigned)
- [ ] All 60 time entries exist with valid user-project-task relationships
- [ ] No self-approved time entries exist
- [ ] All 12 invoices exist with correct statuses and amounts
- [ ] Invoice line items total matches invoice totalAmount
- [ ] All 20 notifications exist with correct types and links
- [ ] Login banner prints correctly with all account info

---

## 17. Future Enhancements

- **Client portal invites** — Sophie Chen (GreenLeaf Health) and additional portal users
- **File attachments** — Sample files per project for file management demo
- **Client requests** — Sample client-submitted requests in the portal
- **Audit logs** — Historical activity for audit log review
- **API keys** — Demo API key for developer showcase
- **Stripe webhook events** — Subscription lifecycle events for billing demo
- **Password reset tokens** — Pre-seeded tokens for forgot-password walkthrough
- **More overdue invoices** — Additional overdue invoices to populate analytics alerts
- **REJECTED time entries** — Demonstrate the complete approval workflow
