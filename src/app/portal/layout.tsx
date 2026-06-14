import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PortalNav } from '@/features/portal/components/portal-nav'
import { checkPlanFeature } from '@/lib/stripe/plans'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const clientMember = await prisma.clientMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  })

  if (clientMember) {
    const hasPortal = await checkPlanFeature(clientMember.workspaceId, 'clientPortal')
    if (!hasPortal) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-semibold tracking-tight">Client Portal Unavailable</h1>
            <p className="text-sm text-muted-foreground">
              The client portal is not included in your workspace&apos;s current plan.
              Please contact your workspace owner to upgrade.
            </p>
            <Button asChild variant="outline">
              <Link href="/login">Back to login</Link>
            </Button>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalNav />
      <div className="md:pl-56">
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
