import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/server'
import { siteConfig } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'
import Image from 'next/image'
import { localizeCity } from '@/lib/location-names'
import { formatSalary as fmtSalary } from '@/lib/utils'
import { MapPin, DollarSign, Clock } from 'lucide-react'
import type { Locale } from '@/types'

export const revalidate = 86400

export async function generateStaticParams() {
  const { createClient: createBrowserClient } = await import('@supabase/supabase-js')
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: categories } = await supabase
    .from('job_categories')
    .select('slug')

  if (!categories) return []

  return categories.map((cat) => ({ slug: cat.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const l = locale as Locale
  const supabase = createPublicClient()

  const { data: category } = await supabase
    .from('job_categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) return { title: 'Category Not Found' }

  const name = (category[`name_${l}`] ?? category.name_uz) as string

  const { count } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', category.id)
    .eq('status', 'active')

  const descriptions: Record<Locale, string> = {
    uz: `${name} — ${count ?? 0} ta faol ish o'rinlari | 百邦`,
    zh: `${name} — ${count ?? 0} 个活跃职位 | 百邦`,
    ru: `${name} — ${count ?? 0} активных вакансий | 百邦`,
  }

  return {
    title: `${name} | ${siteConfig.name}`,
    description: descriptions[l],
    alternates: {
      canonical: `${siteConfig.url}/${l}/jobs/category/${slug}`,
      languages: {
        uz: `${siteConfig.url}/uz/jobs/category/${slug}`,
        zh: `${siteConfig.url}/zh/jobs/category/${slug}`,
        ru: `${siteConfig.url}/ru/jobs/category/${slug}`,
      },
    },
  }
}

const PER_PAGE = 20

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { locale, slug } = await params
  const sp = await searchParams
  setRequestLocale(locale)

  const l = locale as Locale
  const t = await getTranslations('jobs')
  const supabase = createPublicClient()

  const { data: category } = await supabase
    .from('job_categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) notFound()

  const name = (category[`name_${l}`] ?? category.name_uz) as string
  const page = Math.max(1, Number(sp.page) || 1)
  const from = (page - 1) * PER_PAGE

  const { data: jobs, count } = await supabase
    .from('jobs')
    .select('*, company:companies(*), location:locations(*)', { count: 'exact' })
    .eq('category_id', category.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, from + PER_PAGE - 1)

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PER_PAGE)

  const getTitle = (job: Record<string, unknown>) =>
    (job[`title_${l}`] ?? job.title_original) as string

  const getCompanyName = (job: Record<string, unknown>) => {
    const company = job.company as Record<string, unknown> | null
    return (company?.[`name_${l}`] ?? company?.name_original ?? '') as string
  }

  const formatSalary = (job: Record<string, unknown>) => {
    return fmtSalary(job.salary_min as number | null, job.salary_max as number | null, (job.salary_currency as string) ?? 'USD')
  }

  const daysAgo = (date: string) => {
    const diff = Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    )
    return diff === 0 ? t('posted_today') : t('posted_ago', { days: diff })
  }

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: totalCount,
    itemListElement: (jobs ?? []).map((job, i) => ({
      '@type': 'ListItem',
      position: from + i + 1,
      url: `${siteConfig.url}/${locale}/jobs/${job.slug}`,
      name: getTitle(job),
    })),
  }

  return (
    <>
      <JsonLd data={itemListJsonLd} />
      <BreadcrumbSchema
        items={[
          { name: '百邦', href: `/${locale}` },
          { name: t('title'), href: `/${locale}/jobs` },
          { name, href: `/${locale}/jobs/category/${slug}` },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {totalCount} {t('title').toLowerCase()}
        </p>

        {/* Job cards */}
        {(jobs ?? []).length === 0 ? (
          <div className="mt-8 py-12 text-center text-gray-500">
            {t('no_jobs_found')}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {(jobs ?? []).map((job) => {
              const company = job.company as Record<string, unknown> | null
              return (
                <a
                  key={job.id}
                  href={`/${locale}/jobs/${job.slug}`}
                  className="block rounded-lg border border-gray-200 bg-white p-5 transition hover:border-red-300 hover:shadow-sm"
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-sm font-bold text-red-600">
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
                    <span className="text-xs text-gray-400">
                      {daysAgo(job.created_at as string)}
                    </span>
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
                href={`/${locale}/jobs/category/${slug}?page=${page - 1}`}
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
                href={`/${locale}/jobs/category/${slug}?page=${page + 1}`}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                {t('next_page')}
              </a>
            )}
          </div>
        )}
      </main>
    </>
  )
}
