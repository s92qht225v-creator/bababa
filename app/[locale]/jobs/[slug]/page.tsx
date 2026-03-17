import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildJobMetadata } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'
import { incrementJobViews } from '@/lib/actions/jobs'
import { ApplyButton } from '@/components/jobs/ApplyButton'
import Image from 'next/image'
import type { Locale, JobWithRelations } from '@/types'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('*, company:companies(*), location:locations(*), category:job_categories(*)')
    .eq('slug', slug)
    .single()

  if (!job) return { title: 'Job Not Found' }

  return buildJobMetadata(job as JobWithRelations, locale as Locale)
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const l = locale as Locale
  const t = await getTranslations('jobs')
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('*, company:companies(*), location:locations(*), category:job_categories(*)')
    .eq('slug', slug)
    .single()

  if (!job) notFound()

  // Increment views (fire-and-forget)
  incrementJobViews(job.id)

  // Check if current user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check worker profile and existing application
  let hasProfile = false
  let alreadyApplied = false
  if (user) {
    const { data: workerProfile } = await supabase
      .from('worker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    hasProfile = !!workerProfile
    if (workerProfile) {
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', job.id)
        .eq('worker_id', workerProfile.id)
        .maybeSingle()
      alreadyApplied = !!existingApp
    }
  }

  const title = (job[`title_${l}`] ?? job.title_original) as string
  const description = (job[`description_${l}`] ?? job.description_original ?? '') as string
  const companyName = (job.company?.[`name_${l}`] ?? job.company?.name_original ?? '') as string
  const categoryName = (job.category?.[`name_${l}`] ?? job.category?.name_uz ?? '') as string

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return '—'
    const cur = job.salary_currency === 'UZS' ? 'UZS ' : '$'
    if (job.salary_min && job.salary_max)
      return `${cur}${job.salary_min.toLocaleString()} – ${cur}${job.salary_max.toLocaleString()} ${t('per_month')}`
    if (job.salary_min) return `${cur}${job.salary_min.toLocaleString()}+ ${t('per_month')}`
    return `${cur}${job.salary_max!.toLocaleString()} ${t('per_month')}`
  }

  const daysAgo = Math.floor(
    (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  const benefitLabels: Record<string, string> = {
    housing: t('housing'),
    meals: t('meals'),
    transport: t('transport'),
    health_insurance: t('health_insurance'),
    visa_assistance: t('visa_assistance'),
    training: t('training'),
    bonus: t('bonus'),
  }

  const hskLabel = job.hsk_required === 0 ? t('hsk_none') : `HSK ${job.hsk_required}`

  const experienceLabel =
    job.experience_years === 0
      ? t('no_experience')
      : `${job.experience_years}+ ${t('experience')}`

  const employmentTypeLabels: Record<string, string> = {
    full_time: t('full_time'),
    part_time: t('part_time'),
    contract: t('contract'),
    seasonal: t('seasonal'),
  }

  // JSON-LD JobPosting schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    datePosted: job.created_at,
    ...(job.deadline ? { validThrough: job.deadline } : {}),
    employmentType: (job.employment_type ?? 'full_time').toUpperCase().replace('_', ''),
    hiringOrganization: {
      '@type': 'Organization',
      name: companyName,
      ...(job.company?.logo_url ? { logo: job.company.logo_url } : {}),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location?.city ?? '',
        addressRegion: job.location?.region ?? '',
        addressCountry: 'UZ',
      },
    },
    ...(job.salary_min || job.salary_max
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: job.salary_currency,
            value: {
              '@type': 'QuantitativeValue',
              ...(job.salary_min ? { minValue: job.salary_min } : {}),
              ...(job.salary_max ? { maxValue: job.salary_max } : {}),
              unitText: 'MONTH',
            },
          },
        }
      : {}),
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <BreadcrumbSchema
        items={[
          { name: 'bababa', href: `/${locale}` },
          { name: t('title'), href: `/${locale}/jobs` },
          { name: title, href: `/${locale}/jobs/${slug}` },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Company header */}
        <div className="flex items-center gap-3">
          {job.company?.logo_url ? (
            <Image
              src={job.company.logo_url}
              alt={companyName}
              width={48}
              height={48}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-lg font-bold text-red-600">
              {companyName.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="font-semibold">{companyName}</h2>
            {job.company?.is_verified && (
              <p className="text-xs text-green-600">{t('verified_company')}</p>
            )}
          </div>
        </div>

        {/* Job title and meta */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h1 className="text-2xl font-bold">{title}</h1>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            {job.location && (
              <span>📍 {job.location.city}, {job.location.region}</span>
            )}
            <span>💰 {formatSalary()}</span>
            <span>🕐 {employmentTypeLabels[job.employment_type ?? 'full_time']} · {t('positions', { count: job.workers_needed })}</span>
            <span>📅 {daysAgo === 0 ? t('posted_today') : t('posted_ago', { days: daysAgo })}</span>
          </div>

          {categoryName && (
            <span className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              {categoryName}
            </span>
          )}
        </div>

        {/* Requirements */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">{t('requirements')}</h2>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <p>• {t('chinese_level')}: {hskLabel}</p>
            <p>• {t('experience_required')}: {experienceLabel}</p>
          </div>
        </div>

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">{t('benefits')}</h2>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              {job.benefits.map((b: string) => (
                <p key={b}>• {benefitLabels[b] ?? b}</p>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">{t('description')}</h2>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {description}
          </div>
        </div>

        {/* Apply button */}
        <div className="mt-8">
          <ApplyButton
            jobId={job.id}
            jobTitle={title}
            locale={locale}
            hasProfile={hasProfile}
            alreadyApplied={alreadyApplied}
            isLoggedIn={!!user}
          />
        </div>
      </main>
    </>
  )
}
