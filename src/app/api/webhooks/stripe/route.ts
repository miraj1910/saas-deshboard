import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripeClient, getPlanFromPriceId } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  try {
    const stripe = getStripeClient()
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const workspaceId = session.client_reference_id || session.metadata?.workspaceId
        if (!workspaceId) {
          return NextResponse.json({ error: 'No workspace ID in session' }, { status: 400 })
        }

        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (subscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = stripeSub.items.data[0]?.price.id
          const plan = priceId ? getPlanFromPriceId(priceId) : null

          await prisma.subscription.updateMany({
            where: { workspaceId },
            data: {
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId,
              plan: plan ?? 'PRO',
              status: mapStripeStatus(stripeSub.status),
              currentPeriodStart: new Date((stripeSub as any).current_period_start * 1000),
              currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
              trialEndsAt: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            },
          })
        }

        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id
        const plan = priceId ? getPlanFromPriceId(priceId) : null

        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        })

        if (existing) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: {
              plan: plan ?? existing.plan,
              status: mapStripeStatus(sub.status),
              currentPeriodStart: new Date((sub as any).current_period_start * 1000),
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
              trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : existing.trialEndsAt,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          })
        }

        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        })

        if (existing) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: {
              status: sub.status === 'canceled' ? 'CANCELED' : 'EXPIRED',
              cancelAtPeriodEnd: false,
            },
          })
        }

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string | null

        if (subscriptionId) {
          const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          })

          if (subscription) {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: 'ACTIVE' },
            })
          }
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string | null

        if (subscriptionId) {
          const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          })

          if (subscription) {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: 'PAST_DUE' },
            })
          }
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Webhook handler error'
    console.error('[Stripe Webhook]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function mapStripeStatus(stripeStatus: string): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'TRIALING' {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE'
    case 'past_due':
      return 'PAST_DUE'
    case 'canceled':
      return 'CANCELED'
    case 'incomplete':
    case 'incomplete_expired':
      return 'EXPIRED'
    case 'trialing':
      return 'TRIALING'
    case 'paused':
      return 'ACTIVE'
    default:
      return 'ACTIVE'
  }
}
