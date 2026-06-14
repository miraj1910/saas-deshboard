import NextAuth from 'next-auth'
import { config as authConfig } from '@/lib/auth.config'
import { checkRateLimit } from '@/lib/rate-limiter'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

const LOOP_PROTECTION_COOKIE = 'x-mw-loop-protection'

// Known non-workspace route prefixes — slug extraction skips these
const NON_WORKSPACE_ROUTES = new Set([
  'onboarding', 'login', 'signup', 'register',
  'forgot-password', 'reset-password', 'pricing',
  'invite', 'portal', 'api',
])

function getCookie(name: string, cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(name + '=')) {
      return trimmed.slice(name.length + 1)
    }
  }
  return null
}

function extractSlug(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)(?:\/|$)/)
  if (!match) return null
  const slug = match[1]
  if (NON_WORKSPACE_ROUTES.has(slug)) return null
  if (slug.startsWith('_') || slug.includes('.')) return null
  return slug
}

const PUBLIC_PATHS = [
  '/', '/pricing', '/login', '/register', '/signup',
  '/forgot-password', '/reset-password', '/invite', '/api/auth',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export default auth((req) => {
  const { pathname, searchParams } = req.nextUrl
  const { auth: session } = req
  const hostname = req.headers.get('host') ?? ''
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '127.0.0.1'
  const cookies = req.headers.get('cookie')

  console.log('[MW] pathname:', pathname, 'hasSession:', !!session, 'session.user:', session ? JSON.stringify({ id: session.user?.id, workspaceSlug: session.user?.workspaceSlug, onboardingComplete: session.user?.onboardingComplete }) : 'null')

  // ---- Loop protection ----
  const redirectTarget = getCookie(LOOP_PROTECTION_COOKIE, cookies)
  const isLoop = redirectTarget === pathname
  if (isLoop) {
    console.log('[MW] Loop detected for pathname:', pathname, '- allowing request through')
  }

  // Rate limiting on auth routes
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/register') || pathname.startsWith('/api/auth')) {
    const { allowed, remaining, resetAt } = checkRateLimit(ip, pathname)
    const response = allowed ? NextResponse.next() : NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } },
    )
    if (!allowed) return response
  }

  // Portal route — skip workspace slug for client portal paths
  if (pathname.startsWith('/portal')) {
    if (!session) {
      const callbackUrl = encodeURIComponent(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url))
    }
    return NextResponse.next()
  }

  // Portal subdomain rewrite
  if (hostname.startsWith('client.')) {
    req.nextUrl.pathname = `/(portal)${pathname}`
    return NextResponse.rewrite(req.nextUrl)
  }

  // Public routes — no auth needed, but redirect authenticated users away from landing/auth pages
  if (isPublic(pathname)) {
    if (session && ['/', '/login', '/signup', '/register'].includes(pathname)) {
      if (session.user.onboardingComplete && session.user.workspaceSlug) {
        console.log('[MW] Authenticated + onboarded on public page, redirecting to dashboard:', session.user.workspaceSlug)
        return NextResponse.redirect(new URL(`/${session.user.workspaceSlug}/dashboard`, req.url))
      }
      if (!isLoop) {
        console.log('[MW] Authenticated on public page, redirecting to /onboarding')
        const res = NextResponse.redirect(new URL('/onboarding', req.url))
        res.cookies.set(LOOP_PROTECTION_COOKIE, '/onboarding', { maxAge: 30, path: '/' })
        return res
      }
      console.log('[MW] Loop bypass on public page, allowing request through')
      return NextResponse.next()
    }
    return NextResponse.next()
  }

  // Auth check
  if (!session) {
    console.log('[MW] No session on protected route, redirecting to /login')
    const callbackUrl = encodeURIComponent(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url))
  }

  // Onboarding check — workspace route slug resolution
  const slug = extractSlug(pathname)

  // If onboarding is not complete, redirect to onboarding (unless loop detected or already there)
  if (!session.user.onboardingComplete) {
    if (pathname !== '/onboarding' && !isLoop) {
      console.log('[MW] onboardingComplete false, redirecting to /onboarding')
      const res = NextResponse.redirect(new URL('/onboarding', req.url))
      res.cookies.set(LOOP_PROTECTION_COOKIE, '/onboarding', { maxAge: 30, path: '/' })
      return res
    }
    // Already on /onboarding or loop detected — let it render
    console.log('[MW] onboardingComplete false but allowing request through (pathname:', pathname, ')')
    const requestHeaders = new Headers(req.headers)
    if (slug) {
      requestHeaders.set('X-Workspace-Slug', slug)
    }
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Onboarding is complete — handle workspace routing
  if (slug) {
    if (session.user.workspaceSlug && session.user.workspaceSlug !== slug) {
      console.log('[MW] Workspace slug mismatch, redirecting to', `/${session.user.workspaceSlug}/dashboard`)
      return NextResponse.redirect(new URL(`/${session.user.workspaceSlug}/dashboard`, req.url))
    }

    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('X-Workspace-Slug', slug)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Onboarding complete but no path slug — check session for workspaceSlug
  if (!session.user.workspaceSlug) {
    // Session says onboarding is complete but has no workspaceSlug — redirect to onboarding recovery
    if (!isLoop) {
      console.log('[MW] Onboarding complete but no workspaceSlug, redirecting to /onboarding')
      const res = NextResponse.redirect(new URL('/onboarding', req.url))
      res.cookies.set(LOOP_PROTECTION_COOKIE, '/onboarding', { maxAge: 30, path: '/' })
      return res
    }
    console.log('[MW] Loop bypass for missing workspaceSlug, allowing request through')
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
