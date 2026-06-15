import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { OnboardingRecovery } from './recovery-ui'

export default async function OnboardingPage() {
  const session = await auth()

  console.log('[ONBOARDING] session:', JSON.stringify({
    exists: !!session,
    id: session?.user?.id,
    workspaceSlug: session?.user?.workspaceSlug,
    onboardingComplete: session?.user?.onboardingComplete,
  }))

  if (!session?.user?.id) {
    console.log('[ONBOARDING] No session, redirecting to /login?error=NoWorkspace')
    redirect('/login?error=NoWorkspace')
  }

  if (session.user.workspaceSlug) {
    console.log('[ONBOARDING] Has workspace, redirecting to dashboard:', session.user.workspaceSlug)
    redirect(`/${session.user.workspaceSlug}/dashboard`)
  }

  return <OnboardingRecovery email={session.user.email ?? ''} />
}
