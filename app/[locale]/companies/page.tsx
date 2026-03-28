import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { createPublicClient } from '@/lib/supabase/server'
import { siteConfig, ogImageUrl } from '@/lib/seo'
import { CompanyDirectoryContent } from '@/components/companies/CompanyDirectoryContent'
import type { Locale } from '@/types'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale
  const titles: Record<Locale, string> = {
    uz: 'Kompaniyalar',
    zh: '企业目录',
    ru: 'Компании',
  }
  const title = `${titles[l]} | ${siteConfig.name}`
  const description = siteConfig.description[l]
  return {
    title,
    description,
    alternates: {
      canonical: `${siteConfig.url}/${l}/companies`,
      languages: {
        uz: `${siteConfig.url}/uz/companies`,
        zh: `${siteConfig.url}/zh/companies`,
        ru: `${siteConfig.url}/ru/companies`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: l,
      url: `${siteConfig.url}/${l}/companies`,
      images: [{ url: ogImageUrl(title, description), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [ogImageUrl(title, description)],
    },
  }
}

export default async function CompaniesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const l = locale as Locale
  const t = await getTranslations('companies_page')
  const supabase = createPublicClient()

  // Run all queries in parallel
  const [
    { data: companies },
    { data: categories },
    { data: jobCounts },
  ] = await Promise.all([
    supabase.from('companies')
      .select('id, slug, name_original, name_uz, name_zh, name_ru, logo_url, industry, is_verified')
      .order('is_verified', { ascending: false }),
    supabase.from('job_categories').select('slug, name_uz, name_zh, name_ru'),
    supabase.from('jobs').select('company_id').eq('status', 'active'),
  ])

  const industryLabels: Record<string, string> = {}
  for (const cat of categories ?? []) {
    industryLabels[cat.slug] = (cat[`name_${l}`] ?? cat.slug) as string
  }

  const countMap: Record<string, number> = {}
  for (const j of jobCounts ?? []) {
    countMap[j.company_id] = (countMap[j.company_id] || 0) + 1
  }

  const companyItems = (companies ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: (c[`name_${l}`] ?? c.name_original) as string,
    industry: c.industry ? (industryLabels[c.industry] ?? c.industry) : null,
    logo_url: c.logo_url,
    is_verified: c.is_verified,
    job_count: countMap[c.id] || 0,
  }))

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="mt-1 text-sm text-gray-600">{t('subtitle')}</p>
      <CompanyDirectoryContent companies={companyItems} locale={locale} />
    </main>
  )
}
