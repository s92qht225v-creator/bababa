'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { updateJobStatus } from '@/lib/actions/jobs'
import { localizeCity } from '@/lib/location-names'
import { formatSalary as fmtSalary } from '@/lib/utils'
import type { Locale, Job } from '@/types'

interface DashboardJob extends Job {
  location: { city: string } | null
  _count: { applications: number }
}

export function EmployerDashboardContent({ locale }: { locale: string }) {
  const t = useTranslations('jobs')
  const td = useTranslations('dashboard')
  const currentLocale = useLocale() as Locale
  const { user, loading } = useUser()
  const searchParams = useSearchParams()

  const [companyName, setCompanyName] = useState<string | null>(null)
  const [companyIncomplete, setCompanyIncomplete] = useState(false)
  const [jobs, setJobs] = useState<DashboardJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const success = searchParams.get('success')
    if (success === 'created') setSuccessMsg(t('job_published'))
    else if (success === 'updated') setSuccessMsg(t('job_updated'))
    if (success) {
      const timer = setTimeout(() => setSuccessMsg(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, t])

  const fetchJobs = useCallback(async () => {
    if (!user) return
    try {
    const supabase = createClient()

    const { data: companies } = await supabase
      .from('companies')
      .select('id, name_original, logo_url, industry, description_uz')
      .eq('user_id', user.id)
      .limit(1)

    const company = companies?.[0]
    if (!company) {
      setCompanyIncomplete(true)
      setLoadingJobs(false)
      return
    }
    setCompanyName(company.name_original)
    setCompanyIncomplete(!company.logo_url || !company.industry || !company.description_uz)

    const { data: jobRows } = await supabase
      .from('jobs')
      .select('*, location:locations(city)')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })

    if (!jobRows) return

    // Get application counts
    const jobIds = jobRows.map((j) => j.id)
    const { data: appCounts } = await supabase
      .from('applications')
      .select('job_id')
      .in('job_id', jobIds.length > 0 ? jobIds : ['none'])

    const countMap: Record<string, number> = {}
    ;(appCounts ?? []).forEach((a) => {
      countMap[a.job_id] = (countMap[a.job_id] ?? 0) + 1
    })

    setJobs(
      jobRows.map((j) => ({
        ...j,
        _count: { applications: countMap[j.id] ?? 0 },
      }))
    )
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoadingJobs(false)
    }
  }, [user])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleStatusChange = async (jobId: string, status: 'active' | 'paused' | 'closed') => {
    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status } : j))
    )
    await updateJobStatus(jobId, status)
  }

  const getTitle = (job: Job) => {
    const field = `title_${currentLocale}` as keyof Job
    return (job[field] as string) ?? job.title_original
  }

  const daysAgo = (date: string) => {
    const diff = Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    )
    return diff === 0 ? t('posted_today') : t('posted_ago', { days: diff })
  }

  const formatSalary = (job: Job) => {
    const base = fmtSalary(job.salary_min, job.salary_max, job.salary_currency ?? 'USD')
    if (base === '—') return base
    return `${base}${t('per_month')}`
  }

  if (loading || loadingJobs) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </main>
    )
  }

  const activeJobs = jobs.filter((j) => j.status === 'active')
  const pausedJobs = jobs.filter((j) => j.status === 'paused')
  const closedJobs = jobs.filter((j) => j.status === 'closed')

  const JobRow = ({ job }: { job: DashboardJob }) => (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold">{getTitle(job)}</h3>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              job.status === 'active'
                ? 'bg-green-100 text-green-700'
                : job.status === 'paused'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t(job.status)}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {job.location?.city ? localizeCity(job.location.city, locale) : '—'} · {formatSalary(job)} · {daysAgo(job.created_at)} · {job._count.applications} {t('applicants')}
        </p>
      </div>
      <div className="flex flex-shrink-0 gap-2">
        <a
          href={`/${locale}/jobs/${job.slug}`}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {t('view')}
        </a>
        <a
          href={`/${locale}/employer/post-job?edit=${job.id}`}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {t('edit_job')}
        </a>
        {job.status === 'active' && (
          <button
            onClick={() => handleStatusChange(job.id, 'paused')}
            className="rounded border border-yellow-300 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-50"
          >
            {t('pause')}
          </button>
        )}
        {job.status === 'paused' && (
          <button
            onClick={() => handleStatusChange(job.id, 'active')}
            className="rounded border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
          >
            {t('resume')}
          </button>
        )}
        {job.status !== 'closed' && (
          <button
            onClick={() => handleStatusChange(job.id, 'closed')}
            className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            {t('close')}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {successMsg && (
        <div className="mb-6 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {companyIncomplete && (
        <div className="mb-6 flex items-center justify-between rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          <span>{td('incomplete_company')}</span>
          <a
            href={`/${locale}/employer/company`}
            className="rounded bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700"
          >
            {td('complete_company_profile')}
          </a>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {td('welcome', { name: companyName || user?.full_name || '' })}
          </h1>
        </div>
        <div className="flex gap-3">
          <a
            href={`/${locale}/employer/post-job`}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            + {t('post_new_job')}
          </a>
          <a
            href={`/${locale}/workers`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('search_workers')}
          </a>
        </div>
      </div>

      {/* No jobs */}
      {jobs.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-gray-500">{t('no_jobs_found')}</p>
          <a
            href={`/${locale}/employer/post-job`}
            className="mt-4 inline-block rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {t('post_new_job')}
          </a>
        </div>
      )}

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">
            {t('active_jobs')} ({activeJobs.length})
          </h2>
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* Paused Jobs */}
      {pausedJobs.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">
            {t('paused_jobs')} ({pausedJobs.length})
          </h2>
          <div className="space-y-3">
            {pausedJobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* Closed Jobs */}
      {closedJobs.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">
            {t('closed_jobs')} ({closedJobs.length})
          </h2>
          <div className="space-y-3">
            {closedJobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
