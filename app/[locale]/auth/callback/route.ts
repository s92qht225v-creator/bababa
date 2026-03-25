import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slugify'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const roleParam = searchParams.get('role')
  const localeParam = searchParams.get('locale')

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('OAuth code exchange failed:', exchangeError.message)
      const loginUrl = new URL(`/${localeParam || 'uz'}/auth/login`, origin)
      loginUrl.searchParams.set('error', 'oauth_failed')
      return NextResponse.redirect(loginUrl.toString())
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, language_preference')
        .eq('id', user.id)
        .single()

      // For new OAuth users: update role/locale if passed from registration
      const isNewUser = profile?.role === 'worker' && roleParam && roleParam !== 'worker'
      const locale = localeParam || profile?.language_preference || 'uz'

      if (isNewUser || (localeParam && localeParam !== profile?.language_preference)) {
        const updates: Record<string, string> = {}
        if (isNewUser) updates.role = roleParam
        if (localeParam) updates.language_preference = localeParam
        await supabase.from('profiles').update(updates).eq('id', user.id)
      }

      const role = isNewUser ? roleParam : (profile?.role ?? 'worker')

      // Create role-specific records for new OAuth users
      if (roleParam === 'employer') {
        const { data: existing } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!existing) {
          const name = user.user_metadata?.full_name || 'Company'
          const baseSlug = slugify(name)
          const { data: slugExists } = await supabase
            .from('companies')
            .select('slug')
            .eq('slug', baseSlug)
            .maybeSingle()

          await supabase.from('companies').insert({
            user_id: user.id,
            slug: slugExists ? `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}` : baseSlug,
            name_original: name,
          })
        }
      } else if (role === 'worker') {
        const { data: existing } = await supabase
          .from('worker_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!existing) {
          const name = user.user_metadata?.full_name || 'worker'
          const baseSlug = slugify(name)
          const { data: slugExists } = await supabase
            .from('worker_profiles')
            .select('slug')
            .eq('slug', baseSlug)
            .maybeSingle()

          await supabase.from('worker_profiles').insert({
            user_id: user.id,
            slug: slugExists ? `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}` : baseSlug,
            profession: '',
          })
        }
      }

      const dashboardMap: Record<string, string> = {
        worker: `/${locale}/worker/dashboard`,
        employer: `/${locale}/employer/dashboard`,
        admin: `/${locale}/admin/dashboard`,
      }

      return NextResponse.redirect(`${origin}${dashboardMap[role] || `/${locale}`}`)
    }
  }

  return NextResponse.redirect(`${origin}/uz`)
}
