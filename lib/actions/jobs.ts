'use server'

import { createClient } from '@/lib/supabase/server'
import { translateJob, translateToEnglish } from '@/lib/translate'
import { slugify, uniqueSlug } from '@/lib/slugify'
import { revalidatePath } from 'next/cache'
import type { Locale, EmploymentType } from '@/types'

export interface PostJobInput {
  title: string
  categoryId: string
  employmentType: EmploymentType
  workersNeeded: number
  deadline: string | null
  locationId: string
  hskRequired: number
  experienceYears: number
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  benefits: string[]
  description: string
  sourceLanguage: Locale
}

interface JobResult {
  success: boolean
  error?: string
  jobId?: string
}

export async function createJob(input: PostJobInput): Promise<JobResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Get employer's company
  const { data: company } = await supabase
    .from('companies')
    .select('id, name_original, slug')
    .eq('user_id', user.id)
    .single()

  if (!company) return { success: false, error: 'No company found' }

  // Get location city for slug
  const { data: location } = await supabase
    .from('locations')
    .select('city')
    .eq('id', input.locationId)
    .single()

  // Generate English title for slug
  let englishTitle = input.title
  if (input.sourceLanguage !== 'uz') {
    // Translate to English for slug only
    const translated = await translateToEnglish(input.title, input.sourceLanguage)
    if (translated) englishTitle = translated
  }

  const slug = await uniqueSlug(
    slugify(englishTitle, company.name_original, location?.city ?? ''),
    'jobs'
  )

  // Translate title + description into all 3 languages
  const translations = await translateJob({
    title_original: input.title,
    description_original: input.description,
    source_language: input.sourceLanguage,
  })

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      company_id: company.id,
      category_id: input.categoryId,
      location_id: input.locationId,
      slug,
      title_original: input.title,
      title_zh: translations.title_zh,
      title_uz: translations.title_uz,
      title_ru: translations.title_ru,
      description_original: input.description,
      description_zh: translations.description_zh,
      description_uz: translations.description_uz,
      description_ru: translations.description_ru,
      source_language: input.sourceLanguage,
      salary_min: input.salaryMin,
      salary_max: input.salaryMax,
      salary_currency: input.salaryCurrency,
      hsk_required: input.hskRequired,
      experience_years: input.experienceYears,
      employment_type: input.employmentType,
      workers_needed: input.workersNeeded,
      benefits: input.benefits,
      deadline: input.deadline || null,
      status: 'active',
      translation_status: translations.failed ? 'failed' : 'complete',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Job insert error:', error)
    return { success: false, error: 'Failed to create job' }
  }

  revalidatePath('/[locale]/jobs', 'page')
  revalidatePath('/[locale]/employer/dashboard', 'page')

  return { success: true, jobId: job.id }
}

export async function updateJob(
  jobId: string,
  input: PostJobInput,
  originalTitle: string,
  originalDescription: string
): Promise<JobResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const titleChanged = input.title !== originalTitle
  const descriptionChanged = input.description !== originalDescription
  const needsTranslation = titleChanged || descriptionChanged

  let translationFields = {}
  let translationStatus = 'complete'

  if (needsTranslation) {
    const translations = await translateJob({
      title_original: input.title,
      description_original: input.description,
      source_language: input.sourceLanguage,
    })

    translationFields = {
      title_zh: translations.title_zh,
      title_uz: translations.title_uz,
      title_ru: translations.title_ru,
      description_zh: translations.description_zh,
      description_uz: translations.description_uz,
      description_ru: translations.description_ru,
    }

    if (translations.failed) translationStatus = 'failed'
  }

  const { error } = await supabase
    .from('jobs')
    .update({
      category_id: input.categoryId,
      location_id: input.locationId,
      title_original: input.title,
      description_original: input.description,
      source_language: input.sourceLanguage,
      salary_min: input.salaryMin,
      salary_max: input.salaryMax,
      salary_currency: input.salaryCurrency,
      hsk_required: input.hskRequired,
      experience_years: input.experienceYears,
      employment_type: input.employmentType,
      workers_needed: input.workersNeeded,
      benefits: input.benefits,
      deadline: input.deadline || null,
      ...(needsTranslation
        ? { ...translationFields, translation_status: translationStatus }
        : {}),
    })
    .eq('id', jobId)

  if (error) {
    console.error('Job update error:', error)
    return { success: false, error: 'Failed to update job' }
  }

  revalidatePath('/[locale]/jobs', 'page')
  revalidatePath('/[locale]/employer/dashboard', 'page')

  return { success: true, jobId }
}

export async function updateJobStatus(
  jobId: string,
  status: 'active' | 'paused' | 'closed'
): Promise<JobResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', jobId)

  if (error) {
    console.error('Job status update error:', error)
    return { success: false, error: 'Failed to update status' }
  }

  revalidatePath('/[locale]/jobs', 'page')
  revalidatePath('/[locale]/employer/dashboard', 'page')

  return { success: true, jobId }
}

export async function incrementJobViews(jobId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('jobs')
    .select('views_count')
    .eq('id', jobId)
    .single()

  if (data) {
    await supabase
      .from('jobs')
      .update({ views_count: (data.views_count ?? 0) + 1 })
      .eq('id', jobId)
  }
}
