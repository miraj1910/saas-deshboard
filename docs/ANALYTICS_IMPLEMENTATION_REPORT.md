# Analytics Dashboard Implementation Report

## Files Created

### Types
| File | Description |
|---|---|
| `src/features/analytics/types.ts` | All analytics data type definitions |

### Queries
| File | Description |
|---|---|
| `src/features/analytics/queries.ts` | All analytics database query functions |

### Components
| File | Description |
|---|---|
| `src/features/analytics/components/analytics-shell.tsx` | Main layout orchestrator for the analytics page |
| `src/features/analytics/components/kpi-cards.tsx` | 8 KPI stat cards (with skeleton loading) |
| `src/features/analytics/components/revenue-trend-chart.tsx` | 12-month revenue line chart |
| `src/features/analytics/components/invoice-status-chart.tsx` | Invoice status donut/pie chart |
| `src/features/analytics/components/hours-tracked-chart.tsx` | 8-week tracked hours bar chart |
| `src/features/analytics/components/project-status-chart.tsx` | Horizontal bar chart for project distribution |
| `src/features/analytics/components/top-clients-table.tsx` | Top 5 clients by revenue |
| `src/features/analytics/components/team-utilization-table.tsx` | Team member utilization breakdown |

### Route
| File | Description |
|---|---|
| `src/app/(workspace)/[workspaceSlug]/analytics/page.tsx` | Server component page with RBAC + data fetching |
| `src/app/(workspace)/[workspaceSlug]/analytics/loading.tsx` | Loading skeleton page |

### Modified Files
| File | Change |
|---|---|
| `src/components/layout/sidebar.tsx` | Added Analytics nav item with `BarChart3` icon |
| `package.json` | Added `recharts` dependency |

## Existing Queries Reused

The following queries from `src/features/dashboard/queries.ts` were **not directly reused** (re-implemented with analytics-specific aggregation):

| Dashboard Query | Why Not Reused |
|---|---|
| `getRevenueMtd` | Re-implemented for clear separation — analytics queries are self-contained in `src/features/analytics/queries.ts` |
| `getOutstandingInvoiceAmount` | Same — re-implemented |
| `getActiveClientCount` | Same — re-implemented (analytics always shows workspace-wide, no TEAM_MEMBER scoping) |
| `getQuickStats` | Not used — analytics computes its own team utilization and hours metrics |

## New Analytics Queries Added

All queries are in `src/features/analytics/queries.ts` and run in parallel via `Promise.all`:

| Query | Description | Aggregation |
|---|---|---|
| `getRevenueMtd` | Paid invoice line items this month | Sum of line item amounts |
| `getRevenueYtd` | Paid invoice line items this year | Sum of line item amounts |
| `getOutstandingInvoices` | SENT and OVERDUE invoice totals | Sum of invoice totalAmount |
| `getHoursTracked` | All APPROVED time entries | Sum of durationMinutes |
| `getProjectsCompleted` | Projects with COMPLETED status | Count |
| `getActiveClients` | Clients with ACTIVE status | Count |
| `getClientGrowth` | New clients this month vs last month | Percentage change |
| `getRevenueTrend` | Monthly revenue for last 12 months | Group by month, sum invoice totals |
| `getInvoiceStatusDistribution` | Invoices grouped by status | Group by status, count + sum |
| `getWeeklyHours` | Weekly approved hours for last 8 weeks | Group by ISO week, sum durationMinutes |
| `getProjectStatusDistribution` | Projects grouped by status | Group by status, count |
| `getTopClients` | Top 5 clients by PAID invoice revenue | Sum by client, sort, limit 5 |
| `getTeamUtilization` | Per-member hours + tasks this month | GroupBy on timeEntry + task, compute utilization % |

### Cross-workspace Safety

Every query filters by `workspaceId` from the authenticated context. No query accepts a raw `workspaceSlug` — the slug is resolved to a workspace ID, and the workspace context is created via `createWorkspaceContext(workspace.id)` which validates membership.

## RBAC Implementation

### Access Control

Only `OWNER` and `MANAGER` roles can access the analytics page.

**Implementation** (`page.tsx`):
```typescript
const ctx = await createWorkspaceContext(workspace.id)
assertAnyRole(ctx, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
```

- Uses existing `assertAnyRole` from `@/lib/authorization`
- `TEAM_MEMBER` and `CLIENT` roles receive a 403 Forbidden response
- Permission check uses `WorkspaceRole` enum — no string comparison

### Permission Enforcement

The existing `Permissions.ReportWorkspace` permission (assigned to OWNER and MANAGER in the RBAC matrix) aligns with analytics access. The `assertAnyRole` approach is equivalent to checking this permission.

## Performance Considerations

### Server Components
- The analytics page is a **Server Component** (`'use server'` by default in App Router)
- All data fetching happens on the server — no client-side API calls
- `dynamic = 'force-dynamic'` ensures fresh data on every request

### Parallel Queries
- 13 independent queries run concurrently via `Promise.all`
- Total database round-trips: 1 (AWS Lambda/Edge) + 13 parallel queries
- No sequential query chains

### Optimized Prisma Queries
- **No N+1 queries**: All aggregations use Prisma `aggregate`, `groupBy`, or `findMany` with specific `select` clauses
- **Minimal data transfer**: Queries only fetch the fields needed for aggregation
- **No joins where unnecessary**: Status distributions and counts use simple `count`/`groupBy` rather than full row retrieval

### Query Details

| Query | Prisma Method | Data Transferred |
|---|---|---|
| Revenue MTD | `findMany` + reduce | ~20 bytes per line item |
| Revenue YTD | `findMany` + reduce | ~20 bytes per line item |
| Outstanding | `findMany` + reduce | ~40 bytes per invoice |
| Hours Tracked | `aggregate` | Single number |
| Projects Completed | `count` | Single number |
| Active Clients | `count` | Single number |
| Client Growth | 2x `count` | Two numbers |
| Revenue Trend | `findMany` + in-memory bucket | ~80 bytes per invoice |
| Invoice Status | `findMany` + in-memory group | ~60 bytes per invoice |
| Weekly Hours | `findMany` + in-memory bucket | ~40 bytes per entry |
| Project Status | `findMany` + in-memory group | ~20 bytes per project |
| Top Clients | `findMany` with `include` | Full client + project IDs + invoice totals |
| Team Utilization | `groupBy` × 2 | Per-user aggregated numbers |

## Design System Reuse

### Components Used
- `Card`, `CardHeader`, `CardTitle`, `CardContent` — all chart/KPI wrappers
- `Skeleton` — loading states for every chart and KPI
- `Badge` — available for status labels (via existing design system)
- `cn()` utility — class merging
- `lucide-react` icons — `TrendingUp`, `TrendingDown`, `Minus`

### Styling Philosophy
- No purple gradients, glassmorphism, or marketing widgets
- Clean, data-dense layout inspired by HubSpot, Harvest, and Asana reporting
- Recharts charts use theme-aware CSS variables (`hsl(var(--primary))`, `hsl(var(--border))`, `hsl(var(--card))`)
- Consistent with existing dashboard patterns

## Chart Library

- **Recharts** was installed (`npm install recharts`)
- Used for: `LineChart`, `PieChart`, `BarChart` (vertical + horizontal)
- All charts are responsive via `ResponsiveContainer`
- Tooltips styled to match the design system

## Loading States

### Skeletons
- **KPI Cards**: 8 skeleton cards with matching dimensions
- **Charts**: Full-height skeleton blocks (h-64)
- **Tables**: Row skeletons matching data structure

### Empty States
- **Revenue Trend**: "No revenue data yet"
- **Invoice Status**: "No invoices yet"
- **Hours Tracked**: "No time entries yet"
- **Project Status**: "No projects yet"
- **Top Clients**: "No clients with revenue yet"
- **Team Utilization Table**: "No team members found"

## Future Reporting Opportunities

### Easy Wins (existing data, no schema changes)
1. **Project Profitability**: Compare invoice revenue vs logged hours × hourly rate per project
2. **Client Lifetime Value**: Aggregate total revenue per client since creation
3. **Time Approval Funnel**: Draft → Submitted → Approved/Rejected metrics
4. **Invoice Aging**: Days outstanding per overdue invoice
5. **Busy Days Chart**: Heatmap of time entries by day of week
6. **Task Completion Rate**: Tasks completed vs created per period
7. **Team Member Comparison**: Side-by-side utilization over time

### Schema Changes Needed
1. **Expense Tracking**: Non-billable costs per project (requires new model)
2. **Budget vs Actual**: Planned budget on projects (requires new fields)
3. **Forecasting**: ML-based revenue prediction (requires prediction infrastructure)
4. **Profit Margin**: Requires expense/cost tracking
5. **Goal Tracking**: Revenue/utilization targets (requires new model)
6. **Custom Date Ranges**: Configurable date picker for all charts (UI change only)

## File Tree

```
src/features/analytics/
  types.ts
  queries.ts
  components/
    analytics-shell.tsx
    kpi-cards.tsx
    revenue-trend-chart.tsx
    invoice-status-chart.tsx
    hours-tracked-chart.tsx
    project-status-chart.tsx
    top-clients-table.tsx
    team-utilization-table.tsx

src/app/(workspace)/[workspaceSlug]/analytics/
  page.tsx
  loading.tsx
```
