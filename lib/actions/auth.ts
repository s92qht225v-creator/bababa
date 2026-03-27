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
  confirmEmail?: boolean
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

  // If email confirmation is required, user won't be confirmed yet
  const needsConfirmation = data.user?.identities?.length === 0 ||
    data.user?.email_confirmed_at === null

  // Create role-specific row
  if (input.role === 'worker') {
    const baseSlug = slugify(input.fullName)
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

    if (needsConfirmation) return { confirmEmail: true }
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

    if (needsConfirmation) return { confirmEmail: true }
    return { redirectTo: `/${input.languagePreference}/employer/dashboard` }
  }

  if (needsConfirmation) return { confirmEmail: true }
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
    if (error.message.includes('Email not confirmed')) {
      return { error: 'error_email_not_confirmed' }
    }
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

  // Update last_active for workers
  if (profile.role === 'worker') {
    await supabase
      .from('worker_profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('user_id', user.id)
  }

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

export async function resendConfirmation(email: string): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) {
    if (error.message.includes('rate') || error.message.includes('limit')) {
      return { error: 'error_resend_rate_limit' }
    }
    return { error: error.message }
  }

  return {}
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
