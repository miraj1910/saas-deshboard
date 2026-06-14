import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { logger } from '@/lib/logger'

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
      logger.info('[AUTH:signIn] Starting', { provider: account?.provider, email: user.email, userId: user.id })

      if (account?.provider === 'google') {
        const { prisma } = await import('@/lib/prisma')

        try {
          const existing = await prisma.user.findUnique({ where: { email: user.email! } })
          if (existing?.deletedAt) {
            logger.warn('[AUTH:signIn] Account disabled', { email: user.email })
            return '/login?error=AccountDisabled'
          }
          if (existing?.userType === 'CLIENT') {
            logger.warn('[AUTH:signIn] Client login restricted', { email: user.email })
            return '/login?error=ClientLoginRestricted'
          }

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
            logger.info('[AUTH:signIn] New user created', { userId, email: user.email })
          } else {
            logger.info('[AUTH:signIn] Existing user found', { userId, email: user.email })
          }

          const membership = await prisma.workspaceMember.findFirst({
            where: { userId },
          })

          if (!membership) {
            logger.info('[AUTH:signIn] No membership found, creating workspace', { userId, email: user.email })
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
            logger.info('[AUTH:signIn] Workspace created', { userId, email: user.email, slug: `${raw}-${suffix}` })
          } else {
            logger.info('[AUTH:signIn] Existing membership found', { userId, email: user.email, workspaceMemberId: membership.id })
          }
        } catch (e) {
          logger.error('[AUTH:signIn] Failed during Google sign-in', {
            userId: user.id,
            email: user.email,
            error: e instanceof Error ? e.message : String(e),
            stack: e instanceof Error ? e.stack : undefined,
          })
          return false
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      logger.info('[AUTH:jwt] Callback invoked', {
        hasUser: !!user,
        trigger,
        sub: token.sub,
        currentWorkspaceSlug: token.workspaceSlug,
        currentOnboardingComplete: token.onboardingComplete,
      })

      if (user) {
        token.sub = user.id
        if (user.userType) token.userType = user.userType

        try {
          const { prisma } = await import('@/lib/prisma')
          logger.info('[AUTH:jwt] Querying membership for user', { userId: user.id })
          const membership = await prisma.workspaceMember.findFirst({
            where: { userId: user.id },
            include: { workspace: { select: { slug: true } } },
          })

          if (membership?.workspace?.slug) {
            token.workspaceSlug = membership.workspace.slug
            token.onboardingComplete = true
            logger.info('[AUTH:jwt] Membership found', {
              userId: user.id,
              workspaceSlug: membership.workspace.slug,
              onboardingComplete: true,
            })
          } else {
            token.workspaceSlug = null
            token.onboardingComplete = false
            logger.warn('[AUTH:jwt] No membership found for user', {
              userId: user.id,
              workspaceSlug: null,
              onboardingComplete: false,
            })
          }
        } catch (e) {
          token.workspaceSlug = null
          token.onboardingComplete = false
          logger.error('[AUTH:jwt] Membership query failed on sign-in', {
            userId: user.id,
            error: e instanceof Error ? e.message : String(e),
            stack: e instanceof Error ? e.stack : undefined,
          })
        }

        logger.info('[AUTH:jwt] Token after sign-in', {
          sub: token.sub,
          workspaceSlug: token.workspaceSlug,
          onboardingComplete: token.onboardingComplete,
          userType: token.userType,
        })
      }

      if (trigger === 'update' && token.sub) {
        try {
          const { prisma } = await import('@/lib/prisma')
          logger.info('[AUTH:jwt] Re-querying membership on update trigger', { sub: token.sub })
          const membership = await prisma.workspaceMember.findFirst({
            where: { userId: token.sub },
            include: { workspace: { select: { slug: true } } },
          })

          if (membership?.workspace?.slug) {
            token.workspaceSlug = membership.workspace.slug
            token.onboardingComplete = true
            logger.info('[AUTH:jwt] Membership updated', {
              sub: token.sub,
              workspaceSlug: membership.workspace.slug,
              onboardingComplete: true,
            })
          } else {
            token.workspaceSlug = null
            token.onboardingComplete = false
            logger.warn('[AUTH:jwt] No membership after update', {
              sub: token.sub,
              workspaceSlug: null,
              onboardingComplete: false,
            })
          }
        } catch (e) {
          logger.error('[AUTH:jwt] Membership query failed on update', {
            sub: token.sub,
            error: e instanceof Error ? e.message : String(e),
            stack: e instanceof Error ? e.stack : undefined,
          })
        }
      }

      logger.info('[AUTH:jwt] Final token payload', {
        sub: token.sub,
        workspaceSlug: token.workspaceSlug,
        onboardingComplete: token.onboardingComplete,
        userType: token.userType,
        trigger,
      })

      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? ''
      session.user.userType = token.userType
      session.user.workspaceSlug = token.workspaceSlug
      session.user.onboardingComplete = token.onboardingComplete

      logger.info('[AUTH:session] Session built', {
        id: session.user.id,
        workspaceSlug: session.user.workspaceSlug,
        onboardingComplete: session.user.onboardingComplete,
        userType: session.user.userType,
      })

      return session
    },
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
} satisfies NextAuthConfig

export { isPublic, extractSlug }
