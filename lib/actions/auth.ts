'use server'

import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slugify'
import type { Locale, UserRole } from '@/types'

interface RegisterInput {
  fullName: string
  email: string
  password: string
  phone: string
  role: UserRole
  companyName?: string
  languagePreference: Locale
}

interface AuthResult {
  error?: string
  redirectTo?: string
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const supabase = await createClient()

  // Create auth user — the DB trigger auto-creates the profiles row
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        phone: input.phone || null,
        role: input.role,
        language_preference: input.languagePreference,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'error_email_taken' }
    }
    if (error.message.includes('Password')) {
      return { error: 'error_weak_password' }
    }
    return { error: error.message }
  }

  const userId = data.user?.id
  if (!userId) return { error: 'Registration failed' }

  // Create role-specific row
  if (input.role === 'worker') {
    const baseSlug = slugify(input.fullName)
    // Check uniqueness, append random suffix if needed
    const { data: existing } = await supabase
      .from('worker_profiles')
      .select('slug')
      .eq('slug', baseSlug)
      .limit(1)
      .single()

    const slug = existing
      ? `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`
      : baseSlug

    await supabase.from('worker_profiles').insert({
      user_id: userId,
      slug,
      profession: '',
    })

    return { redirectTo: `/${input.languagePreference}/worker/dashboard` }
  }

  if (input.role === 'employer') {
    const companyName = input.companyName || input.fullName
    const baseSlug = slugify(companyName)
    const { data: existing } = await supabase
      .from('companies')
      .select('slug')
      .eq('slug', baseSlug)
      .limit(1)
      .single()

    const slug = existing
      ? `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`
      : baseSlug

    await supabase.from('companies').insert({
      user_id: userId,
      slug,
      name_original: companyName,
    })

    return { redirectTo: `/${input.languagePreference}/employer/dashboard` }
  }

  return { redirectTo: `/${input.languagePreference}` }
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'error_invalid_credentials' }
  }

  // Fetch profile to determine role
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'error_invalid_credentials' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, language_preference')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'error_invalid_credentials' }

  const locale = profile.language_preference || 'uz'
  const dashboardMap: Record<string, string> = {
    worker: `/${locale}/worker/dashboard`,
    employer: `/${locale}/employer/dashboard`,
    admin: `/${locale}/admin/dashboard`,
  }

  return { redirectTo: dashboardMap[profile.role] || `/${locale}` }
}

export async function forgotPassword(email: string): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
  })

  if (error) {
    return { error: error.message }
  }

  return {}
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
