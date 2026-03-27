import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'email' | 'recovery' | 'invite' | null
  const code = searchParams.get('code')

  const supabase = await createClient()

  // Handle PKCE flow (code-based)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Confirm code exchange failed:', error.message)
      return NextResponse.redirect(`${origin}/uz/auth/login?error=confirm_failed`)
    }
  }

  // Handle token_hash flow (older email templates)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) {
      console.error('Email verification failed:', error.message)
      return NextResponse.redirect(`${origin}/uz/auth/login?error=confirm_failed`)
    }
  }

  // Get user and redirect to dashboard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/uz/auth/login`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, language_preference')
    .eq('id', user.id)
    .single()

  const locale = profile?.language_preference || 'uz'
  const role = profile?.role || 'worker'

  const dashboardMap: Record<string, string> = {
    worker: `/${locale}/worker/dashboard`,
    employer: `/${locale}/employer/dashboard`,
    admin: `/${locale}/admin/dashboard`,
  }

  return NextResponse.redirect(`${origin}${dashboardMap[role] || `/${locale}`}`)
}
