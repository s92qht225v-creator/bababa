'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ApplicationStatus } from '@/types'

interface ActionResult {
  success: boolean
  error?: string
}

export interface ApplicantWithDetails {
  id: string
  job_id: string
  worker_id: string
  cover_note: string | null
  status: ApplicationStatus
  applied_at: string
  updated_at: string
  worker: {
    id: string
    user_id: string
    slug: string
    profession: string
    hsk_level: number
    photo_url: string | null
    experience_years: number
  }
  workerProfile: {
    full_name: string
    avatar_url: string | null
  }
  job: {
    id: string
    title_original: string
    title_zh: string | null
    title_uz: string | null
    title_ru: string | null
    salary_min: number | null
    salary_max: number | null
    salary_currency: string
    location: { city: string } | null
  }
}

/**
 * Get all applicants for an employer's jobs, optionally filtered by job.
 */
export async function getApplicants(
  jobId?: string | null
): Promise<ApplicantWithDetails[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // Get employer's company
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company) return []

  // Get employer's jobs
  let jobQuery = supabase
    .from('jobs')
    .select('id')
    .eq('company_id', company.id)

  if (jobId) {
    jobQuery = jobQuery.eq('id', jobId)
  }

  const { data: employerJobs } = await jobQuery
  if (!employerJobs || employerJobs.length === 0) return []

  const jobIds = employerJobs.map((j) => j.id)

  // Get all applications for these jobs
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      worker:worker_profiles!applications_worker_id_fkey(
        id, user_id, slug, profession, hsk_level, photo_url, experience_years
      ),
      job:jobs!applications_job_id_fkey(
        id, title_original, title_zh, title_uz, title_ru,
        salary_min, salary_max, salary_currency,
        location:locations(city)
      )
    `)
    .in('job_id', jobIds)
    .order('applied_at', { ascending: false })

  if (!applications) return []

  // Get worker profile names
  const workerUserIds = applications
    .map((a) => {
      const w = a.worker as unknown as { user_id: string }
      return w?.user_id
    })
    .filter(Boolean)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', workerUserIds.length > 0 ? workerUserIds : ['none'])

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])

  return applications.map((a) => {
    const worker = a.worker as unknown as ApplicantWithDetails['worker']
    return {
      id: a.id,
      job_id: a.job_id,
      worker_id: a.worker_id,
      cover_note: a.cover_note,
      status: a.status as ApplicationStatus,
      applied_at: a.applied_at,
      updated_at: a.updated_at,
      worker,
      workerProfile: profileMap.get(worker?.user_id) ?? {
        full_name: 'Unknown',
        avatar_url: null,
      },
      job: a.job as unknown as ApplicantWithDetails['job'],
    }
  })
}

/**
 * Update application status and notify worker.
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Get application details
  const { data: application } = await supabase
    .from('applications')
    .select(`
      id, worker_id, job_id, status,
      worker:worker_profiles!applications_worker_id_fkey(user_id),
      job:jobs!applications_job_id_fkey(title_original, company:companies(name_original))
    `)
    .eq('id', applicationId)
    .single()

  if (!application) return { success: false, error: 'Application not found' }

  // Update status
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)

  if (error) {
    console.error('Update application status error:', error)
    return { success: false, error: 'Failed to update status' }
  }

  // Create notification for worker
  const worker = application.worker as unknown as { user_id: string }
  const job = application.job as unknown as {
    title_original: string
    company: { name_original: string }
  }

  const statusLabels: Record<string, string> = {
    shortlisted: 'shortlisted',
    rejected: 'rejected',
    hired: 'hired',
    viewed: 'viewed',
  }

  if (worker?.user_id && statusLabels[status]) {
    await supabase.from('notifications').insert({
      user_id: worker.user_id,
      type: 'application_status_changed',
      title: 'Your application was updated',
      body: `${job?.company?.name_original ?? 'An employer'} marked your application as ${statusLabels[status]}`,
      payload: {
        job_id: application.job_id,
        application_id: applicationId,
        status,
      },
    })
  }

  revalidatePath('/[locale]/employer/applicants', 'page')
  return { success: true }
}

/**
 * Get employer's jobs for the filter dropdown.
 */
export async function getEmployerJobs() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!company) return []

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title_original, title_zh, title_uz, title_ru, status, salary_min, salary_max, salary_currency, location:locations(city)')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  return jobs ?? []
}
