import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripeClient = new Stripe(key, { typescript: true })
  }
  return stripeClient
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

export const STRIPE_PRICE_IDS = {
  PRO: process.env.STRIPE_PRICE_ID_PRO ?? '',
  AGENCY: process.env.STRIPE_PRICE_ID_AGENCY ?? '',
} as const

export function getPriceId(plan: 'PRO' | 'AGENCY'): string {
  const id = STRIPE_PRICE_IDS[plan]
  if (!id) throw new Error(`No Stripe Price ID configured for plan: ${plan}`)
  return id
}

export function getPlanFromPriceId(priceId: string): 'PRO' | 'AGENCY' | null {
  if (priceId === STRIPE_PRICE_IDS.PRO) return 'PRO'
  if (priceId === STRIPE_PRICE_IDS.AGENCY) return 'AGENCY'
  return null
}
