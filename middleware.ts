import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

function getLocale(pathname: string): string {
  const match = pathname.match(/^\/(uz|zh|ru)/)
  return match ? match[1] : routing.defaultLocale
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const locale = getLocale(pathname)
  const path = pathname.replace(/^\/(uz|zh|ru)/, '')

  // Auth pages: redirect away if already logged in
  const isAuthPage = path === '/auth/login' || path === '/auth/register'

  // Protected route prefixes
  const isWorkerRoute = path.startsWith('/worker/') || path === '/worker'
  const isEmployerRoute = path.startsWith('/employer/') || path === '/employer'
  const isAdminRoute = path.startsWith('/admin')
  const isProtected = isWorkerRoute || isEmployerRoute || isAdminRoute

  if (!isProtected && !isAuthPage) {
    return intlMiddleware(request)
  }

  // Build Supabase client in middleware
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Auth pages: redirect logged-in users to their dashboard
  if (isAuthPage && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profile) {
      if (profile.is_active === false) {
        const loginUrl = new URL(`/${locale}/auth/login`, request.url)
        loginUrl.searchParams.set('suspended', 'true')
        await supabase.auth.signOut()
        return NextResponse.redirect(loginUrl)
      }

      const dashboards: Record<string, string> = {
        worker: `/${locale}/worker/dashboard`,
        employer: `/${locale}/employer/dashboard`,
        admin: `/${locale}/admin/dashboard`,
      }
      const dest = dashboards[profile.role]
      if (dest) return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  // Protected routes: must be logged in
  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role enforcement
  if (isProtected && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profile) {
      if (profile.is_active === false) {
        const loginUrl = new URL(`/${locale}/auth/login`, request.url)
        loginUrl.searchParams.set('suspended', 'true')
        await supabase.auth.signOut()
        return NextResponse.redirect(loginUrl)
      }
      if (isEmployerRoute && profile.role === 'worker') {
        return NextResponse.redirect(
          new URL(`/${locale}/worker/dashboard`, request.url)
        )
      }
      if (isWorkerRoute && profile.role === 'employer') {
        return NextResponse.redirect(
          new URL(`/${locale}/employer/dashboard`, request.url)
        )
      }
      if (isAdminRoute && profile.role !== 'admin') {
        return NextResponse.redirect(new URL(`/${locale}`, request.url))
      }
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
