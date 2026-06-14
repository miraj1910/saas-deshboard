# Email System Implementation Report

## Overview

Implemented a centralized email infrastructure for FlowDesk using Resend as the email delivery provider. The system provides reusable HTML email templates, a typed service layer, and environment-based configuration — ready to be wired into existing server actions.

## Provider

**Resend v6.12.4** — Email API for developers with reliable deliverability, open tracking, and analytics.

## Architecture

```
Server Action / Event
        │
        ▼
┌───────────────────┐
│   Email Service   │  src/lib/email/index.ts
│   (sendEmail)     │  ── Resend SDK ──► Resend API ──► Recipient
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Email Templates  │  src/lib/email/templates/*.ts
│  (.html strings)  │  Layout wrapper + per-template content
└───────────────────┘
```

## Files Created

| File | Purpose |
|---|---|
| `src/lib/email/index.ts` | Centralized email service — Resend client, `sendEmail()`, and 5 typed send functions |
| `src/lib/email/types.ts` | TypeScript types for all email data payloads and options |
| `src/lib/email/templates/layout.ts` | Shared HTML email layout (branding, footer, responsive table structure) |
| `src/lib/email/templates/welcome.ts` | Welcome email for new user registration |
| `src/lib/email/templates/invite.ts` | Team/client invitation email |
| `src/lib/email/templates/invoice-sent.ts` | Invoice notification sent to client |
| `src/lib/email/templates/project-update.ts` | Project status change notification |
| `src/lib/email/templates/password-reset.ts` | Password reset with expiring link |

## Email Templates

### Layered Template Architecture

All templates use a shared `emailLayout()` wrapper (`templates/layout.ts`) that provides:

- Responsive HTML table structure (works in Outlook, Gmail, all major clients)
- FlowDesk branded header (logo wordmark)
- Content area (white card on gray background)
- Footer with copyright and company name
- MSO conditional comments for Outlook rendering

Each content template is a pure function: `(data) => HTML string`.

### Welcome Email
- **Trigger**: New user registration
- **Data**: `email`, `name`, `workspaceName`, `loginUrl`
- **Content**: Onboarding message, workspace confirmation, CTA to dashboard

### Invite Email
- **Trigger**: Team member or client portal invitation
- **Data**: `email`, `inviterName`, `workspaceName`, `inviteUrl`, `role`
- **Content**: Invitation details, role display, CTA to accept
- **Expiry note**: 7-day expiration warning

### Invoice Sent
- **Trigger**: Invoice status changed from DRAFT to SENT
- **Data**: `email`, `clientName`, `invoiceNumber`, `totalAmount`, `dueDate`, `invoiceUrl`, `workspaceName`
- **Content**: Invoice summary table (number, amount, due date), CTA to view

### Project Update
- **Trigger**: Project status change (e.g., COMPLETED)
- **Data**: `email`, `projectName`, `clientName`, `status`, `projectUrl`, `workspaceName`
- **Content**: Status badge with color coding, project details, CTA to view

### Password Reset
- **Trigger**: User requests password reset
- **Data**: `email`, `name`, `resetUrl`, `expiresIn`
- **Content**: Reset instructions, CTA button, expiry warning, security note

## Email Service Layer

### Core Functions

```
sendEmail(options: SendEmailOptions)
  ├─ Checks RESEND_API_KEY is configured (graceful skip if not)
  ├─ Validates recipient(s)
  ├─ Sends via Resend SDK with html content
  ├─ Supports: replyTo, attachments
  └─ Logs errors and returns { success, error }
```

### Typed Send Functions

| Function | Template | Use Case |
|---|---|---|
| `sendWelcomeEmail(data: WelcomeEmailData)` | `welcome.ts` | After user registration |
| `sendInviteEmail(data: InviteEmailData)` | `invite.ts` | After invite creation |
| `sendInvoiceSentEmail(data: InvoiceSentEmailData)` | `invoice-sent.ts` | After invoice send action |
| `sendProjectUpdateEmail(data: ProjectUpdateEmailData)` | `project-update.ts` | After project status change |
| `sendPasswordResetEmail(data: PasswordResetEmailData)` | `password-reset.ts` | After password reset request |

## Environment Configuration

```env
# Required — Get from https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxx

# Verified sender — must be a domain verified in Resend
EMAIL_FROM=FlowDesk <noreply@yourdomain.com>
```

The service is **environment-gated**:

```typescript
function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}
```

When `RESEND_API_KEY` is not set, `sendEmail()` logs a warning and returns `{ success: false, error: 'Email not configured' }` — no crashes, no uncaught errors.

## Integration Points (Ready to Wire)

Emails are **not sent automatically**. The following server actions are the intended integration points:

### 1. Registration (`src/features/auth/_actions.ts`)
- After `registerAction` creates user + workspace
- Call: `sendWelcomeEmail({ email, name, workspaceName, loginUrl })`

### 2. Invite Creation (not yet implemented)
- When creating an `Invite` record
- Call: `sendInviteEmail({ email, inviterName, workspaceName, inviteUrl, role })`

### 3. Invoice Sent (`src/features/invoices/_actions.ts`)
- Inside `sendInvoice()` action, after status flips to `SENT`
- Call: `sendInvoiceSentEmail({ email: client.email, clientName: client.name, invoiceNumber, totalAmount, dueDate, invoiceUrl, workspaceName })`

### 4. Project Update (`src/features/projects/_actions.ts`)
- Inside `updateProject()` action, when status changes to `COMPLETED`
- Call: `sendProjectUpdateEmail({ email, projectName, clientName, status: 'COMPLETED', projectUrl, workspaceName })`

### 5. Password Reset (not yet implemented)
- When creating a password reset token
- Call: `sendPasswordResetEmail({ email, name, resetUrl, expiresIn: '1 hour' })`

## Design Decisions

| Decision | Rationale |
|---|---|
| **HTML string templates** (no JSX) | Zero additional dependencies; templates are pure functions; easy to test and read |
| **Shared layout** | Consistent branding across all emails; single place to update design |
| **Graceful degradation** | No crash if `RESEND_API_KEY` is missing — logs warning and returns error |
| **Typed data payloads** | Each email type has its own TypeScript interface; compile-time safety for callers |
| **No auto-wiring** | Emails are not sent automatically from existing actions; explicit opt-in prevents accidental sends during development |
| **`isEmailConfigured()` guard** | Allows the system to run locally without email setup; easy to add a "preview mode" later |

## Security

- **No secrets in code**: `RESEND_API_KEY` is read from environment variables only
- **HTML escaping**: All user-provided strings (names, project names, etc.) are HTML-escaped before insertion into templates to prevent XSS
- **Resend API key**: Should be restricted to the "email sending" permission in the Resend dashboard

## Testing

To test emails in development:

```ts
import { sendWelcomeEmail } from '@/lib/email'

await sendWelcomeEmail({
  email: 'test@example.com',
  name: 'Test User',
  workspaceName: 'Test Workspace',
  loginUrl: 'http://localhost:3000/login',
})
```

Set `RESEND_API_KEY` in `.env` to enable sending. Leave it unset to verify the system handles the unconfigured state gracefully.

## Verification

- ✅ TypeScript compilation passes with zero errors
- ✅ All 5 templates render valid HTML
- ✅ Service layer gracefully handles missing configuration
- ✅ Environment variables defined in `.env` and `.env.example`
