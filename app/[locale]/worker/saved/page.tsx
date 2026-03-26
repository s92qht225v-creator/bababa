import { setRequestLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SaveJobButton } from '@/components/jobs/SaveJobButton'
import { localizeCity } from '@/lib/location-names'
import { formatSalary as fmtSalary } from '@/lib/utils'
import { MapPin, DollarSign } from 'lucide-react'
import type { Locale } from '@/types'

export default async function SavedJobsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = locale as Locale
  const t = await getTranslations('jobs')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: savedJobs } = await supabase
    .from('saved_jobs')
    .select('job_id, saved_at, job:jobs(id, slug, title_uz, title_zh, title_ru, title_original, salary_min, salary_max, salary_currency, employment_type, created_at, company:companies(name_original, name_uz, name_zh, name_ru, is_verified), location:locations(city))')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  const jobs = savedJobs ?? []

  const getTitle = (job: Record<string, unknown>) =>
    (job[`title_${l}`] ?? job.title_original ?? '') as string

  const getCompanyName = (job: Record<string, unknown>) => {
    const company = job.company as Record<string, unknown> | null
    return (company?.[`name_${l}`] ?? company?.name_original ?? '') as string
  }

  const formatSalary = (job: Record<string, unknown>) => {
    return fmtSalary(job.salary_min as number | null, job.salary_max as number | null, (job.salary_currency as string) ?? 'USD')
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t('saved_jobs')}</h1>

      {jobs.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-gray-500">{t('no_saved_jobs')}</p>
          <a href={`/${locale}/jobs`} className="mt-4 inline-block rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700">
            {t('browse_jobs')}
          </a>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {jobs.map((item) => {
            const rawJob = item.job as unknown
            const job = (Array.isArray(rawJob) ? rawJob[0] : rawJob) as Record<string, unknown> | null
            if (!job) return null
            const loc = job.location as { city: string } | null
            return (
              <div key={item.job_id} className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4">
                <a href={`/${locale}/jobs/${job.slug}`} className="flex-1">
                  <p className="text-xs text-gray-500">{getCompanyName(job)}</p>
                  <h3 className="mt-1 font-semibold text-gray-900">{getTitle(job)}</h3>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-gray-500">
                    {loc && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {localizeCity(loc.city, l)}</span>}
                    {formatSalary(job) && <span className="inline-flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {formatSalary(job)}</span>}
                  </div>
                </a>
                <SaveJobButton jobId={item.job_id} initialSaved={true} />
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
