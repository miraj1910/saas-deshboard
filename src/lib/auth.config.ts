import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

const publicPages = [
  '/', '/pricing', '/login', '/register', '/signup',
  '/forgot-password', '/reset-password', '/invite', '/api/auth',
]

function isPublic(pathname: string): boolean {
  return publicPages.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function extractSlug(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)(?:\/|$)/)
  return match ? match[1] : null
}

export const config = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: { params: { prompt: 'consent', access_type: 'offline' } },
    }),
    Credentials({
      async authorize(credentials) {
        const { prisma } = await import('@/lib/prisma')
        const bcrypt = await import('bcryptjs')

        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user || user.deletedAt) return null

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) return null

        return { id: user.id, email: user.email, name: user.name, userType: user.userType, image: user.avatarUrl }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider === 'google') {
        const { prisma } = await import('@/lib/prisma')

        const existing = await prisma.user.findUnique({ where: { email: user.email! } })
        if (existing?.deletedAt) return '/login?error=AccountDisabled'
        if (existing?.userType === 'CLIENT') return '/login?error=ClientLoginRestricted'

        let userId = existing?.id
        if (!userId) {
          const created = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name ?? '',
              passwordHash: 'OAUTH',
              userType: 'TEAM',
              avatarUrl: user.image,
            },
          })
          userId = created.id
        }

        const membership = await prisma.workspaceMember.findFirst({
          where: { userId },
        })

        if (!membership) {
          console.log('[AUTH:signIn] Creating workspace for userId:', userId)
          const raw = (user.name ?? 'workspace').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 50).replace(/^-|-$/g, '') || 'workspace'
          const suffix = Math.random().toString(36).slice(2, 6)

          await prisma.workspace.create({
            data: {
              name: user.name ?? 'My Workspace',
              slug: `${raw}-${suffix}`,
              settings: {
                create: { timezone: 'UTC', primaryColor: '#6366F1', theme: { darkMode: false, fontSize: 'normal' } },
              },
              subscriptions: {
                create: {
                  plan: 'FREE',
                  status: 'TRIALING',
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                  trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                  cancelAtPeriodEnd: false,
                },
              },
              members: { create: { userId, role: 'OWNER' } },
            },
          })
          console.log('[AUTH:signIn] Workspace created for userId:', userId)
        } else {
          console.log('[AUTH:signIn] Existing membership found for userId:', userId)
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      // On sign-in: populate token from DB user and create session fields
      if (user) {
        token.sub = user.id
        if (user.userType) token.userType = user.userType

        try {
          const { prisma } = await import('@/lib/prisma')
          const membership = await prisma.workspaceMember.findFirst({
            where: { userId: user.id },
            include: { workspace: { select: { slug: true } } },
          })
          token.workspaceSlug = membership?.workspace.slug ?? null
          token.onboardingComplete = !!membership
        } catch (e) {
          console.error('[AUTH:jwt] Membership query failed on sign-in:', e)
          token.workspaceSlug = null
          token.onboardingComplete = false
        }

        console.log('[AUTH:jwt] Token after sign-in:', JSON.stringify({ sub: token.sub, workspaceSlug: token.workspaceSlug, onboardingComplete: token.onboardingComplete, userType: token.userType }))
      }

      // On trigger update: re-fetch membership
      if (trigger === 'update' && token.sub) {
        try {
          const { prisma } = await import('@/lib/prisma')
          const membership = await prisma.workspaceMember.findFirst({
            where: { userId: token.sub },
            include: { workspace: { select: { slug: true } } },
          })
          token.workspaceSlug = membership?.workspace.slug ?? null
          token.onboardingComplete = !!membership
        } catch (e) {
          console.error('[AUTH:jwt] Membership query failed on update:', e)
        }
      }

      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? ''
      session.user.userType = token.userType
      session.user.workspaceSlug = token.workspaceSlug
      session.user.onboardingComplete = token.onboardingComplete
      console.log('[AUTH:session] Session built:', JSON.stringify({ id: session.user.id, workspaceSlug: session.user.workspaceSlug, onboardingComplete: session.user.onboardingComplete }))
      return session
    },
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
} satisfies NextAuthConfig

export { isPublic, extractSlug }
