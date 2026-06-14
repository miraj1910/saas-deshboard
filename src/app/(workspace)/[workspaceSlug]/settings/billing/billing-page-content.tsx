'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { upgradeToPlan, openBillingPortal } from '@/features/subscription/_actions'

const PLAN_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'default' | 'secondary' | 'outline' }> = {
  FREE: { label: 'Free', variant: 'secondary' },
  PRO: { label: 'Pro', variant: 'success' },
  AGENCY: { label: 'Agency', variant: 'default' },
}

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  TRIALING: { label: 'Trial', variant: 'warning' },
  PAST_DUE: { label: 'Past Due', variant: 'destructive' },
  CANCELED: { label: 'Canceled', variant: 'outline' },
  EXPIRED: { label: 'Expired', variant: 'outline' },
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

type Props = {
  workspaceSlug: string
  plan: string
  status: string
  currentPeriodEnd: Date
  trialEndsAt: Date | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
  canManage: boolean
}

export function BillingPageContent({
  workspaceSlug,
  plan,
  status,
  currentPeriodEnd,
  trialEndsAt,
  cancelAtPeriodEnd,
  stripeCustomerId,
  canManage,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = useCallback(async (targetPlan: 'PRO' | 'AGENCY') => {
    setLoading(`upgrade-${targetPlan}`)
    setError(null)

    const result = await upgradeToPlan(workspaceSlug, targetPlan, window.location.origin)

    if (result.success) {
      window.location.href = result.data.url
    } else {
      setError(result.error)
      setLoading(null)
    }
  }, [workspaceSlug])

  const handlePortal = useCallback(async () => {
    setLoading('portal')
    setError(null)

    const result = await openBillingPortal(workspaceSlug, window.location.origin)

    if (result.success) {
      window.location.href = result.data.url
    } else {
      setError(result.error)
      setLoading(null)
    }
  }, [workspaceSlug])

  const planConfig = PLAN_LABELS[plan] ?? { label: plan, variant: 'default' as const }
  const statusConfig = STATUS_LABELS[status] ?? { label: status, variant: 'outline' as const }
  const isOnFree = plan === 'FREE'
  const hasStripe = !!stripeCustomerId
  const isTrialing = status === 'TRIALING'

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription plan and billing details.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your workspace subscription plan</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={planConfig.variant}>{planConfig.label}</Badge>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isTrialing && trialEndsAt && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Your trial ends on {fmtDate(trialEndsAt)}. Upgrade to keep using FlowDesk.</span>
            </div>
          )}
          {cancelAtPeriodEnd && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Your subscription will be canceled at the end of the billing period ({fmtDate(currentPeriodEnd)}).</span>
            </div>
          )}
          {status === 'ACTIVE' && (
            <div className="flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                {cancelAtPeriodEnd
                  ? `Plan active until ${fmtDate(currentPeriodEnd)}`
                  : `Next billing date: ${fmtDate(currentPeriodEnd)}`
                }
              </span>
            </div>
          )}
        </CardContent>
        {canManage && (
          <CardFooter className="flex justify-end gap-3 border-t px-6 py-4">
            {hasStripe ? (
              <Button variant="outline" onClick={handlePortal} disabled={loading === 'portal'}>
                {loading === 'portal' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Manage Billing
              </Button>
            ) : (
              <>
                {isOnFree && (
                  <>
                    <Button onClick={() => handleUpgrade('PRO')} disabled={loading === 'upgrade-PRO'}>
                      {loading === 'upgrade-PRO' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Upgrade to Pro
                    </Button>
                    <Button variant="outline" onClick={() => handleUpgrade('AGENCY')} disabled={loading === 'upgrade-AGENCY'}>
                      {loading === 'upgrade-AGENCY' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Upgrade to Agency
                    </Button>
                  </>
                )}
                {!isOnFree && (
                  <Button variant="outline" onClick={handlePortal} disabled={loading === 'portal'}>
                    {loading === 'portal' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Manage Billing
                  </Button>
                )}
              </>
            )}
          </CardFooter>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={plan === 'FREE' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="text-lg">Free</CardTitle>
            <CardDescription>For solo freelancers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-3xl font-bold">$0</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500" /> Up to 3 clients
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500" /> Time tracking
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500" /> Basic invoicing
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className={plan === 'PRO' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="text-lg">Pro</CardTitle>
            <CardDescription>For growing agencies</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-3xl font-bold">$29</p>
            <p className="-mt-3 mb-4 text-sm text-muted-foreground">per month</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500" /> Unlimited clients
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500" /> Team collaboration
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500" /> Client portal
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500" /> Advanced reports
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className={plan === 'AGENCY' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="text-lg">Agency</CardTitle>
            <CardDescription>For large teams</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-3xl font-bold">$79</p>
            <p className="-mt-3 mb-4 text-sm text-muted-foreground">per month</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500" /> Unlimited clients
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500" /> Unlimited team members
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500" /> All Pro features
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500" /> Priority support
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
