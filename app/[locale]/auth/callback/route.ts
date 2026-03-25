import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, language_preference')
        .eq('id', user.id)
        .single()

      const locale = profile?.language_preference || 'uz'
      const dashboardMap: Record<string, string> = {
        worker: `/${locale}/worker/dashboard`,
        employer: `/${locale}/employer/dashboard`,
        admin: `/${locale}/admin/dashboard`,
      }

      return NextResponse.redirect(`${origin}${dashboardMap[profile?.role ?? 'worker'] || `/${locale}`}`)
    }
  }

  return NextResponse.redirect(`${origin}/uz`)
}
