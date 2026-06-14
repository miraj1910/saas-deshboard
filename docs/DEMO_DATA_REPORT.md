# Demo Data Report — Creative Orbit Studio

## Record Counts

| Entity            | Count |
|-------------------|-------|
| Workspaces        | 1     |
| Users (team)      | 5     |
| Client portal users | 10  |
| Clients           | 15    |
| Projects          | 30    |
| Tasks             | 150   |
| Time entries      | 100   |
| Invoices          | 40    |
| Activities        | 20    |
| Notifications     | 50    |
| File attachments  | 16    |
| Client requests   | 0     |
| Audit logs        | 0     |

## Distribution

### Clients by Status
| Status   | Count |
|----------|-------|
| ACTIVE   | 10    |
| LEAD     | 4     |
| INACTIVE | 1     |

### Projects by Status
| Status     | Count |
|------------|-------|
| ACTIVE     | 17    |
| COMPLETED  | 8     |
| ARCHIVED   | 5     |

### Tasks by Status
| Status       | Count |
|--------------|-------|
| DONE         | 70    |
| IN_PROGRESS  | 40    |
| TODO         | 40    |

### Time Entries by Status
| Status    | Count |
|-----------|-------|
| APPROVED  | 60    |
| SUBMITTED | 20    |
| DRAFT     | 20    |

### Invoices by Status
| Status    | Count |
|-----------|-------|
| PAID      | 12    |
| SENT      | 10    |
| DRAFT     | 10    |
| OVERDUE   | 5     |
| CANCELED  | 3     |

### Notifications by Read Status
| State      | Count |
|------------|-------|
| Read       | 13    |
| Unread     | 37    |

## Analytics Expectations

All Dashboard and Analytics pages should render meaningful data:

- **Revenue trend** — 12 PAID invoices across Jan–Jun 2026 (at least one per month).
- **Outstanding invoices** — 5 OVERDUE + 10 SENT invoices, so KPI is non-zero.
- **Project completion rate** — 8 COMPLETED out of 30 projects.
- **Hours logged** — 100 time entries, all in June 2026. Weekly-hours chart populated.
- **Task breakdown** — 70 DONE, 40 IN_PROGRESS, 40 TODO across 30 projects.
- **Dashboard feed** — 20 activity entries spanning Apr–Jun 2026.
- **Notifications** — 50 notifications (37 unread) across all 5 team members.
- **Client portal** — 10 client users can log in and see their projects/invoices.
- **File attachments** — 16 files (13 project assets, 2 client deliverables, 1 spec doc) across 12 projects.
- **Client requests** — None seeded (schema exists but feature not exercised).
- **Audit logs** — None seeded (schema exists but feature not exercised).

## Login Credentials

All passwords: `password123`

**Team** — Login at `/creative-orbit`
- `sarah@creativeorbit.com` (Owner / Creative Director)
- `alex@creativeorbit.com` (Manager / Project Manager)
- `emma@creativeorbit.com` (Designer / UX/UI Designer)
- `michael@creativeorbit.com` (Developer / Full-Stack)
- `sophia@creativeorbit.com` (Frontend Engineer)

**Client Portal** — Login at `/portal`
- `james@northstarventures.com`
- `diana@greenleafhealth.com`
- `raj@novatech.io`
- `lisa@horizonedu.org`
- `marcus@peakfit.com`
- `nina@urbanliving.co`
- `tom@brightpathconsult.com`
- `maria@atlasenergy.com`
- `jake@elevatecommerce.com`
- `robert@summitlegal.com`

**Note:** 5 clients lack portal users (SkyBridge Finance, Quantum Logistics, BlueWave Systems, NextGen Robotics are LEADS; PixelCraft Media is INACTIVE).
