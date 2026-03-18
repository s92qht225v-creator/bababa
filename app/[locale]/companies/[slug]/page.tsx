import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildCompanyMetadata } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'
import Image from 'next/image'
import type { Locale, Company } from '@/types'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!company) return { title: 'Company Not Found' }

  return buildCompanyMetadata(company as Company, locale as Locale)
}

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const l = locale as Locale
  const t = await getTranslations('companies_page')
  const supabase = await createClient()

  const [{ data: company }, { data: categories }] = await Promise.all([
    supabase.from('companies').select('*').eq('slug', slug).single(),
    supabase.from('job_categories').select('slug, name_uz, name_zh, name_ru'),
  ])

  if (!company) notFound()

  // Build industry label map
  const industryLabels: Record<string, string> = {}
  for (const cat of categories ?? []) {
    industryLabels[cat.slug] = (cat[`name_${l}`] ?? cat.slug) as string
  }

  const name = (company[`name_${l}`] ?? company.name_original) as string
  const description = (company[`description_${l}`] ?? '') as string
  const industryLabel = company.industry ? (industryLabels[company.industry] ?? company.industry) : null

  // Fetch active jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('slug, title_uz, title_zh, title_ru, title_original, salary_min, salary_max, salary_currency, employment_type, location:locations(city, region)')
    .eq('company_id', company.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20)

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    ...(company.logo_url ? { logo: company.logo_url } : {}),
    ...(company.website ? { url: company.website } : {}),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'UZ',
    },
  }

  const getJobTitle = (job: Record<string, unknown>) =>
    (job[`title_${l}`] ?? job.title_original) as string

  const formatSalary = (job: Record<string, unknown>) => {
    const min = job.salary_min as number | null
    const max = job.salary_max as number | null
    if (!min && !max) return ''
    const cur = (job.salary_currency as string) === 'UZS' ? 'UZS ' : '$'
    if (min && max) return `${cur}${min.toLocaleString()}–${cur}${max.toLocaleString()}`
    if (min) return `${cur}${min.toLocaleString()}+`
    return `${cur}${max!.toLocaleString()}`
  }

  return (
    <>
      <JsonLd data={orgJsonLd} />
      <BreadcrumbSchema
        items={[
          { name: 'bababa', href: `/${locale}` },
          { name: t('title'), href: `/${locale}/companies` },
          { name, href: `/${locale}/companies/${slug}` },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Company header */}
        <div className="flex items-center gap-4">
          {company.logo_url ? (
            <Image
              src={company.logo_url}
              alt={name}
              width={80}
              height={80}
              className="h-20 w-20 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-red-100 text-3xl font-bold text-red-600">
              {name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{name}</h1>
              {company.is_verified && (
                <span className="text-sm text-green-600">✓</span>
              )}
            </div>
            {industryLabel && (
              <p className="mt-1 text-sm text-gray-600">{industryLabel}</p>
            )}
            <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-gray-500">
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-red-600">
                  {t('website')}
                </a>
              )}
              {company.established_year && (
                <span>{t('founded')}: {company.established_year}</span>
              )}
              {company.employee_count && (
                <span>{t('employees')}: {company.employee_count}</span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">{t('about')}</h2>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {description}
            </div>
          </div>
        )}

        {/* Active jobs */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">{t('open_jobs')}</h2>
          {(!jobs || jobs.length === 0) ? (
            <p className="mt-3 text-sm text-gray-500">{t('no_open_jobs')}</p>
          ) : (
            <div className="mt-3 space-y-3">
              {jobs.map((job) => {
                const loc = job.location as unknown as { city: string; region: string } | null
                return (
                  <a
                    key={job.slug}
                    href={`/${locale}/jobs/${job.slug}`}
                    className="block rounded-lg border border-gray-100 p-4 transition hover:border-red-300 hover:shadow-sm"
                  >
                    <h3 className="font-medium text-gray-900">{getJobTitle(job)}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-gray-500">
                      {loc && <span>📍 {loc.city}</span>}
                      {formatSalary(job) && <span>💰 {formatSalary(job)}</span>}
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
