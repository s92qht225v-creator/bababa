'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { localizeCity } from '@/lib/location-names'
import { Clock, Eye, Star, CheckCircle, XCircle } from 'lucide-react'
import type { Locale, ApplicationStatus } from '@/types'

interface ApplicationWithJob {
  id: string
  job_id: string
  status: ApplicationStatus
  applied_at: string
  job: {
    id: string
    slug: string
    title_original: string
    title_zh: string | null
    title_uz: string | null
    title_ru: string | null
    company: {
      name_original: string
      name_zh: string | null
      name_uz: string | null
      name_ru: string | null
      user_id: string
    }
    location: { city: string } | null
  }
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { icon: React.ComponentType<{ className?: string }>; colorClass: string }
> = {
  applied: { icon: Clock, colorClass: 'text-gray-600 bg-gray-100' },
  viewed: { icon: Eye, colorClass: 'text-red-600 bg-red-50' },
  shortlisted: { icon: Star, colorClass: 'text-yellow-600 bg-yellow-50' },
  hired: { icon: CheckCircle, colorClass: 'text-green-600 bg-green-50' },
  rejected: { icon: XCircle, colorClass: 'text-red-500 bg-red-50' },
}

export function ApplicationList() {
  const t = useTranslations('applications')
  const ts = useTranslations('status')
  const ta = useTranslations('applicants')
  const locale = useLocale() as Locale
  const { user, loading: authLoading } = useUser()

  const [applications, setApplications] = useState<ApplicationWithJob[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApplications = useCallback(async () => {
    if (!user) return
    const supabase = createClient()

    // Get worker profile
    const { data: worker } = await supabase
      .from('worker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!worker) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('applications')
      .select(`
        id, job_id, status, applied_at,
        job:jobs!applications_job_id_fkey(
          id, slug, title_original, title_zh, title_uz, title_ru,
          company:companies(name_original, name_zh, name_uz, name_ru, user_id),
          location:locations(city)
        )
      `)
      .eq('worker_id', worker.id)
      .order('applied_at', { ascending: false })

    setApplications((data ?? []) as unknown as ApplicationWithJob[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  // Subscribe to status changes
  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const channel = supabase
      .channel('application-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
        },
        () => {
          fetchApplications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchApplications])

  const getJobTitle = (job: ApplicationWithJob['job']) => {
    const field = `title_${locale}` as keyof typeof job
    return (job[field] as string) ?? job.title_original
  }

  const getCompanyName = (company: ApplicationWithJob['job']['company']) => {
    const field = `name_${locale}` as keyof typeof company
    return (company[field] as string) ?? company.name_original
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusLabel = (status: ApplicationStatus) => {
    if (status === 'rejected') return ta('not_selected')
    return ts(status)
  }

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {applications.length === 0 ? (
        <div className="mt-12 text-center text-gray-500">
          {t('no_applications')}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {applications.map((app) => {
            const statusConfig = STATUS_CONFIG[app.status]
            return (
              <div
                key={app.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <h3 className="font-semibold text-gray-900">
                  {getJobTitle(app.job)}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {getCompanyName(app.job.company)} ·{' '}
                  {app.job.location?.city ? localizeCity(app.job.location.city, locale) : '—'}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {t('applied_date')}: {formatDate(app.applied_at)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.colorClass}`}
                  >
                    <statusConfig.icon className="h-3.5 w-3.5" /> {getStatusLabel(app.status)}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`/${locale}/worker/messages?partner=${app.job.company.user_id}&job=${app.job_id}`}
                    className="rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    {t('message_employer')}
                  </a>
                  <a
                    href={`/${locale}/jobs/${app.job.slug}`}
                    className="rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    {t('view_job')}
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
