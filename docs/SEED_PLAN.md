# FlowDesk — Seed Data Plan

**Context date:** June 10, 2026
**Workspace created:** January 15, 2026

---

## 1. Workspace

| Field | Value |
|---|---|
| name | FlowDesk Demo |
| slug | flowdesk-demo |
| deletedAt | null |

### WorkspaceSettings

| Field | Value |
|---|---|
| logoUrl | null (not implemented in v1) |
| primaryColor | `#6366F1` (indigo) |
| timezone | `America/New_York` |
| companyName | FlowDesk Demo LLC |
| companyAddress | 123 Broadway, New York, NY 10006 |
| companyTaxId | `US-12-3456789` |
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
| stripeSubscriptionId | null (v2) |
| stripeCustomerId | null (v2) |

---

## 2. Users

### Sarah Chen — Owner

| Field | Value |
|---|---|
| name | Sarah Chen |
| email | owner@demo.com |
| userType | TEAM |
| avatarUrl | null |

Sarah is the founder. She runs the agency, manages clients, reviews timesheets, and sends invoices. Joined day one.

### Alex Rivera — Manager

| Field | Value |
|---|---|
| name | Alex Rivera |
| email | manager@demo.com |
| userType | TEAM |
| avatarUrl | null |

Alex is the project manager. Handles day-to-day client communication, task assignment, and timesheet approval. Reports to Sarah. Invited by Sarah on February 1, 2026.

### Jamie Kim — Team Member

| Field | Value |
|---|---|
| name | Jamie Kim |
| email | member@demo.com |
| userType | TEAM |
| avatarUrl | null |

Jamie is a junior developer. Works on assigned tasks, logs time against projects. Invited by Alex on March 10, 2026.

### Blake Howard — Client Portal User

| Field | Value |
|---|---|
| name | Blake Howard |
| email | client@demo.com |
| userType | CLIENT |
| avatarUrl | null |

Blake is the owner of Brew & Bloom Coffee. Uses the client portal to view project progress and invoices. Invited by Sarah on March 15, 2026.

---

## 3. WorkspaceMembers

| User | Role | Joined | Invited By |
|---|---|---|---|
| Sarah Chen (owner@demo.com) | OWNER | 2026-01-15 | null (self-created) |
| Alex Rivera (manager@demo.com) | MANAGER | 2026-02-01 | Sarah Chen |
| Jamie Kim (member@demo.com) | TEAM_MEMBER | 2026-03-10 | Alex Rivera |

---

## 4. Clients

### Brew & Bloom Coffee

| Field | Value |
|---|---|
| name | Brew & Bloom Coffee |
| email | blake@brewandbloom.com |
| phone | (212) 555-0178 |
| company | Brew & Bloom Coffee Co. |
| status | ACTIVE |
| notes | Flagship client. Three locations in Manhattan. Wants a unified digital presence. Primary contact: Blake Howard. |

**Relationship:** Has 2 active projects (Website Redesign, Loyalty App). Blake Howard (client@demo.com) has portal access via ClientMember.

### Greenline Fitness

| Field | Value |
|---|---|
| name | Greenline Fitness |
| email | marcus@greenline.fit |
| phone | (917) 555-0244 |
| company | Greenline Fitness LLC |
| status | ACTIVE |
| notes | Boutique gym chain expanding to Brooklyn. Owner: Marcus Chen (no relation to Sarah). |

**Relationship:** Has 2 projects (Brand Identity — completed, Booking System — active). No client portal user yet.

### Pixel & Co

| Field | Value |
|---|---|
| name | Pixel & Co |
| email | hello@pixelandco.com |
| phone | null |
| company | Pixel & Co Design Studio |
| status | INACTIVE |
| notes | Referred by a mutual contact. Had one small project but paused due to internal restructuring. Follow up in Q3. |

**Relationship:** Has 1 archived project (Brochure Site). No portal user.

---

## 5. ClientMembers

| Client | User | Joined | Invited By |
|---|---|---|---|
| Brew & Bloom Coffee | Blake Howard (client@demo.com) | 2026-03-15 | Sarah Chen |

Blake authenticates via the client portal (subdomain route). He sees:
- Brew & Bloom Coffee — his own client record
- Website Redesign + Loyalty App — projects where his client is the billing party
- Any invoices billed to Brew & Bloom Coffee

---

## 6. Projects

### Brew & Bloom — Website Redesign

| Field | Value |
|---|---|
| client | Brew & Bloom Coffee |
| name | Website Redesign |
| hourlyRate | 95.00 |
| status | ACTIVE |
| startDate | 2026-02-01 |
| dueDate | 2026-07-15 |
| description | Complete redesign of brewandbloom.com. Includes menu management system, location finder, and online ordering integration. |

### Brew & Bloom — Loyalty App

| Field | Value |
|---|---|
| client | Brew & Bloom Coffee |
| name | Loyalty App |
| hourlyRate | 85.00 |
| status | ACTIVE |
| startDate | 2026-04-01 |
| dueDate | 2026-08-31 |
| description | React Native loyalty rewards app. Punch card system, push notifications, payment integration. |

### Greenline Fitness — Brand Identity

| Field | Value |
|---|---|
| client | Greenline Fitness |
| name | Brand Identity |
| hourlyRate | 90.00 |
| status | COMPLETED |
| startDate | 2026-02-15 |
| dueDate | 2026-04-30 |
| description | Logo, color palette, typography, brand guidelines, social media templates. |

### Greenline Fitness — Booking System

| Field | Value |
|---|---|
| client | Greenline Fitness |
| name | Booking System |
| hourlyRate | 100.00 |
| status | ACTIVE |
| startDate | 2026-05-01 |
| dueDate | 2026-07-30 |
| description | Custom class booking web app with waitlist management, membership tiers, and Stripe checkout. |

### Pixel & Co — Brochure Site

| Field | Value |
|---|---|
| client | Pixel & Co |
| name | Brochure Site |
| hourlyRate | 80.00 |
| status | ARCHIVED |
| startDate | 2026-03-01 |
| dueDate | 2026-04-15 |
| description | Five-page marketing site. Design completed, development paused due to client restructuring. |

---

## 7. Tasks

### Project: Brew & Bloom — Website Redesign (5 tasks)

| # | Title | Assignee | Status | Due Date | sortOrder |
|---|---|---|---|---|---|
| 1 | Homepage hero section | Sarah Chen | DONE | 2026-02-28 | 1.0 |
| 2 | Menu management CMS | Jamie Kim | IN_PROGRESS | 2026-06-15 | 2.0 |
| 3 | Location finder with Google Maps API | Jamie Kim | TODO | 2026-07-01 | 3.0 |
| 4 | Online ordering checkout flow | unassigned | TODO | 2026-07-10 | 4.0 |
| 5 | Mobile responsive QA pass | Jamie Kim | IN_PROGRESS | 2026-07-15 | 5.0 |

### Project: Brew & Bloom — Loyalty App (4 tasks)

| # | Title | Assignee | Status | Due Date | sortOrder |
|---|---|---|---|---|---|
| 1 | User authentication & profile screens | Sarah Chen | DONE | 2026-04-15 | 1.0 |
| 2 | Punch card logic and redemption flow | Jamie Kim | IN_PROGRESS | 2026-06-30 | 2.0 |
| 3 | Push notification integration | Sarah Chen | TODO | 2026-07-15 | 3.0 |
| 4 | Stripe payment integration | unassigned | TODO | 2026-08-15 | 4.0 |

### Project: Greenline Fitness — Brand Identity (3 tasks)

| # | Title | Assignee | Status | Due Date | sortOrder |
|---|---|---|---|---|---|
| 1 | Logo concept exploration (3 rounds) | Sarah Chen | DONE | 2026-03-01 | 1.0 |
| 2 | Brand guidelines document | Sarah Chen | DONE | 2026-04-15 | 2.0 |
| 3 | Social media template kit | Alex Rivera | DONE | 2026-04-28 | 3.0 |

### Project: Greenline Fitness — Booking System (4 tasks)

| # | Title | Assignee | Status | Due Date | sortOrder |
|---|---|---|---|---|---|
| 1 | Database schema for class schedules | Jamie Kim | DONE | 2026-05-15 | 1.0 |
| 2 | Class browsing and filter UI | Jamie Kim | IN_PROGRESS | 2026-06-20 | 2.0 |
| 3 | Admin dashboard for class management | Sarah Chen | TODO | 2026-07-01 | 3.0 |
| 4 | Stripe checkout for memberships | unassigned | TODO | 2026-07-15 | 4.0 |

### Project: Pixel & Co — Brochure Site (2 tasks)

| # | Title | Assignee | Status | Due Date | sortOrder |
|---|---|---|---|---|---|
| 1 | Home and About page design | Sarah Chen | DONE | 2026-03-20 | 1.0 |
| 2 | Services and Contact page design | Sarah Chen | DONE | 2026-04-10 | 2.0 |

---

## 8. Time Entries

### Timeline: Past 2 weeks (May 27 – June 9, 2026)

#### Jamie Kim — 8 entries (work in progress and submitted)

| Day | Project | Task | Hours | Description | Status | Approved By |
|---|---|---|---|---|---|---|
| May 27 | Website Redesign | Menu management CMS | 3.5 | Built the menu category CRUD admin panel | SUBMITTED | — |
| May 28 | Website Redesign | Menu management CMS | 4.0 | Added drag-and-drop item reordering with sort_order floats | SUBMITTED | — |
| May 29 | Loyalty App | Punch card logic | 5.0 | Implemented punch card state machine: issued → stamped → redeemed | SUBMITTED | — |
| Jun 1 | Website Redesign | Mobile responsive QA | 2.5 | Tested homepage on iOS Safari, Chrome, Firefox — 3 layout bugs found | SUBMITTED | — |
| Jun 3 | Booking System | Class browsing UI | 6.0 | Built week-at-a-glance calendar component with time slot grid | SUBMITTED | — |
| Jun 5 | Booking System | Class browsing UI | 4.5 | Added filter by class type, instructor, and time of day | DRAFT | — |
| Jun 8 | Loyalty App | Punch card logic | 3.0 | Wrote unit tests for edge cases: expired stamps, max redemptions | DRAFT | — |
| Jun 9 | Website Redesign | Menu management CMS | 2.0 | Fixed image upload for menu items, added S3 presigned URL flow | DRAFT | — |

#### Sarah Chen — 4 entries (owner level, some approved)

| Day | Project | Task | Hours | Description | Status | Approved By |
|---|---|---|---|---|---|---|
| May 30 | Booking System | Admin dashboard | 3.0 | Designed admin layout wireframes in Figma, shared with Marcus | APPROVED | Alex Rivera |
| Jun 2 | Loyalty App | Push notifications | 4.0 | Set up Firebase Cloud Messaging project, tested device registration | APPROVED | Alex Rivera |
| Jun 4 | Booking System | Admin dashboard | 3.5 | Built class schedule CRUD for admin users (create/edit/cancel classes) | DRAFT | — |
| Jun 7 | Website Redesign | Online ordering | 2.0 | Researched Square and Toast POS APIs for checkout integration | DRAFT | — |

#### Alex Rivera — 2 entries (manager, self-approved not allowed)

| Day | Project | Task | Hours | Description | Status | Approved By |
|---|---|---|---|---|---|---|
| Jun 1 | Brand Identity | Social media kit | 1.5 | Created Canva template versions for Instagram, LinkedIn, TikTok | APPROVED | Sarah Chen |
| Jun 6 | Booking System | Class browsing UI | 2.0 | Reviewed Jamie's PR, left feedback on filter performance | SUBMITTED | — |

---

## 9. Invoices

### Invoice INV-2026-001 — Brew & Bloom Coffee (SENT)

| Field | Value |
|---|---|
| invoiceNumber | INV-2026-001 |
| client | Brew & Bloom Coffee |
| status | SENT |
| issuedDate | 2026-06-01 |
| dueDate | 2026-06-30 |
| paidAt | null |
| notes | Covers Website Redesign work through May 31. |

**Line Items:**

| # | Description | Quantity (hrs) | Unit Price | Amount | Originating Time Entry |
|---|---|---|---|---|---|
| 1 | Menu management CMS — CRUD admin panel | 3.5 | 95.00 | 332.50 | Jamie Kim, May 27 |
| 2 | Menu management CMS — drag-and-drop reordering | 4.0 | 95.00 | 380.00 | Jamie Kim, May 28 |
| 3 | Mobile responsive QA — cross-browser testing | 2.5 | 95.00 | 237.50 | Jamie Kim, Jun 1 |

**Total:** $950.00

### Invoice INV-2026-002 — Greenline Fitness (DRAFT)

| Field | Value |
|---|---|
| invoiceNumber | INV-2026-002 |
| client | Greenline Fitness |
| status | DRAFT |
| issuedDate | 2026-06-10 |
| dueDate | 2026-07-10 |
| paidAt | null |
| notes | Class browsing UI milestone 1. Still editable. |

**Line Items:**

| # | Description | Quantity (hrs) | Unit Price | Amount | Originating Time Entry |
|---|---|---|---|---|---|
| 1 | Class browsing UI — week calendar component | 6.0 | 100.00 | 600.00 | Jamie Kim, Jun 3 |
| 2 | Class browsing UI — filter system prototype | 1.5 | 100.00 | 150.00 | Alex Rivera, Jun 6 (review time) |

**Total:** $750.00

### Invoice INV-2026-003 — Brew & Bloom Coffee (PAID)

| Field | Value |
|---|---|
| invoiceNumber | INV-2026-003 |
| client | Brew & Bloom Coffee |
| status | PAID |
| issuedDate | 2026-04-01 |
| dueDate | 2026-04-30 |
| paidAt | 2026-04-25 |
| notes | Website Redesign — homepage hero milestone. Payment received early. |

**Line Items:**

| # | Description | Quantity (hrs) | Unit Price | Amount | Originating Time Entry |
|---|---|---|---|---|---|
| 1 | Homepage hero section — HTML/CSS/JS implementation | 3.0 | 95.00 | 285.00 | Sarah Chen, Feb 25 |
| 2 | Homepage hero section — animation polish | 2.0 | 95.00 | 190.00 | Sarah Chen, Feb 27 |

**Total:** $475.00

---

## 10. Invites

| Email | Role | Status | Created By | Client | Expires |
|---|---|---|---|---|---|
| sophie@greenline.fit | CLIENT (via clientId) | PENDING | Sarah Chen | Greenline Fitness | 2026-06-17 |
| alex.chen@tinybird.dev | TEAM_MEMBER | PENDING | Alex Rivera | null | 2026-06-17 |

Two pending invites:
1. Sophie Chen (no relation) from Greenline Fitness — portal invite, never accepted
2. Alex Chen from Tinybird.dev — team member invite, just sent

---

## 11. Entity Relationship Summary

```
Workspace "FlowDesk Demo"
  ├── WorkspaceSettings (1:1) — branding, timezone, company info
  ├── Subscription (1) — PRO plan active
  ├── WorkspaceMember (3)
  │   ├── Sarah Chen — OWNER (joined Jan 15)
  │   ├── Alex Rivera — MANAGER (invited by Sarah, joined Feb 1)
  │   └── Jamie Kim — TEAM_MEMBER (invited by Alex, joined Mar 10)
  ├── Client (3)
  │   ├── Brew & Bloom Coffee — ACTIVE
  │   │   ├── ClientMember (1) — Blake Howard [CLIENT user]
  │   │   ├── Project "Website Redesign" — ACTIVE
  │   │   │   ├── Task "Homepage hero section" — DONE (Sarah)
  │   │   │   ├── Task "Menu management CMS" — IN_PROGRESS (Jamie) ← 3 time entries
  │   │   │   ├── Task "Location finder" — TODO
  │   │   │   ├── Task "Online ordering" — TODO
  │   │   │   └── Task "Mobile QA pass" — IN_PROGRESS (Jamie) ← 1 time entry
  │   │   ├── Project "Loyalty App" — ACTIVE
  │   │   │   ├── Task "Auth screens" — DONE (Sarah)
  │   │   │   ├── Task "Punch card logic" — IN_PROGRESS (Jamie) ← 2 time entries
  │   │   │   ├── Task "Push notifications" — TODO (Sarah)
  │   │   │   └── Task "Stripe integration" — TODO
  │   │   ├── Invoice INV-2026-003 — PAID ($475, paid Apr 25)
  │   │   └── Invoice INV-2026-001 — SENT ($950, due Jun 30)
  │   │
  │   ├── Greenline Fitness — ACTIVE
  │   │   ├── Invite pending for sophie@greenline.fit (CLIENT)
  │   │   ├── Project "Brand Identity" — COMPLETED
  │   │   │   ├── Task "Logo exploration" — DONE (Sarah)
  │   │   │   ├── Task "Brand guidelines" — DONE (Sarah)
  │   │   │   └── Task "Social media kit" — DONE (Alex) ← 1 time entry
  │   │   ├── Project "Booking System" — ACTIVE
  │   │   │   ├── Task "DB schema" — DONE (Jamie)
  │   │   │   ├── Task "Class browsing UI" — IN_PROGRESS (Jamie) ← 2 time entries
  │   │   │   ├── Task "Admin dashboard" — TODO (Sarah) ← 2 time entries
  │   │   │   └── Task "Stripe checkout" — TODO
  │   │   └── Invoice INV-2026-002 — DRAFT ($750, not yet sent)
  │   │
  │   └── Pixel & Co — INACTIVE
  │       └── Project "Brochure Site" — ARCHIVED
  │           ├── Task "Home and About page" — DONE (Sarah)
  │           └── Task "Services and Contact page" — DONE (Sarah)
  │
  └── Invites (2 pending)
      ├── sophie@greenline.fit → CLIENT portal (created by Sarah)
      └── alex.chen@tinybird.dev → TEAM_MEMBER (created by Alex)
```

---

## 12. Coverage Verification

Every enum value exercised by the seed data:

| Enum | Values Covered | Coverage |
|---|---|---|
| UserType | TEAM (3 users), CLIENT (Blake) | 2/2 ✅ |
| WorkspaceRole | OWNER (Sarah), MANAGER (Alex), TEAM_MEMBER (Jamie) | 3/3 ✅ |
| Plan | PRO | 1/3 (only PRO needed for demo) |
| SubscriptionStatus | ACTIVE | 1/5 (demo should show healthy state) |
| ClientStatus | ACTIVE (Brew & Bloom, Greenline), INACTIVE (Pixel & Co) | 2/4 (LEAD and ARCHIVED not exercised) |
| ProjectStatus | ACTIVE (3), COMPLETED (Brand Identity), ARCHIVED (Brochure Site) | 3/3 ✅ |
| TaskStatus | TODO (5), IN_PROGRESS (4), DONE (9) | 3/3 ✅ |
| TimeEntryStatus | DRAFT (4), SUBMITTED (5), APPROVED (3) | 3/4 (REJECTED not exercised) |
| InvoiceStatus | DRAFT (INV-002), SENT (INV-001), PAID (INV-003) | 3/5 (OVERDUE, CANCELED not exercised) |
| InviteStatus | PENDING (2) | 1/4 (ACCEPTED, EXPIRED, REVOKED not exercised — acceptable for initial seed) |

### Relationship Coverage

| Relationship | Example in Seed | Count |
|---|---|---|
| Workspace → WorkspaceSettings | FlowDesk Demo → settings | 1 |
| Workspace → Subscription | FlowDesk Demo → PRO plan | 1 |
| Workspace → WorkspaceMember | FlowDesk Demo → Sarah, Alex, Jamie | 3 |
| Workspace → Client | FlowDesk Demo → Brew & Bloom, Greenline, Pixel & Co | 3 |
| Workspace → Project | FlowDesk Demo → Website Redesign, etc. | 5 |
| Workspace → TimeEntry | FlowDesk Demo → Jamie's entries, etc. | 14 |
| Workspace → Invoice | FlowDesk Demo → INV-001, INV-002, INV-003 | 3 |
| Workspace → Invite | FlowDesk Demo → sophie@, alex.chen@ | 2 |
| Client → ClientMember | Brew & Bloom → Blake Howard | 1 |
| Client → Project | Brew & Bloom → Website Redesign, Loyalty App | 2 per active client |
| Client → Invoice | Brew & Bloom → INV-001, INV-003 | 2 |
| Project → Task | Website Redesign → 5 tasks, etc. | 18 total |
| Task → TimeEntry | "Menu management CMS" → 3 entries | 11 linked to tasks |
| User → TimeEntry (owner) | Jamie Kim → 8 entries | 14 total across 3 users |
| User → TimeEntry (approver) | Alex Rivera → approved 2 Sarah entries | 2 approved |
| TimeEntry → InvoiceLineItem | Jamie's May 27 entry → INV-001 line 1 | 5 linked to invoices |
| Invoice → InvoiceLineItem | INV-001 → 3 lines, INV-002 → 2 lines, INV-003 → 2 lines | 7 line items |

### What the Seed Exercises

| Feature | Exercised By |
|---|---|
| Timer → draft flow | Jamie's DRAFT entries (still running or unsaved) |
| Submit for approval | Jamie's 5 SUBMITTED entries awaiting Alex's review |
| Approve workflow | Sarah's entries approved by Alex |
| Self-approval prohibition | Alex cannot approve own entries — his Jun 6 entry is SUBMITTED to Sarah |
| Invoice from unbilled entries | INV-002 is in DRAFT, built from APPROVED/SUBMITTED entries |
| Invoice send lifecycle | INV-001 sent, INV-003 paid |
| Invoice overdue tracking | INV-001 due Jun 30 — will be overdue in 20 days |
| Client portal access | Blake Howard can see Brew & Bloom projects and invoices |
| Team invite flow | Both pending invites (portal + team) ready for acceptance testing |
| Soft-delete | Pixel & Co client (inactive, projects archived — not deleted) |
| Float sort_order reordering | All tasks have sortOrder values with gaps for insertion |
| Multi-tenant isolation | All data scoped to one workspace (single-tenant demo) |
