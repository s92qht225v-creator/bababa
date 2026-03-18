'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleSaveJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Check if already saved
  const { data: existing } = await supabase
    .from('saved_jobs')
    .select('id')
    .eq('user_id', user.id)
    .eq('job_id', jobId)
    .maybeSingle()

  if (existing) {
    // Unsave
    await supabase.from('saved_jobs').delete().eq('id', existing.id)
    return { success: true, saved: false }
  } else {
    // Save
    const { error } = await supabase.from('saved_jobs').insert({
      user_id: user.id,
      job_id: jobId,
    })
    if (error) return { success: false, error: error.message }
    return { success: true, saved: true }
  }
}

export async function getSavedJobIds(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('saved_jobs')
    .select('job_id')
    .eq('user_id', user.id)

  return (data ?? []).map((d) => d.job_id)
}

export async function getSavedJobs() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('saved_jobs')
    .select('job_id, saved_at, job:jobs(id, slug, title_uz, title_zh, title_ru, title_original, salary_min, salary_max, salary_currency, employment_type, hsk_required, created_at, company:companies(name_original, name_uz, name_zh, name_ru, slug, is_verified, logo_url), location:locations(city, region))')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  return data ?? []
}
