# Invoices Feature Implementation Report

## Overview

The complete Invoices feature has been implemented: list page with CRUD (create, send, mark paid, void) and detail page with line items display. All new code reuses existing backend logic. Three missing server action wrappers were added to fill gaps in the existing backend.

## Files Created

### `src/app/(workspace)/[workspaceSlug]/invoices/page.tsx`
- Server component for the invoices list route
- Fetches workspace by slug, creates auth context
- Fetches active clients for the create invoice form dropdown
- Checks `InvoiceCreate`, `InvoiceSend`, `InvoiceMarkPaid`, `InvoiceVoid` permissions
- Passes flags and client list to `InvoicesList` client component

### `src/features/invoices/components/invoices-list.tsx`
- Client component implementing the full invoices list
- **Table columns**: Invoice Number (linked to detail page), Client, Amount (formatted currency), Status (color-coded badge), Due Date, Actions
- **Per-row actions** based on status + permissions:
  - View (eye icon, links to detail page) — always shown
  - Send (DRAFT status + `canSend`)
  - Mark Paid (SENT/OVERDUE status + `canMarkPaid`)
  - Void (not PAID/CANCELED + `canVoid`)
- **Create Invoice modal**:
  - Client select (required, triggers loading of approved unbilled time entries via `getApprovedTimeEntries`)
  - Time entries checklist: scrollable list with checkboxes showing description, project, user, duration
  - Selected count and total duration shown below checklist
  - Due date input (required)
  - Notes textarea (optional)
  - Client-side validation: requires client, at least 1 time entry, due date
- **Send confirmation dialog**: confirms sending the invoice
- **Mark Paid dialog**: confirms marking as paid
- **Void confirmation dialog**: warns action cannot be undone
- **States**: loading spinner, empty state (with contextual message based on permissions), field-level errors, action-level errors, per-row processing spinner

### `src/app/(workspace)/[workspaceSlug]/invoices/[invoiceId]/page.tsx`
- Server component for the invoice detail route
- Fetches invoice with full details (line items) using `findInvoiceById`
- Checks `InvoiceSend`, `InvoiceMarkPaid`, `InvoiceVoid` permissions
- Passes everything to `InvoiceDetail` client component

### `src/features/invoices/components/invoice-detail.tsx`
- Client component for the invoice detail view
- **Header**: Back link, invoice number, client name/company, status badge
- **Details card**: Issued date, due date, paid date (if set), total amount, notes
- **Line Items card**: Table with Description, Hours (qty), Rate, Amount columns + Total row
- **Action buttons** (shown only when relevant by status + permissions):
  - Send Invoice (DRAFT + `canSend`)
  - Mark as Paid (SENT/OVERDUE + `canMarkPaid`)
  - Void Invoice (not PAID/CANCELED + `canVoid`)
- Each action opens a confirmation dialog before executing
- State updates optimistically via `setCurrentInvoice` after each successful action

## Files Modified

### `src/features/invoices/_actions.ts`
- Added `listWorkspaceInvoices(workspaceId)` action
  - Checks `InvoiceRead` / `InvoiceReadOwn` permissions
  - Wraps the existing `listInvoices` query
- Added `getInvoice(workspaceId, invoiceId)` action
  - Checks `InvoiceRead` / `InvoiceReadOwn` permissions
  - Wraps the existing `findInvoiceById` query
- Added `getApprovedTimeEntries(workspaceId, clientId)` action
  - Wraps the existing `getApprovedTimeEntriesForClient` query
  - Returns a simplified shape (id, description, durationMinutes, projectName, taskTitle, userName)
  - Used by the create invoice form to show available unbilled entries
- All follow the existing `InvoiceActionResult<T>` pattern with proper error handling

## Existing Actions Reused

| Action | Source | Used For |
|---|---|---|
| `createInvoice` | `invoices/_actions.ts` | Create invoice modal |
| `sendInvoice` | `invoices/_actions.ts` | Send invoice action (list + detail) |
| `markPaid` | `invoices/_actions.ts` | Mark paid action (list + detail) |
| `voidInvoice` | `invoices/_actions.ts` | Void invoice action (list + detail) |

## Existing Queries Reused

| Query | Source | Used By |
|---|---|---|
| `listInvoices` | `invoices/queries.ts` | `listWorkspaceInvoices` action |
| `findInvoiceById` | `invoices/queries.ts` | `getInvoice` action, detail page server component |
| `getNextInvoiceNumber` | `invoices/queries.ts` | `createInvoice` action (auto-generates INV-XXXX) |
| `getApprovedTimeEntriesForClient` | `invoices/queries.ts` | `getApprovedTimeEntries` action |
| `InvoiceWithRelations` | `invoices/queries.ts` | Return type for all invoice actions |

## Existing Schemas Reused

| Schema | Source | Used By |
|---|---|---|
| `createInvoiceSchema` | `invoices/schemas.ts` | `createInvoice` action (validates clientId, timeEntryIds, dueDate, notes) |
| `sendInvoiceSchema` | `invoices/schemas.ts` | `sendInvoice` action |
| `markPaidSchema` | `invoices/schemas.ts` | `markPaid` action |
| `voidInvoiceSchema` | `invoices/schemas.ts` | `voidInvoice` action |

## Existing RBAC Reused

| Permission | Checked In |
|---|---|
| `InvoiceCreate` | List page (hide New Invoice button) |
| `InvoiceRead` / `InvoiceReadOwn` | `listWorkspaceInvoices` + `getInvoice` actions |
| `InvoiceSend` | List + detail pages (hide Send button) |
| `InvoiceMarkPaid` | List + detail pages (hide Mark Paid button) |
| `InvoiceVoid` | List + detail pages (hide Void button) |

## Invoice to Time Entry Integration

The "Create Invoice" workflow reuses `getApprovedTimeEntriesForClient` to fetch all approved, unbilled time entries for a selected client. These entries are displayed in a checklist, and the user selects which ones to bill. The `createInvoice` action then:
1. Validates the selected entries exist, are approved, and are unbilled
2. Computes line items from the entries (hours = durationMinutes / 60, rate = project hourlyRate)
3. Generates the next invoice number via `getNextInvoiceNumber`
4. Creates the invoice + line items in a single Prisma transaction
5. Returns the invoice with full relations

## Sidebar Navigation

Both the Desktop Sidebar (`sidebar.tsx:34`) and Mobile Sidebar (`top-nav.tsx:212`) already include an "Invoices" link pointing to `/invoices`, correctly prepended with the workspace slug.

## TypeScript Verification

- `tsc --noEmit` passes with **zero errors** in strict mode

## Remaining Enhancements

| Enhancement | Reason |
|---|---|
| **Email delivery** | `sendInvoice` only changes status; actual email sending not implemented |
| **PDF download** | `InvoiceDownloadPdf` permission exists but no download implementation |
| **Invoice editing** | `InvoiceUpdate` permission exists but no edit action for draft invoices |
| **Invoice deletion** | `InvoiceDelete` permission exists but no delete action |
| **Recurring invoices** | No auto-generation of recurring invoices |
| **Payment tracking** | Manual `paidAt` date entry instead of payment gateway integration |
| **Overdue detection** | No automatic overdue status update after due date passes |
