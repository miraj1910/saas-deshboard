'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createWorkspaceAction } from './actions'

export function OnboardingRecovery({ email }: { email: string }) {
  const router = useRouter()
  const [action, setAction] = useState<'retry' | 'create' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRetry() {
    setAction('retry')
    setError(null)
    try {
      const res = await fetch('/api/auth/session?update')
      if (res.ok) {
        router.refresh()
      } else {
        setError('Failed to refresh session. Please try again.')
        setAction(null)
      }
    } catch {
      setError('Network error. Please try again.')
      setAction(null)
    }
  }

  async function handleCreateWorkspace() {
    setAction('create')
    setError(null)
    const result = await createWorkspaceAction()
    if (result.success && result.slug) {
      try {
        await fetch('/api/auth/session?update')
      } catch {
        // Session update is best-effort; the redirect will re-read from JWT
      }
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to create workspace.')
      setAction(null)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl">
            ⚠️
          </div>
          <CardTitle>Workspace Not Found</CardTitle>
          <CardDescription>
            We couldn&apos;t find a workspace associated with your account.
            This can happen if there was a temporary issue loading your workspace data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-surface-3 p-3 text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{email}</span>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handleRetry}
              disabled={action === 'retry'}
            >
              {action === 'retry' ? 'Refreshing...' : 'Retry Loading Workspace'}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleCreateWorkspace}
              disabled={action === 'create'}
            >
              {action === 'create' ? 'Creating...' : 'Create New Workspace'}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-center text-sm text-muted-foreground">
          <p>
            If the problem persists, please{' '}
            <a
              href="mailto:support@flowdesk.com"
              className="font-medium text-foreground underline underline-offset-4 hover:text-teal-600"
            >
              contact support
            </a>
            .
          </p>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Sign out and try again
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
