'use server'

import { createClient } from '@/lib/supabase/server'
import { translateBio } from '@/lib/translate'
import { revalidatePath } from 'next/cache'
import type { Locale, AvailabilityStatus, ExperienceEntry } from '@/types'

export interface SaveProfileInput {
  fullName: string
  phone: string
  age: number | null
  gender: string | null
  locationId: string
  profession: string
  categoryId: string
  experienceYears: number
  skills: string[]
  hskLevel: number
  languages: string[]
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  availabilityStatus: AvailabilityStatus
  availableFrom: string | null
  bioOriginal: string
  sourceLanguage: Locale
  experienceHistory: ExperienceEntry[]
  isPublic: boolean
}

export interface ActionResult {
  success: boolean
  error?: string
  isPublic?: boolean
}

export async function saveWorkerProfile(input: SaveProfileInput): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Update profile table (name, phone)
  await supabase
    .from('profiles')
    .update({ full_name: input.fullName, phone: input.phone })
    .eq('id', user.id)

  // Translate bio
  let bioZh = input.bioOriginal
  let bioUz = input.bioOriginal
  let bioRu = input.bioOriginal
  let bioStatus: 'complete' | 'failed' = 'complete'

  if (input.bioOriginal && input.bioOriginal.length >= 30) {
    try {
      const translations = await translateBio(input.bioOriginal, input.sourceLanguage)
      bioZh = translations.bio_zh
      bioUz = translations.bio_uz
      bioRu = translations.bio_ru
    } catch {
      bioStatus = 'failed'
    }
  }

  // Check if profile already exists
  const { data: existing } = await supabase
    .from('worker_profiles')
    .select('id, slug')
    .eq('user_id', user.id)
    .single()

  const updateData = {
    age: input.age,
    gender: input.gender,
    location_id: input.locationId || null,
    profession: input.profession || '',
    category_id: input.categoryId || null,
    experience_years: input.experienceYears,
    skills: input.skills,
    hsk_level: input.hskLevel,
    languages: input.languages,
    expected_salary_min: input.salaryMin,
    expected_salary_max: input.salaryMax,
    salary_currency: input.salaryCurrency,
    availability_status: input.availabilityStatus,
    available_from: input.availableFrom || null,
    bio_original: input.bioOriginal || null,
    bio_zh: bioZh,
    bio_uz: bioUz,
    bio_ru: bioRu,
    source_language: input.sourceLanguage,
    experience_history: input.experienceHistory,
    bio_translation_status: bioStatus,
    is_public: input.isPublic,
    last_active: new Date().toISOString(),
  }

  let updated: { is_public: boolean } | null = null
  let error: { message: string } | null = null

  if (existing) {
    // Update existing profile (don't change slug)
    const result = await supabase
      .from('worker_profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select('is_public')
      .single()
    updated = result.data
    error = result.error
  } else {
    // Create new profile with generated slug
    const slug = input.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'worker'
    const uniqueSlug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`
    const result = await supabase
      .from('worker_profiles')
      .insert({ user_id: user.id, slug: uniqueSlug, ...updateData })
      .select('is_public')
      .single()
    updated = result.data
    error = result.error
  }

  if (error) {
    console.error('Profile save error:', error)
    return { success: false, error: `Failed to save profile: ${error.message}` }
  }

  revalidatePath('/[locale]/worker/dashboard', 'page')
  revalidatePath('/[locale]/workers', 'page')

  return { success: true, isPublic: updated?.is_public ?? input.isPublic }
}

export async function updateProfilePhoto(photoUrl: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('worker_profiles')
    .update({ photo_url: photoUrl })
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'Failed to update photo' }
  return { success: true }
}

export async function updateProfileVideo(videoUrl: string | null): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('worker_profiles')
    .update({ video_url: videoUrl })
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'Failed to update video' }
  return { success: true }
}

export async function toggleProfileVisibility(isPublic: boolean): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Check if profile exists
  const { data: existing } = await supabase
    .from('worker_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    // Create profile with visibility setting
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    const name = profile?.full_name || 'worker'
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(1000 + Math.random() * 9000)}`
    const { error } = await supabase
      .from('worker_profiles')
      .insert({ user_id: user.id, slug, profession: '', is_public: isPublic })
    if (error) return { success: false, error: 'Failed to create profile' }
  } else {
    const { error } = await supabase
      .from('worker_profiles')
      .update({ is_public: isPublic })
      .eq('user_id', user.id)
    if (error) return { success: false, error: 'Failed to toggle visibility' }
  }

  revalidatePath('/[locale]/worker/profile', 'page')
  revalidatePath('/[locale]/workers', 'page')

  return { success: true }
}

export async function applyToJob(
  jobId: string,
  coverNote: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Get worker profile
  const { data: worker } = await supabase
    .from('worker_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!worker) return { success: false, error: 'Worker profile not found' }

  // Check if already applied
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('worker_id', worker.id)
    .single()

  if (existing) return { success: false, error: 'Already applied' }

  // Create application
  const { data: application, error } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      worker_id: worker.id,
      cover_note: coverNote || null,
      status: 'applied',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Application error:', error)
    return { success: false, error: 'Failed to apply' }
  }

  // Get job info for notification
  const { data: job } = await supabase
    .from('jobs')
    .select('title_original, company:companies(user_id)')
    .eq('id', jobId)
    .single()

  // Get worker name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Create notification for employer
  if (job?.company) {
    const company = job.company as unknown as { user_id: string }
    await supabase.from('notifications').insert({
      user_id: company.user_id,
      type: 'new_application',
      title: 'New application received',
      body: `${profile?.full_name ?? 'A worker'} applied for ${job.title_original}`,
      payload: {
        job_id: jobId,
        worker_id: worker.id,
        application_id: application.id,
      },
    })
  }

  revalidatePath('/[locale]/worker/dashboard', 'page')

  return { success: true }
}

export async function saveWorkerBookmark(workerId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Check if already saved
  const { data: existing } = await supabase
    .from('saved_workers')
    .select('id')
    .eq('employer_id', user.id)
    .eq('worker_id', workerId)
    .single()

  if (existing) {
    // Unsave
    await supabase.from('saved_workers').delete().eq('id', existing.id)
    return { success: true }
  }

  const { error } = await supabase.from('saved_workers').insert({
    employer_id: user.id,
    worker_id: workerId,
  })

  if (error) return { success: false, error: 'Failed to save worker' }
  return { success: true }
}
