import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { siteConfig } from '@/lib/seo'
import Image from 'next/image'
import type { Locale } from '@/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale
  const titles: Record<Locale, string> = {
    uz: 'Ishchilar',
    zh: '人才列表',
    ru: 'Специалисты',
  }
  return {
    title: `${titles[l]} | ${siteConfig.name}`,
    description: siteConfig.description[l],
    alternates: {
      canonical: `${siteConfig.url}/${l}/workers`,
      languages: {
        uz: `${siteConfig.url}/uz/workers`,
        zh: `${siteConfig.url}/zh/workers`,
        ru: `${siteConfig.url}/ru/workers`,
      },
    },
  }
}

const PER_PAGE = 20

export default async function WorkersPage({
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
  const t = await getTranslations('worker')
  const supabase = await createClient()

  const page = Math.max(1, Number(sp.page) || 1)
  const search = sp.q ?? ''
  const categoryFilter = sp.category ?? ''
  const regionFilter = sp.region ?? ''
  const hskFilter = sp.hsk ?? ''
  const availabilityFilter = sp.availability ?? ''
  const sortBy = sp.sort ?? 'active'

  // Build query
  let query = supabase
    .from('worker_profiles')
    .select('*, profile:profiles(*), location:locations(*), category:job_categories(*)', {
      count: 'exact',
    })
    .eq('is_public', true)

  if (search) {
    query = query.ilike('profession', `%${search}%`)
  }

  if (categoryFilter) {
    query = query.eq('category_id', categoryFilter)
  }

  if (hskFilter && hskFilter !== '0') {
    query = query.gte('hsk_level', Number(hskFilter))
  }

  if (availabilityFilter === 'available') {
    query = query.eq('availability_status', 'available')
  } else if (availabilityFilter === 'available_from') {
    query = query.eq('availability_status', 'available_from')
  }

  // Sort
  if (sortBy === 'hsk') {
    query = query.order('hsk_level', { ascending: false })
  } else if (sortBy === 'experience') {
    query = query.order('experience_years', { ascending: false })
  } else {
    query = query.order('last_active', { ascending: false })
  }

  // Pagination
  const from = (page - 1) * PER_PAGE
  query = query.range(from, from + PER_PAGE - 1)

  const { data: workers, count } = await query

  // Load filter data
  const { data: categories } = await supabase
    .from('job_categories')
    .select('*')
    .order('name_uz')

  const { data: regionData } = await supabase
    .from('locations')
    .select('region')
    .order('region')

  const regions = [...new Set((regionData ?? []).map((r) => r.region))]

  // Filter by region in-memory
  let filteredWorkers = workers ?? []
  if (regionFilter) {
    filteredWorkers = filteredWorkers.filter(
      (w) => w.location?.region === regionFilter
    )
  }

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PER_PAGE)

  const getName = (w: Record<string, unknown>) => {
    const profile = w.profile as Record<string, unknown> | null
    return (profile?.full_name ?? '') as string
  }

  const getCategoryName = (cat: Record<string, unknown>) =>
    (cat[`name_${l}`] ?? cat.name_uz) as string

  const formatSalary = (w: Record<string, unknown>) => {
    const min = w.expected_salary_min as number | null
    const max = w.expected_salary_max as number | null
    if (!min && !max) return '—'
    const cur = (w.salary_currency as string) === 'UZS' ? 'UZS ' : '$'
    if (min && max) return `${cur}${min.toLocaleString()}–${cur}${max.toLocaleString()}`
    if (min) return `${cur}${min.toLocaleString()}+`
    return `${cur}${max!.toLocaleString()}`
  }

  const buildUrl = (overrides: Record<string, string>) => {
    const params = new URLSearchParams()
    const merged = {
      q: search,
      category: categoryFilter,
      region: regionFilter,
      hsk: hskFilter,
      availability: availabilityFilter,
      sort: sortBy,
      page: String(page),
      ...overrides,
    }
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== '0' && v !== '1' && k !== 'page') params.set(k, v)
      if (k === 'page' && v !== '1') params.set(k, v)
    })
    const qs = params.toString()
    return `/${locale}/workers${qs ? `?${qs}` : ''}`
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t('all_workers')}</h1>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Filters sidebar */}
        <aside className="hidden w-full shrink-0 space-y-6 lg:block lg:w-64">
          {/* Search */}
          <form action={`/${locale}/workers`} method="GET">
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder={t('profession')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
            {regionFilter && <input type="hidden" name="region" value={regionFilter} />}
            {hskFilter && <input type="hidden" name="hsk" value={hskFilter} />}
            {availabilityFilter && <input type="hidden" name="availability" value={availabilityFilter} />}
            {sortBy !== 'active' && <input type="hidden" name="sort" value={sortBy} />}
          </form>

          {/* Category filter */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('category')}</h3>
            <div className="space-y-1">
              <a
                href={buildUrl({ category: '', page: '1' })}
                className={`block rounded px-2 py-1 text-sm ${!categoryFilter ? 'bg-red-50 font-medium text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t('all_workers')}
              </a>
              {(categories ?? []).map((cat) => (
                <a
                  key={cat.id}
                  href={buildUrl({ category: cat.id, page: '1' })}
                  className={`block rounded px-2 py-1 text-sm ${categoryFilter === cat.id ? 'bg-red-50 font-medium text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {getCategoryName(cat)}
                </a>
              ))}
            </div>
          </div>

          {/* Region filter */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Region</h3>
            <div className="space-y-1">
              <a
                href={buildUrl({ region: '', page: '1' })}
                className={`block rounded px-2 py-1 text-sm ${!regionFilter ? 'bg-red-50 font-medium text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t('all_workers')}
              </a>
              {regions.map((r) => (
                <a
                  key={r}
                  href={buildUrl({ region: regionFilter === r ? '' : r, page: '1' })}
                  className={`block rounded px-2 py-1 text-sm ${regionFilter === r ? 'bg-red-50 font-medium text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {r}
                </a>
              ))}
            </div>
          </div>

          {/* HSK filter */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('chinese_level')}</h3>
            <div className="flex flex-wrap gap-1">
              <a
                href={buildUrl({ hsk: '', page: '1' })}
                className={`rounded border px-2 py-1 text-xs ${!hskFilter ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {t('no_chinese')}
              </a>
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <a
                  key={level}
                  href={buildUrl({ hsk: String(level), page: '1' })}
                  className={`rounded border px-2 py-1 text-xs ${hskFilter === String(level) ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  HSK {level}+
                </a>
              ))}
            </div>
          </div>

          {/* Availability filter */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('availability')}</h3>
            <div className="space-y-1">
              {[
                { value: '', label: t('all_workers') },
                { value: 'available', label: t('available_now') },
                { value: 'available_from', label: t('available_from') },
              ].map((opt) => (
                <a
                  key={opt.value}
                  href={buildUrl({ availability: opt.value, page: '1' })}
                  className={`block rounded px-2 py-1 text-sm ${availabilityFilter === opt.value ? 'bg-red-50 font-medium text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile filter toggle */}
        <details className="lg:hidden">
          <summary className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium">
            Filters
          </summary>
          <div className="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
            <form action={`/${locale}/workers`} method="GET">
              <input
                type="text"
                name="q"
                defaultValue={search}
                placeholder={t('profession')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </form>
          </div>
        </details>

        {/* Worker results */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {totalCount} {t('all_workers').toLowerCase()}
            </p>
            <div className="flex gap-2">
              {[
                { value: 'active', label: t('sort_active') },
                { value: 'hsk', label: t('sort_hsk') },
                { value: 'experience', label: t('sort_experience') },
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

          {/* Worker cards */}
          {filteredWorkers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              {t('no_workers_found')}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkers.map((worker) => {
                const profile = worker.profile as Record<string, unknown> | null
                const location = worker.location as Record<string, unknown> | null
                return (
                  <a
                    key={worker.id}
                    href={`/${locale}/workers/${worker.slug}`}
                    className="block rounded-lg border border-gray-200 bg-white p-5 transition hover:border-red-300 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      {/* Photo */}
                      {worker.photo_url ? (
                        <Image
                          src={worker.photo_url as string}
                          alt=""
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
                          {getName(worker).charAt(0)}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {getName(worker)}
                          </h3>
                          {(worker.is_verified as boolean) && (
                            <span className="text-xs text-green-600">✓ {t('verified')}</span>
                          )}
                          {worker.availability_status === 'available' && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                              {t('available_now')}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-gray-600">{worker.profession}</p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          {location && (
                            <span>📍 {location.city as string}, {location.region as string}</span>
                          )}
                          {(worker.hsk_level as number) > 0 && (
                            <span>🗣 HSK {worker.hsk_level as number}</span>
                          )}
                          {(worker.experience_years as number) > 0 && (
                            <span>💼 {worker.experience_years}+ {t('experience_years')}</span>
                          )}
                          <span>💰 {formatSalary(worker)}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              {page > 1 && (
                <a
                  href={buildUrl({ page: String(page - 1) })}
                  className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  {t('prev_page')}
                </a>
              )}
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <a
                  href={buildUrl({ page: String(page + 1) })}
                  className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
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
