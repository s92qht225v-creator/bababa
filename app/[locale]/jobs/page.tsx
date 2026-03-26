import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { createPublicClient } from '@/lib/supabase/server'
import { siteConfig } from '@/lib/seo'
import Image from 'next/image'
import { SaveJobButton } from '@/components/jobs/SaveJobButton'
import { localizeCity, localizeRegion } from '@/lib/location-names'
import { formatSalary as fmtSalary } from '@/lib/utils'
import { MapPin, DollarSign, Clock, MessageSquare, Users, ClipboardList } from 'lucide-react'
import type { Locale } from '@/types'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale
  const titles: Record<Locale, string> = {
    uz: "Ish o'rinlari",
    zh: '职位列表',
    ru: 'Вакансии',
  }
  return {
    title: `${titles[l]} | ${siteConfig.name}`,
    description: siteConfig.description[l],
    alternates: {
      canonical: `${siteConfig.url}/${l}/jobs`,
      languages: {
        uz: `${siteConfig.url}/uz/jobs`,
        zh: `${siteConfig.url}/zh/jobs`,
        ru: `${siteConfig.url}/ru/jobs`,
      },
    },
  }
}

const PER_PAGE = 20

export default async function JobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { locale } = await params
  const sp = await searchParams
  setRequestLocale(locale)

  const l = locale as Locale
  const t = await getTranslations('jobs')
  const supabase = createPublicClient()

  const page = Math.max(1, Number(sp.page) || 1)
  const search = sp.q ?? ''
  const categoryFilter = sp.category ?? ''
  const regionFilter = sp.region ?? ''
  const cityFilter = sp.city ?? ''
  const hskFilter = sp.hsk ?? ''
  const typeFilter = sp.type ?? ''
  const sortBy = sp.sort ?? 'newest'
  const postedWithin = sp.posted ?? ''

  // Build query
  let query = supabase
    .from('jobs')
    .select('*, company:companies(*), location:locations(*), category:job_categories(*), applications(count)', {
      count: 'exact',
    })
    .eq('status', 'active')

  if (search) {
    const titleCol = `title_${l}`
    query = query.ilike(titleCol, `%${search}%`)
  }

  if (categoryFilter) {
    query = query.eq('category_id', categoryFilter)
  }

  if (hskFilter && hskFilter !== '0') {
    query = query.lte('hsk_required', Number(hskFilter))
  }

  if (typeFilter) {
    query = query.eq('employment_type', typeFilter)
  }

  if (postedWithin) {
    const now = new Date()
    let since: Date
    if (postedWithin === 'today') {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (postedWithin === 'week') {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
    query = query.gte('created_at', since.toISOString())
  }

  // Sort
  if (sortBy === 'salary') {
    query = query.order('salary_max', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Pagination
  const from = (page - 1) * PER_PAGE
  query = query.range(from, from + PER_PAGE - 1)

  // Run main query and filter data queries in parallel
  const [
    { data: jobs, count },
    { data: categories },
    { data: regionData },
  ] = await Promise.all([
    query,
    supabase.from('job_categories').select('*').order('name_uz'),
    supabase.from('locations').select('region').order('region'),
  ])

  const regions = [...new Set((regionData ?? []).map((r) => r.region))]

  // Filter by region/city in-memory (location is joined)
  let filteredJobs = jobs ?? []
  if (regionFilter) {
    filteredJobs = filteredJobs.filter(
      (j) => j.location?.region === regionFilter
    )
  }
  if (cityFilter) {
    filteredJobs = filteredJobs.filter(
      (j) => j.location?.city === cityFilter
    )
  }

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PER_PAGE)

  const getTitle = (job: Record<string, unknown>) =>
    (job[`title_${l}`] ?? job.title_original) as string

  const getCompanyName = (job: Record<string, unknown>) => {
    const company = job.company as Record<string, unknown> | null
    return (company?.[`name_${l}`] ?? company?.name_original ?? '') as string
  }

  const formatSalary = (job: Record<string, unknown>) => {
    const min = job.salary_min as number | null
    const max = job.salary_max as number | null
    const currency = (job.salary_currency as string) ?? 'USD'
    return fmtSalary(min, max, currency)
  }

  const daysAgo = (date: string) => {
    const diff = Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    )
    return diff === 0 ? t('posted_today') : t('posted_ago', { days: diff })
  }

  const buildUrl = (overrides: Record<string, string>) => {
    const params = new URLSearchParams()
    const merged = {
      q: search,
      category: categoryFilter,
      region: regionFilter,
      city: cityFilter,
      hsk: hskFilter,
      type: typeFilter,
      sort: sortBy,
      posted: postedWithin,
      page: String(page),
      ...overrides,
    }
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== '0' && v !== '1' && k !== 'page') params.set(k, v)
      if (k === 'page' && v !== '1') params.set(k, v)
    })
    const qs = params.toString()
    return `/${locale}/jobs${qs ? `?${qs}` : ''}`
  }

  const categoryName = (cat: Record<string, unknown>) =>
    (cat[`name_${l}`] ?? cat.name_uz) as string

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t('all_jobs')}</h1>

      {/* Search — always visible */}
      <form action={`/${locale}/jobs`} method="GET" className="mt-6">
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder={t('search_placeholder')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
        {regionFilter && <input type="hidden" name="region" value={regionFilter} />}
        {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
        {hskFilter && <input type="hidden" name="hsk" value={hskFilter} />}
        {sortBy !== 'newest' && <input type="hidden" name="sort" value={sortBy} />}
      </form>

      {/* Mobile filters toggle */}
      <details className="mt-4 rounded-lg border border-gray-300 lg:hidden">
        <summary className="cursor-pointer px-4 py-2 text-sm font-medium">{t('filters')}</summary>
        <div className="space-y-4 px-4 pb-4">
          {/* Category */}
          <div>
            <h3 className="mb-1 text-xs font-semibold">{t('category')}</h3>
            <div className="flex flex-wrap gap-1">
              {(categories ?? []).map((cat) => (
                <a key={cat.id} href={buildUrl({ category: categoryFilter === cat.id ? '' : cat.id, page: '1' })} className={`rounded border px-2 py-0.5 text-xs ${categoryFilter === cat.id ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600'}`}>
                  {categoryName(cat)}
                </a>
              ))}
            </div>
          </div>
          {/* Region */}
          <div>
            <h3 className="mb-1 text-xs font-semibold">{t('region')}</h3>
            <div className="flex flex-wrap gap-1">
              {regions.map((r) => (
                <a key={r} href={buildUrl({ region: regionFilter === r ? '' : r, city: '', page: '1' })} className={`rounded border px-2 py-0.5 text-xs ${regionFilter === r ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600'}`}>
                  {localizeRegion(r, l)}
                </a>
              ))}
            </div>
          </div>
          {/* HSK */}
          <div>
            <h3 className="mb-1 text-xs font-semibold">{t('hsk_required')}</h3>
            <div className="flex flex-wrap gap-1">
              <a href={buildUrl({ hsk: '', page: '1' })} className={`rounded border px-2 py-0.5 text-xs ${!hskFilter ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600'}`}>{t('any_level')}</a>
              {[1,2,3,4,5,6].map((lv) => <a key={lv} href={buildUrl({ hsk: String(lv), page: '1' })} className={`rounded border px-2 py-0.5 text-xs ${hskFilter === String(lv) ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600'}`}>HSK {lv}</a>)}
            </div>
          </div>
        </div>
      </details>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Desktop filters sidebar */}
        <aside className="hidden w-64 shrink-0 space-y-6 lg:block">

          {/* Category filter */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('category')}</h3>
            <div className="space-y-1">
              <a
                href={buildUrl({ category: '', page: '1' })}
                className={`block rounded px-2 py-1 text-sm ${!categoryFilter ? 'bg-red-50 font-medium text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t('all_jobs')}
              </a>
              {(categories ?? []).map((cat) => (
                <a
                  key={cat.id}
                  href={buildUrl({ category: cat.id, page: '1' })}
                  className={`block rounded px-2 py-1 text-sm ${categoryFilter === cat.id ? 'bg-red-50 font-medium text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {categoryName(cat)}
                </a>
              ))}
            </div>
          </div>

          {/* Region filter */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('region')}</h3>
            <div className="space-y-1">
              <a
                href={buildUrl({ region: '', city: '', page: '1' })}
                className={`block rounded px-2 py-1 text-sm ${!regionFilter ? 'bg-red-50 font-medium text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t('all_jobs')}
              </a>
              {regions.map((r) => (
                <a
                  key={r}
                  href={buildUrl({ region: regionFilter === r ? '' : r, city: '', page: '1' })}
                  className={`block rounded px-2 py-1 text-sm ${regionFilter === r ? 'bg-red-50 font-medium text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {localizeRegion(r, l)}
                </a>
              ))}
            </div>
          </div>

          {/* HSK filter */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('hsk_required')}</h3>
            <div className="flex flex-wrap gap-1">
              <a
                href={buildUrl({ hsk: '', page: '1' })}
                className={`rounded border px-2 py-1 text-xs ${!hskFilter ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {t('any_level')}
              </a>
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <a
                  key={level}
                  href={buildUrl({ hsk: String(level), page: '1' })}
                  className={`rounded border px-2 py-1 text-xs ${hskFilter === String(level) ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  HSK {level}
                </a>
              ))}
            </div>
          </div>

          {/* Employment type */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('employment_type')}</h3>
            <div className="space-y-1">
              {['full_time', 'part_time', 'contract', 'seasonal'].map((et) => (
                <a
                  key={et}
                  href={buildUrl({ type: typeFilter === et ? '' : et, page: '1' })}
                  className={`block rounded px-2 py-1 text-sm ${typeFilter === et ? 'bg-red-50 font-medium text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {t(et as 'full_time' | 'part_time' | 'contract' | 'seasonal')}
                </a>
              ))}
            </div>
          </div>

          {/* Posted within */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('posted_within')}</h3>
            <div className="space-y-1">
              {[
                { value: '', label: t('all_jobs') },
                { value: 'today', label: t('today') },
                { value: 'week', label: t('this_week') },
                { value: 'month', label: t('this_month') },
              ].map((opt) => (
                <a
                  key={opt.value}
                  href={buildUrl({ posted: opt.value, page: '1' })}
                  className={`block rounded px-2 py-1 text-sm ${postedWithin === opt.value ? 'bg-red-50 font-medium text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Job results */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {t('page_info', { from: from + 1, to: Math.min(from + PER_PAGE, totalCount), total: totalCount })}
            </p>
            <div className="flex gap-2">
              {[
                { value: 'newest', label: t('sort_newest') },
                { value: 'salary', label: t('sort_salary') },
              ].map((s) => (
                <a
                  key={s.value}
                  href={buildUrl({ sort: s.value, page: '1' })}
                  className={`rounded border px-3 py-1 text-xs font-medium ${sortBy === s.value ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Job cards */}
          {filteredJobs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              {t('no_jobs_found')}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const company = job.company as Record<string, unknown> | null
                return (
                  <a
                    key={job.id}
                    href={`/${locale}/jobs/${job.slug}`}
                    className="card-hover block rounded-2xl border border-gray-100 bg-white p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {company?.logo_url ? (
                          <Image
                            src={company.logo_url as string}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-600">
                            {getCompanyName(job).charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            {getCompanyName(job)}
                          </span>
                          {(company?.is_verified as boolean) && (
                            <span className="ml-2 text-xs text-green-600">✓</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">
                          {daysAgo(job.created_at as string)}
                        </span>
                        <SaveJobButton jobId={job.id as string} initialSaved={false} />
                      </div>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold text-gray-900">
                      {getTitle(job)}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      {job.location && (
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {localizeCity((job.location as Record<string, unknown>).city as string, l)}</span>
                      )}
                      <span className="inline-flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {formatSalary(job)}{t('per_month')}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t((job.employment_type ?? 'full_time') as 'full_time')}</span>
                      {(job.hsk_required as number) > 0 && (
                        <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> HSK {job.hsk_required as number}+</span>
                      )}
                      {(job.workers_needed as number) > 1 && (
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t('positions', { count: job.workers_needed as number })}</span>
                      )}
                      {(() => {
                        const apps = job.applications as { count: number }[] | undefined
                        const count = apps?.[0]?.count ?? 0
                        return count > 0 ? <span className="inline-flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" /> {count} {t('applicants')}</span> : null
                      })()}
                    </div>
                  </a>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              {page > 1 && (
                <a
                  href={buildUrl({ page: String(page - 1) })}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  {t('prev_page')}
                </a>
              )}
              <span className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <a
                  href={buildUrl({ page: String(page + 1) })}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  {t('next_page')}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
