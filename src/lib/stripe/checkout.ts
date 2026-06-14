import { getStripeClient, getPriceId, isStripeConfigured } from './index'

export type CreateCheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string }

export async function createCheckoutSession(
  workspaceId: string,
  customerEmail: string,
  plan: 'PRO' | 'AGENCY',
  origin: string,
): Promise<CreateCheckoutResult> {
  if (!isStripeConfigured()) {
    return { success: false, error: 'Stripe is not configured' }
  }

  try {
    const stripe = getStripeClient()
    const priceId = getPriceId(plan)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: customerEmail,
      client_reference_id: workspaceId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { workspaceId },
      subscription_data: {
        metadata: { workspaceId },
      },
      success_url: `${origin}/settings/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/settings/billing?canceled=true`,
    })

    if (!session.url) {
      return { success: false, error: 'Failed to create checkout session' }
    }

    return { success: true, url: session.url }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create checkout session'
    return { success: false, error: message }
  }
}
