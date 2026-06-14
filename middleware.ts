import { auth } from '@/lib/auth'
import { isPublic, extractSlug } from '@/lib/auth.config'
import { checkRateLimit } from '@/lib/rate-limiter'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname, searchParams } = req.nextUrl
  const { auth: session } = req
  const hostname = req.headers.get('host') ?? ''
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '127.0.0.1'

  console.log('[MW] pathname:', pathname, 'hasSession:', !!session, 'session.user:', session ? JSON.stringify({ id: session.user?.id, workspaceSlug: session.user?.workspaceSlug, onboardingComplete: session.user?.onboardingComplete }) : 'null')

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
      console.log('[MW] Authenticated on public page, redirecting to /onboarding')
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
    return NextResponse.next()
  }

  // Auth check
  if (!session) {
    console.log('[MW] No session on protected route, redirecting to /login')
    const callbackUrl = encodeURIComponent(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url))
  }

  // Onboarding check
  if (!session.user.onboardingComplete && pathname !== '/onboarding') {
    console.log('[MW] onboardingComplete false, redirecting to /onboarding')
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  // Workspace route resolution
  const slug = extractSlug(pathname)
  if (slug) {
    if (session.user.workspaceSlug && session.user.workspaceSlug !== slug) {
      console.log('[MW] Workspace slug mismatch, redirecting to', `/${session.user.workspaceSlug}/dashboard`)
      return NextResponse.redirect(new URL(`/${session.user.workspaceSlug}/dashboard`, req.url))
    }

    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('X-Workspace-Slug', slug)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
