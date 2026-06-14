import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const session = await auth()
  console.log('[ONBOARDING] session:', JSON.stringify({
    exists: !!session,
    id: session?.user?.id,
    workspaceSlug: session?.user?.workspaceSlug,
    onboardingComplete: session?.user?.onboardingComplete,
  }))

  if (!session?.user?.id) {
    console.log('[ONBOARDING] No session, redirecting to /login')
    redirect('/login')
  }

  if (session.user.workspaceSlug) {
    console.log('[ONBOARDING] Has workspace, redirecting to dashboard:', session.user.workspaceSlug)
    redirect(`/${session.user.workspaceSlug}/dashboard`)
  }

  // Authenticated but no workspace — show a fallback page instead of looping
  console.log('[ONBOARDING] Authenticated but no workspaceSlug — should not happen if signIn callback creates workspace')
  redirect('/login?error=NoWorkspace')
}
