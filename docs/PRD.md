# FlowDesk — Product Requirements Document

## 1. Product Vision

FlowDesk is the operational backbone for independent knowledge workers. It replaces the patchwork of invoicing, CRM, project management, and time-tracking tools with a single, unified workspace — purpose-built for freelancers and agencies who sell their time and expertise.

The north star: **make running a services business as simple as using a single app.**

## 2. User Types

| Role | Description |
|---|---|---|
| **OWNER** | Agency owner or senior freelancer. Manages workspace settings, billing, team invitations, and global templates. |
| **MANAGER** | Agency team member with elevated permissions. Oversees projects, assigns tasks, approves timesheets. |
| **TEAM_MEMBER** | Freelancer or employee within an agency workspace. Manages their own projects, clients, and time — visibility is scoped. |
| **CLIENT** | External user. Receives proposals, invoices, and project updates. Has a limited portal to approve work, view invoices, and communicate. |

## 3. Core Features

- **Multi-tenant workspaces** — isolated data per tenant, sub-accounts for teams
- **Client CRM** — contact management, deal pipeline (lead → proposal → active → archived)
- **Project management** — projects nested under clients, with tasks, milestones, and deadlines
- **Time tracking** — built-in timer, manual entry, timesheet approval workflows
- **Invoicing & billing** — time/material-based invoice generation, partial payments, payment tracking
- **Proposals / estimates** — templated proposals that convert to projects on acceptance
- **Client portal** — secure per-client view of active projects, invoices, and file sharing
- **Reporting** — utilization, revenue, overdue invoices, project profitability
- **Role-based access control** — OWNER, MANAGER, TEAM_MEMBER, CLIENT roles per workspace

## 4. MVP Features

The MVP targets the solo freelancer and small agency (2–5 people) use case. Launch scope:

- **Workspace setup** — tenant creation, onboarding wizard, basic branding (logo + colors)
- **Client CRM (light)** — add/edit clients, status tracking (lead, active, inactive)
- **Project management (light)** — create projects under a client, basic task list with checkboxes, due dates
- **Time tracking** — start/stop timer, manual entry, view time logs per project
- **Invoicing** — generate invoice from time entries, set rate per project, mark as paid/unpaid
- **Authentication** — email/password login, Google OAuth, invite-by-email for team members
- **Dashboard** — upcoming deadlines, unpaid invoices, recent activity
- **Client portal** — read-only view of project status and invoices for client users

Explicitly **out of scope** for MVP: proposals, payment processing (Stripe integration), advanced reporting, file sharing, role granularity beyond OWNER/TEAM_MEMBER/CLIENT.

## 5. Future Features

- Payment processing (Stripe / PayPal) — pay invoices online, auto-reconciliation
- Proposals & estimates with e-signature
- Recurring invoices & retainer management
- Expense tracking & receipt OCR
- Team scheduling & availability calendar
- Advanced reporting dashboard (utilization, profitability by client/project/member)
- File sharing & document storage per project
- Time-off / leave management
- Public booking page (clients book time slots)
- Zapier / API access for third-party integrations
- Mobile app (iOS / Android)

## 6. Success Metrics

| Metric | Target (6 months post-launch) |
|---|---|
| **Active workspaces** | 500 |
| **Paying workspaces** | 100 |
| **MRR** | $5,000 |
| **Churn rate (monthly)** | < 5% |
| **Daily active users (DAU)** | 40% of total users |
| **NPS score** | ≥ 40 |
| **Avg. time-to-first-invoice** | ≤ 3 days from signup |
| **Support tickets per user / month** | < 0.5 |
