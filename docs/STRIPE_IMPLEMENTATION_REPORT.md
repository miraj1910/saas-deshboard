# Stripe Subscription Billing Implementation Report

## Overview

Implemented a complete Stripe subscription billing system for FlowDesk. The system uses the existing `Subscription` Prisma model and adds Stripe Checkout, Billing Portal, webhook synchronization, and plan limit enforcement.

## Provider

**Stripe v22.2.0** — Payment processing and subscription management platform.

## Architecture

```
User clicks "Upgrade"
        │
        ▼
┌──────────────────────┐
│  upgradeToPlan()     │  Server Action
│  (createCheckout)    │  ──► Stripe Checkout Session
└──────────────────────┘        │
                                │ User redirected
                                ▼
                        Stripe Checkout (hosted)
                                │
                                │ Payment complete
                                ▼
┌──────────────────────┐
│  Webhook Handler     │  POST /api/webhooks/stripe
│  checkout.session    │
│  .completed          │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│  Update Subscription │  Prisma: plan, status,
│  in Database         │  stripe IDs, periods
└──────────────────────┘

User clicks "Manage Billing"
        │
        ▼
┌──────────────────────┐
│  openBillingPortal() │  Server Action
│  (createPortal)      │  ──► Stripe Customer Portal
└──────────────────────┘        │
                                │ User redirected
                                ▼
                        Stripe Billing Portal (hosted)
                        (upgrade, downgrade, cancel,
                         payment methods, invoices)
                                │
                                ▼
┌──────────────────────┐
│  Webhook Handler     │  POST /api/webhooks/stripe
│  customer.subscription│
│  .updated/.deleted   │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│  Sync Subscription   │  Prisma: plan, status,
│  in Database         │  periods, cancelAtPeriodEnd
└──────────────────────┘
```

## Files Created

| File | Purpose |
|---|---|
| `src/lib/stripe/index.ts` | Stripe client singleton, price ID mapping, `getStripeClient()`, `getPlanFromPriceId()` |
| `src/lib/stripe/plans.ts` | Plan definitions, limit checking helpers (`checkPlanClientLimit`, `checkPlanTeamLimit`, `checkPlanFeature`) |
| `src/lib/stripe/checkout.ts` | `createCheckoutSession()` — creates Stripe Checkout session for subscription |
| `src/lib/stripe/portal.ts` | `createBillingPortalSession()` — creates Stripe Customer Portal session |
| `src/app/api/webhooks/stripe/route.ts` | Stripe webhook handler — 5 event types processed |
| `src/features/subscription/queries.ts` | Subscription queries (`getCurrentSubscription`, `getSubscriptionByStripeId`) |
| `src/features/subscription/_actions.ts` | Subscription server actions (`getSubscription`, `upgradeToPlan`, `openBillingPortal`) |
| `src/app/(workspace)/[workspaceSlug]/settings/billing/page.tsx` | Billing page (server component) |
| `src/app/(workspace)/[workspaceSlug]/settings/billing/billing-page-content.tsx` | Billing page (client component with Stripe redirects) |
| `src/app/(workspace)/[workspaceSlug]/settings/page.tsx` | Settings page (redirects to billing) |

## Files Modified

| File | Change |
|---|---|
| `package.json` | Added `stripe` |
| `.env` / `.env.example` | Added `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_AGENCY` |
| `src/features/clients/_actions.ts` | Added plan limit check to `createClient()` |

## Plan Definitions

### Plans

| Plan | Max Clients | Team Collaboration | Client Portal | Price |
|---|---|---|---|---|
| **FREE** | 3 | No | No | $0 |
| **PRO** | Unlimited | Yes | Yes | $29/mo |
| **AGENCY** | Unlimited | Yes | Yes | $79/mo |

### Plan Limits

```typescript
PLAN_DEFINITIONS = {
  FREE: { maxClients: 3, maxTeamMembers: 1, hasTeamCollaboration: false, hasClientPortal: false },
  PRO:  { maxClients: null, maxTeamMembers: null, hasTeamCollaboration: true, hasClientPortal: true },
  AGENCY: { maxClients: null, maxTeamMembers: null, hasTeamCollaboration: true, hasClientPortal: true },
}
```

## Stripe Integration Points

### Checkout (`createCheckoutSession`)
- Creates a Stripe Checkout Session with `mode: 'subscription'`
- Price ID mapped from environment variable (`STRIPE_PRICE_ID_PRO` / `STRIPE_PRICE_ID_AGENCY`)
- `client_reference_id` set to workspaceId for webhook correlation
- `customer_email` set to the user's email for pre-filled checkout
- Returns session URL for redirect

### Billing Portal (`createBillingPortalSession`)
- Creates or retrieves Stripe Customer for the workspace
- Creates a Customer Portal Session with return URL
- Returns session URL for redirect
- First-time portal users get a Stripe Customer created automatically

### Webhook Events Handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Links Stripe subscription/customer to workspace, sets plan, status, periods |
| `customer.subscription.updated` | Syncs plan changes, status updates, period changes, cancel-at-period-end |
| `customer.subscription.deleted` | Sets subscription to CANCELED or EXPIRED |
| `invoice.paid` | Sets subscription status to ACTIVE |
| `invoice.payment_failed` | Sets subscription status to PAST_DUE |

## Plan Limit Enforcement

### Client Creation (`createClient` in `src/features/clients/_actions.ts`)

Before creating a client, the action now checks:

```typescript
const clientLimit = await checkPlanClientLimit(ctx.member.workspaceId)
if (!clientLimit.allowed) {
  return err('Your plan allows a maximum of 3 clients. Upgrade to add more.')
}
```

The `checkPlanClientLimit` helper:
1. Fetches the workspace's current subscription
2. Looks up the plan's `maxClients` limit
3. Counts current non-deleted clients in the workspace
4. Returns `{ allowed, current, limit }`

### Available Enforcement Helpers

| Helper | Purpose |
|---|---|
| `checkPlanClientLimit(workspaceId)` | Checks if workspace can add more clients |
| `checkPlanTeamLimit(workspaceId)` | Checks if workspace can add more team members |
| `checkPlanFeature(workspaceId, 'teamCollaboration')` | Checks if plan allows team collaboration |
| `checkPlanFeature(workspaceId, 'clientPortal')` | Checks if plan allows client portal |

## Billing Page

The billing page at `/[workspaceSlug]/settings/billing` provides:

- **Current plan display** (name and status badges)
- **Trial end notice** — warning banner with expiry date for trialing accounts
- **Cancelation notice** — warning banner for accounts with `cancelAtPeriodEnd`
- **Active status** — shows next billing date or end-of-service date
- **Upgrade buttons** — "Upgrade to Pro" / "Upgrade to Agency" (for FREE plan users without Stripe)
- **Manage Billing button** — redirects to Stripe Customer Portal (for existing Stripe customers or paid plan users)
- **Plan comparison cards** — three-column grid showing Free, Pro, and Agency features with current plan highlighted

## Subscription Status Mapping

```
Stripe Status      →  Prisma SubscriptionStatus
─────────────────────────────────────────────
active             →  ACTIVE
past_due           →  PAST_DUE
canceled           →  CANCELED
incomplete         →  EXPIRED
incomplete_expired →  EXPIRED
trialing           →  TRIALING
paused             →  ACTIVE
```

## Environment Setup

```env
# Required — Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# Required for webhook verification — Get from Stripe Dashboard > Webhooks
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Price IDs — Create products/prices in Stripe Dashboard
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_AGENCY=price_xxxxxxxxxxxxx
```

## Webhook Configuration

In Stripe Dashboard, create a webhook endpoint pointing to:

```
https://yourdomain.com/api/webhooks/stripe
```

Subscribe to these events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## Test Mode

In Stripe test mode:
1. Set `STRIPE_SECRET_KEY` to your test secret key
2. Set `STRIPE_WEBHOOK_SECRET` to your test webhook secret
3. Create test Price IDs in Stripe Dashboard (with `tiers_mode: volume` disabled)
4. Use Stripe test card `4242 4242 4242 4242` for payments
5. Use Stripe CLI for local webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Existing model unchanged** | The `Subscription` model already has all needed fields (`stripeSubscriptionId`, `stripeCustomerId`, plan, status, periods). No schema migration needed. |
| **Stripe-hosted UIs** | Checkout and Customer Portal are Stripe-hosted, reducing UI complexity and PCI compliance scope. |
| **Webhook-driven sync** | Database is updated via webhooks, ensuring eventual consistency with Stripe. The `upgradeToPlan` action only creates the checkout session. |
| **Plan limits in helper functions** | Enforcement is centralized in `lib/stripe/plans.ts`, making it easy to add new limits or adjust existing ones. |
| **Graceful Stripe absence** | `isStripeConfigured()` check prevents crashes when Stripe is not set up; returns clear error messages. |
| **Type-safe price mapping** | `getPlanFromPriceId()` and `getPriceId()` ensure plan-to-price mapping is consistent. |
| **Server-side enforcement** | Plan limits are enforced in server actions, not client-side, preventing bypass. |

## Verification

- ✅ TypeScript compilation passes with zero errors
- ✅ Checkout session creation returns Stripe-hosted URL
- ✅ Billing Portal session creation returns Stripe-hosted URL
- ✅ Webhook handler processes all 5 event types
- ✅ Plan client limit enforced on `createClient` action
- ✅ Existing subscription model used without modification
- ✅ Environment variables in `.env` and `.env.example`
- ✅ Billing page renders with plan comparison and action buttons
