'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Search } from 'lucide-react'
import { localizeCity } from '@/lib/location-names'
import {
  getApplicants,
  updateApplicationStatus,
  getEmployerJobs,
  type ApplicantWithDetails,
} from '@/lib/actions/applicants'
import { ApplicantCard } from './ApplicantCard'
import { HireConfirmDialog } from './HireConfirmDialog'
import type { Locale, ApplicationStatus } from '@/types'

interface JobOption {
  id: string
  title_original: string
  title_zh: string | null
  title_uz: string | null
  title_ru: string | null
  status: string
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  location: { city: string } | null
}

const STATUS_COLUMNS: ApplicationStatus[] = ['applied', 'shortlisted', 'rejected', 'hired']

export function ApplicantKanban() {
  const t = useTranslations('applicants')
  const locale = useLocale() as Locale
  const { user, loading: authLoading } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [applicants, setApplicants] = useState<ApplicantWithDetails[]>([])
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [hireTarget, setHireTarget] = useState<ApplicantWithDetails | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [applicantsData, jobsData] = await Promise.all([
      getApplicants(selectedJobId),
      getEmployerJobs(),
    ])
    setApplicants(applicantsData)
    setJobs(jobsData as unknown as JobOption[])
    setLoading(false)
  }, [user, selectedJobId])

  useEffect(() => {
    // Check for job filter from URL
    const jobParam = searchParams.get('job')
    if (jobParam) {
      setSelectedJobId(jobParam)
    }
  }, [searchParams])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-mark "applied" as "viewed" when card appears
  useEffect(() => {
    const appliedOnes = applicants.filter((a) => a.status === 'applied')
    for (const app of appliedOnes) {
      updateApplicationStatus(app.id, 'viewed')
    }
    if (appliedOnes.length > 0) {
      setApplicants((prev) =>
        prev.map((a) =>
          a.status === 'applied' ? { ...a, status: 'viewed' as ApplicationStatus } : a
        )
      )
    }
  }, [applicants.length]) // Only on initial load

  const handleStatusChange = async (applicationId: string, status: ApplicationStatus) => {
    // Optimistic update
    setApplicants((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
    )
    await updateApplicationStatus(applicationId, status)
  }

  const handleMessage = (workerUserId: string, jobId: string) => {
    router.push(`/${locale}/employer/messages?partner=${workerUserId}&job=${jobId}`)
  }

  const handleHireConfirm = async () => {
    if (!hireTarget) return
    await handleStatusChange(hireTarget.id, 'hired')
    setHireTarget(null)
  }

  const getJobTitle = (job: JobOption) => {
    const field = `title_${locale}` as keyof JobOption
    return (job[field] as string) ?? job.title_original
  }

  // Filter applicants
  const filtered = applicants.filter((a) => {
    if (searchQuery) {
      const name = (a.workerProfile?.full_name || '').toLowerCase()
      if (!name.includes(searchQuery.toLowerCase())) return false
    }
    return true
  })

  // Group by status - show "applied" and "viewed" together in the "Applied" column
  const getColumn = (status: ApplicationStatus) => {
    if (status === 'applied') {
      return filtered.filter((a) => a.status === 'applied' || a.status === 'viewed')
    }
    return filtered.filter((a) => a.status === status)
  }

  const columnColors: Record<string, string> = {
    applied: 'border-gray-300',
    shortlisted: 'border-yellow-400',
    rejected: 'border-red-300',
    hired: 'border-green-400',
  }

  // Job info header when filtered by job
  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) : null

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {/* Job info header when filtered */}
      {selectedJob && (
        <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3">
          <p className="font-semibold">{getJobTitle(selectedJob)}</p>
          <p className="text-sm text-gray-500">
            {selectedJob.location?.city ? localizeCity(selectedJob.location.city, locale) : '—'} ·{' '}
            {selectedJob.salary_min && selectedJob.salary_max
              ? `$${selectedJob.salary_min.toLocaleString()}–$${selectedJob.salary_max.toLocaleString()}/mo`
              : '—'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} {t('total_applicants')} ·{' '}
            {filtered.filter((a) => a.status === 'shortlisted').length} {t('shortlisted')} ·{' '}
            {filtered.filter((a) => a.status === 'hired').length} {t('hired')}
          </p>
        </div>
      )}

      {/* Filter bar */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={selectedJobId ?? ''}
          onChange={(e) => setSelectedJobId(e.target.value || null)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">{t('all_jobs')}</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {getJobTitle(job)}
            </option>
          ))}
        </select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_name')}
            className="rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      {/* Kanban board */}
      {filtered.length === 0 ? (
        <div className="mt-12 text-center text-gray-500">{t('no_applicants')}</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_COLUMNS.map((status) => {
            const items = getColumn(status)
            const label =
              status === 'applied'
                ? `${t('applied')} (${items.length})`
                : `${t(status)} (${items.length})`

            return (
              <div key={status} className="flex flex-col">
                <div
                  className={`mb-3 border-b-2 pb-2 ${columnColors[status]}`}
                >
                  <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
                </div>
                <div className="space-y-3">
                  {items.map((applicant) => (
                    <ApplicantCard
                      key={applicant.id}
                      applicant={applicant}
                      onStatusChange={handleStatusChange}
                      onMessage={handleMessage}
                      onHire={setHireTarget}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Hire confirmation dialog */}
      {hireTarget && (
        <HireConfirmDialog
          workerName={hireTarget.workerProfile.full_name}
          jobTitle={
            (() => {
              const field = `title_${locale}` as keyof typeof hireTarget.job
              return (hireTarget.job[field] as string) ?? hireTarget.job.title_original
            })()
          }
          onConfirm={handleHireConfirm}
          onCancel={() => setHireTarget(null)}
        />
      )}
    </main>
  )
}
