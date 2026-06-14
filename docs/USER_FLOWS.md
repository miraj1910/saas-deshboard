# FlowDesk — User Flows

---

## Owner Journey

OWNER — agency owner or solo freelancer who owns the workspace.

```mermaid
flowchart TD
    A[Sign up / Create workspace] --> B[Onboarding wizard: name, logo, branding]
    B --> C{Team or solo?}
    C -->|Solo| D[Invite clients]
    C -->|Agency| E[Invite team members via email]
    E --> F[Assign roles: MANAGER / TEAM_MEMBER]
    F --> D
    D --> G[Create client record]
    G --> H[Create project under client]
    H --> I[Set hourly rate & due dates]
    I --> J[Optionally assign team members]
    J --> K{Track progress}
    K -->|Self| L[Log time via timer or manual entry]
    K -->|Review team| M[Approve / reject timesheets]
    L --> N[Generate invoice from time entries]
    M --> N
    N --> O[Send invoice to client]
    O --> P[Mark as paid when received]
    P --> Q[View dashboard: revenue, utilization, overdue]
```

---

## Manager Journey

Agency team member with elevated permissions — oversees projects and people but does not own billing/workspace settings.

```mermaid
flowchart TD
    A[Log in to agency workspace] --> B[Dashboard: team workload, deadlines]
    B --> C[View assigned projects]
    C --> D[Create tasks & milestones]
    D --> E[Assign tasks to team members]
    E --> F[Monitor time logs per member]
    F --> G{Approve timesheets?}
    G -->|Yes| H[Approve logged hours]
    G -->|No| I[Request revision]
    H --> J[Generate project report]
    I --> F
    J --> K[Escalate billing to OWNER]
```

---

## Team Member Journey

Individual contributor — sees only their own work, clients, and time.

```mermaid
flowchart TD
    A[Log in] --> B[View my tasks & deadlines]
    B --> C[Start timer on active task]
    C --> D[Stop timer — entry saved]
    D --> E[Or: manually add time entry]
    E --> F[Review my timesheet]
    F --> G[Submit for approval]
    G --> H{Manager approves?}
    H -->|Yes| I[Entry locked]
    H -->|No| J[Revise & resubmit]
    J --> G
    I --> K[View my invoices]
    K --> L[See project progress & client feedback]
```

---

## Client Journey

External user — limited, read-only portal.

```mermaid
flowchart TD
    A[Receive invite email from workspace] --> B[Set password / accept invite]
    B --> C[Log in to client portal]
    C --> D[Dashboard: active projects & unpaid invoices]
    D --> E[View project details & task progress]
    E --> F[View invoice breakdown]
    F --> G{Payment handling}
    G -->|MVP| H[Invoice shows "paid" / "unpaid" — no online payment]
    G -->|Future| I[Pay invoice via Stripe / PayPal]
    H --> J[Send message / request change]
    I --> J
    J --> K[Project completes → archive]
```

---

## Cross-Journey Summary

```mermaid
flowchart LR
    subgraph Owner
        O1[Create workspace]
        O2[Invite team]
        O3[Bill clients]
    end
    subgraph Manager
        M1[Assign work]
        M2[Approve time]
        M3[Report]
    end
    subgraph Member
        T1[Track time]
        T2[Do tasks]
        T3[Submit timesheet]
    end
    subgraph Client
        C1[View progress]
        C2[See invoices]
        C3[Communicate]
    end

    O1 --> M1
    O2 --> M1
    M1 --> T2
    T1 --> M2
    M2 --> O3
    O3 --> C2
    T2 --> C1
    C3 --> M1
```
