import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { siteConfig } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { StatsCounter } from '@/components/home/StatsCounter'
import { HowItWorksTabs } from '@/components/home/HowItWorksTabs'
import type { Locale } from '@/types'

export const revalidate = 3600

const META_TITLES: Record<Locale, string> = {
  uz: "bababa — O'zbekistondagi xitoy kompaniyalarida ish",
  zh: 'bababa — 在乌兹别克斯坦的中国企业招聘平台',
  ru: 'bababa — Работа в китайских компаниях Узбекистана',
}

const META_DESCRIPTIONS: Record<Locale, string> = {
  uz: "O'zbekistondagi 180+ xitoy kompaniyasida 640+ ish o'rni. Tarjimon, muhandis, haydovchi va boshqa kasblar.",
  zh: '乌兹别克斯坦180+家中国企业的640+个职位。口译员、工程师、司机等。',
  ru: '640+ вакансий в 180+ китайских компаниях Узбекистана. Переводчики, инженеры, водители и другие.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale

  return {
    title: META_TITLES[l],
    description: META_DESCRIPTIONS[l],
    alternates: {
      canonical: `${siteConfig.url}/${l}`,
      languages: {
        uz: `${siteConfig.url}/uz`,
        zh: `${siteConfig.url}/zh`,
        ru: `${siteConfig.url}/ru`,
      },
    },
    openGraph: {
      title: META_TITLES[l],
      description: META_DESCRIPTIONS[l],
      type: 'website',
      siteName: 'bababa',
      locale: l,
    },
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = locale as Locale
  const t = await getTranslations('home')

  const supabase = await createClient()

  // Fetch stats
  const [
    { count: jobCount },
    { count: companyCount },
    { count: workerCount },
  ] = await Promise.all([
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('is_verified', true),
    supabase.from('worker_profiles').select('id', { count: 'exact', head: true }).eq('is_public', true),
  ])

  // Fetch categories with job counts
  const { data: categories } = await supabase
    .from('job_categories')
    .select('id, name_zh, name_uz, name_ru, icon, slug')
    .order('name_uz')

  const categoryIds = (categories ?? []).map((c) => c.id)
  const { data: catJobCounts } = await supabase
    .from('jobs')
    .select('category_id')
    .eq('status', 'active')
    .in('category_id', categoryIds.length > 0 ? categoryIds : ['none'])

  const catCountMap: Record<string, number> = {}
  ;(catJobCounts ?? []).forEach((j) => {
    if (j.category_id) catCountMap[j.category_id] = (catCountMap[j.category_id] ?? 0) + 1
  })

  const categoriesWithCounts = (categories ?? [])
    .map((c) => ({ ...c, jobCount: catCountMap[c.id] ?? 0 }))
    .sort((a, b) => b.jobCount - a.jobCount)
    .slice(0, 8)

  // Popular search tags — top 5 categories by application count
  const { data: popularCats } = await supabase
    .from('applications')
    .select('job:jobs!applications_job_id_fkey(category_id)')
    .limit(500)

  const popMap: Record<string, number> = {}
  ;(popularCats ?? []).forEach((a) => {
    const catId = (a.job as unknown as { category_id: string })?.category_id
    if (catId) popMap[catId] = (popMap[catId] ?? 0) + 1
  })
  const topCatIds = Object.entries(popMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id)
  const popularTags = (categories ?? []).filter((c) => topCatIds.includes(c.id))

  // Fetch 6 featured jobs
  const { data: featuredJobs } = await supabase
    .from('jobs')
    .select('id, slug, title_original, title_zh, title_uz, title_ru, salary_min, salary_max, salary_currency, hsk_required, employment_type, created_at, company:companies(name_original, name_zh, name_uz, name_ru, logo_url, is_verified), location:locations(city)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6)

  // Fetch 6 verified companies
  const { data: featuredCompanies } = await supabase
    .from('companies')
    .select('id, slug, name_original, name_zh, name_uz, name_ru, logo_url, industry, description_zh, description_uz, description_ru')
    .eq('is_verified', true)
    .limit(6)

  // Company open positions count
  const companyIds = (featuredCompanies ?? []).map((c) => c.id)
  const { data: companyJobCounts } = await supabase
    .from('jobs')
    .select('company_id')
    .eq('status', 'active')
    .in('company_id', companyIds.length > 0 ? companyIds : ['none'])

  const compJobMap: Record<string, number> = {}
  ;(companyJobCounts ?? []).forEach((j) => {
    compJobMap[j.company_id] = (compJobMap[j.company_id] ?? 0) + 1
  })

  // Fetch locations for search dropdown
  const { data: locations } = await supabase
    .from('locations')
    .select('city')
    .order('city')

  const cities = [...new Set((locations ?? []).map((l) => l.city))]

  const getCatName = (cat: { name_zh: string; name_uz: string; name_ru: string }) =>
    cat[`name_${l}` as keyof typeof cat] ?? cat.name_uz

  const getTitle = (job: Record<string, unknown>) =>
    (job[`title_${l}`] ?? job.title_original) as string

  const getCompanyName = (company: Record<string, unknown>) =>
    (company[`name_${l}`] ?? company.name_original) as string

  const formatSalary = (job: Record<string, unknown>) => {
    const min = job.salary_min as number | null
    const max = job.salary_max as number | null
    if (!min && !max) return '—'
    const cur = (job.salary_currency as string) === 'UZS' ? 'UZS' : '$'
    if (min && max) return `${cur}${min.toLocaleString()}–${cur}${max.toLocaleString()}`
    if (min) return `${cur}${min.toLocaleString()}+`
    return `${cur}${max!.toLocaleString()}`
  }

  // JSON-LD: WebSite with SearchAction
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'bababa',
    url: 'https://bababa.uz',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://bababa.uz/${l}/jobs?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <JsonLd data={websiteSchema} />
      <main>
        {/* ── Section 1: Hero ── */}
        <section className="bg-gradient-to-br from-red-50 via-white to-red-50 px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              {t('hero_title')}
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              {t('hero_subtitle')}
            </p>

            {/* Search bar */}
            <form
              action={`/${locale}/jobs`}
              method="GET"
              className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row"
            >
              <input
                type="text"
                name="q"
                placeholder={t('search_placeholder')}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <select
                name="city"
                className="rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-600 focus:border-red-500 focus:outline-none"
              >
                <option value="">{t('search_location')}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                {t('search_button')}
              </button>
            </form>

            {/* Popular tags */}
            {popularTags.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-gray-400">{t('popular_searches')}:</span>
                {popularTags.map((tag) => (
                  <a
                    key={tag.id}
                    href={`/${locale}/jobs?category=${tag.id}`}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-red-300 hover:text-red-600"
                  >
                    {getCatName(tag)}
                  </a>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={`/${locale}/jobs`}
                className="rounded-lg bg-red-600 px-8 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                {t('find_job')}
                <span className="ml-1 text-xs font-normal opacity-75">— {t('find_job_sub')}</span>
              </a>
              <a
                href={`/${locale}/employer/post-job`}
                className="rounded-lg border border-red-600 px-8 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                {t('post_job')}
                <span className="ml-1 text-xs font-normal opacity-75">— {t('post_job_sub')}</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── Section 2: Stats Bar ── */}
        <section className="border-y border-gray-200 bg-white px-4 py-10">
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-8">
            <StatsCounter end={jobCount ?? 0} label={t('stats_jobs')} />
            <StatsCounter end={companyCount ?? 0} label={t('stats_companies')} />
            <StatsCounter end={workerCount ?? 0} label={t('stats_workers')} />
          </div>
        </section>

        {/* ── Section 3: Job Categories ── */}
        {categoriesWithCounts.length > 0 && (
          <section className="px-4 py-16">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-center text-2xl font-bold">{t('categories_title')}</h2>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {categoriesWithCounts.map((cat) => (
                  <a
                    key={cat.id}
                    href={`/${locale}/jobs/category/${cat.slug}`}
                    className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-5 text-center transition hover:border-red-300 hover:shadow-sm"
                  >
                    <span className="text-2xl">{cat.icon || '💼'}</span>
                    <span className="mt-2 text-sm font-semibold text-gray-900">
                      {getCatName(cat)}
                    </span>
                    <span className="mt-1 text-xs text-gray-500">
                      {cat.jobCount} {t('stats_jobs').toLowerCase()}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Section 4: Featured Jobs ── */}
        {(featuredJobs ?? []).length > 0 && (
          <section className="bg-gray-50 px-4 py-16">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-center text-2xl font-bold">{t('featured_jobs_title')}</h2>
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                {(featuredJobs ?? []).map((job) => {
                  const company = job.company as unknown as Record<string, unknown> | null
                  return (
                    <a
                      key={job.id}
                      href={`/${locale}/jobs/${job.slug}`}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-red-300 hover:shadow-sm"
                    >
                      {company?.logo_url ? (
                        <Image
                          src={company.logo_url as string}
                          alt={getCompanyName(company)}
                          width={40}
                          height={40}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-sm font-bold text-red-600">
                          {getCompanyName(company ?? {}).charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">{getCompanyName(company ?? {})}</span>
                          {(company?.is_verified as boolean) && <span className="text-xs text-green-500">✓</span>}
                        </div>
                        <h3 className="mt-0.5 truncate text-sm font-semibold text-gray-900">
                          {getTitle(job)}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
                          {job.location && <span>📍 {(job.location as unknown as { city: string }).city}</span>}
                          <span>💰 {formatSalary(job)}</span>
                          {job.hsk_required > 0 && <span>🗣 HSK {job.hsk_required}</span>}
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
              <div className="mt-8 text-center">
                <a
                  href={`/${locale}/jobs`}
                  className="text-sm font-semibold text-red-600 hover:text-red-800"
                >
                  {t('view_all_jobs')} →
                </a>
              </div>
            </div>
          </section>
        )}

        {/* ── Section 5: How It Works ── */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold">{t('how_it_works')}</h2>
            <div className="mt-8">
              <HowItWorksTabs />
            </div>
          </div>
        </section>

        {/* ── Section 6: Featured Companies ── */}
        {(featuredCompanies ?? []).length > 0 && (
          <section className="bg-gray-50 px-4 py-16">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-center text-2xl font-bold">{t('companies_title')}</h2>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(featuredCompanies ?? []).map((company) => (
                  <a
                    key={company.id}
                    href={`/${locale}/companies/${company.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-red-300"
                  >
                    {company.logo_url ? (
                      <Image
                        src={company.logo_url}
                        alt={getCompanyName(company)}
                        width={48}
                        height={48}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-lg font-bold text-red-600">
                        {getCompanyName(company).charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {getCompanyName(company)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {company.industry ?? ''} · {compJobMap[company.id] ?? 0} {t('open_positions')}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
              <div className="mt-8 text-center">
                <a
                  href={`/${locale}/companies`}
                  className="text-sm font-semibold text-red-600 hover:text-red-800"
                >
                  {t('view_all_companies')} →
                </a>
              </div>
            </div>
          </section>
        )}

        {/* ── Section 7: Testimonials ── */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold">{t('testimonials_title')}</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  <p className="text-sm text-gray-700 italic">
                    &ldquo;{t(`testimonial_${i}_text` as 'testimonial_1_text')}&rdquo;
                  </p>
                  <p className="mt-3 text-xs font-semibold text-gray-900">
                    — {t(`testimonial_${i}_author` as 'testimonial_1_author')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 8: CTA Banner ── */}
        <section className="bg-red-600 px-4 py-16 text-center text-white">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold">{t('cta_title')}</h2>
            <p className="mt-3 text-red-100">{t('cta_subtitle')}</p>
            <a
              href={`/${locale}/employer/post-job`}
              className="mt-6 inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              {t('cta_button')} →
            </a>
          </div>
        </section>
      </main>
    </>
  )
}
