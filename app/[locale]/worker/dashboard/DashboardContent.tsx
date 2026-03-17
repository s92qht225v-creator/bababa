'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import type { Locale, ApplicationStatus, WorkerProfile } from '@/types'

interface DashboardApplication {
  id: string
  status: ApplicationStatus
  applied_at: string
  job: {
    id: string
    title_original: string
    title_uz: string | null
    title_zh: string | null
    title_ru: string | null
    slug: string
    company: { name_original: string } | null
  }
}

function calculateCompletion(wp: WorkerProfile, profile: { full_name?: string | null; phone?: string | null } | null): number {
  if (!profile) return 0
  let filled = 0
  const total = 10
  if (profile.full_name) filled++
  if (profile.phone) filled++
  if (wp.profession) filled++
  if (wp.category_id) filled++
  if (wp.location_id) filled++
  if (wp.experience_years > 0) filled++
  if (wp.skills && wp.skills.length > 0) filled++
  if (wp.hsk_level > 0) filled++
  if (wp.bio_original) filled++
  if (wp.photo_url) filled++
  return Math.round((filled / total) * 100)
}

export function WorkerDashboardContent({ locale }: { locale: string }) {
  const t = useTranslations('worker')
  const ts = useTranslations('status')
  const td = useTranslations('dashboard')
  const currentLocale = useLocale() as Locale
  const { user, loading } = useUser()

  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null)
  const [applications, setApplications] = useState<DashboardApplication[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user) return
    const supabase = createClient()

    const { data: wp } = await supabase
      .from('worker_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setWorkerProfile(wp)

    if (!wp) {
      setLoadingData(false)
      return
    }

    const { data: apps } = await supabase
      .from('applications')
      .select('id, status, applied_at, job:jobs(id, title_original, title_uz, title_zh, title_ru, slug, company:companies(name_original))')
      .eq('worker_id', wp.id)
      .order('applied_at', { ascending: false })
      .limit(20)

    setApplications((apps ?? []) as unknown as DashboardApplication[])
    setLoadingData(false)
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getJobTitle = (job: DashboardApplication['job']) => {
    const field = `title_${currentLocale}` as keyof typeof job
    return (job[field] as string) ?? job.title_original
  }

  const daysAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    return diff === 0 ? '—' : t('days_ago', { days: diff })
  }

  const statusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'applied': return 'bg-red-100 text-red-700'
      case 'viewed': return 'bg-yellow-100 text-yellow-700'
      case 'shortlisted': return 'bg-green-100 text-green-700'
      case 'hired': return 'bg-green-200 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading || loadingData) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </main>
    )
  }

  const completion = workerProfile ? calculateCompletion(workerProfile, user) : 0

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {td('welcome', { name: user?.full_name || '' })}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{td('role_worker')}</p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/${locale}/worker/profile`}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {t('profile_title')}
          </a>
          <a
            href={`/${locale}/jobs`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('browse_jobs')}
          </a>
        </div>
      </div>

      {/* Profile completion */}
      {completion < 80 && (
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">{t('profile_completion')}: {completion}%</span>
            <a href={`/${locale}/worker/profile`} className="text-red-600 hover:underline">
              {td('complete_profile')}
            </a>
          </div>
          <div className="h-2 w-full rounded-full bg-yellow-200">
            <div className="h-2 rounded-full bg-yellow-500 transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>
      )}

      {/* Applications */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">{t('applied_jobs')} ({applications.length})</h2>

        {applications.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">{t('browse_jobs')}</p>
            <a
              href={`/${locale}/jobs`}
              className="mt-4 inline-block rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              {t('browse_jobs')}
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <a
                key={app.id}
                href={`/${locale}/jobs/${app.job.slug}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{getJobTitle(app.job)}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {app.job.company?.name_original ?? '—'} · {daysAgo(app.applied_at)}
                    </p>
                  </div>
                  <span className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(app.status)}`}>
                    {ts(app.status)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
