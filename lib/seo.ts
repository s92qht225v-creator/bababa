import type { Metadata } from 'next'
import type {
  Locale,
  JobWithRelations,
  WorkerWithRelations,
  Company,
} from '@/types'

export const siteConfig = {
  name: '百邦',
  url: 'https://www.baibang.uz',
  defaultLocale: 'uz' as Locale,
  description: {
    uz: "O'zbekistondagi xitoy kompaniyalari uchun ish o'rinlari platformasi",
    zh: '连接乌兹别克斯坦中国企业与当地人才的招聘平台',
    ru: 'Платформа по трудоустройству для китайских компаний в Узбекистане',
  },
} as const

const defaultOgImage = {
  url: `${siteConfig.url}/api/og`,
  width: 1200,
  height: 630,
  alt: '百邦 Baibang',
}

export function ogImageUrl(title: string, description?: string): string {
  const params = new URLSearchParams({ title })
  if (description) params.set('description', description.substring(0, 120))
  return `${siteConfig.url}/api/og?${params.toString()}`
}

export type AlternateURLs = {
  canonical: string
  languages: Record<string, string>
}

/**
 * Returns hreflang alternates for any path + slug combination.
 */
export function generateAlternates(
  path: string,
  slug: string
): AlternateURLs {
  const base = siteConfig.url
  return {
    canonical: `${base}/uz${path}/${slug}`,
    languages: {
      uz: `${base}/uz${path}/${slug}`,
      zh: `${base}/zh${path}/${slug}`,
      ru: `${base}/ru${path}/${slug}`,
    },
  }
}

/**
 * Build full Metadata for a job detail page.
 */
export function buildJobMetadata(
  job: JobWithRelations,
  locale: Locale
): Metadata {
  const titleField = `title_${locale}` as const
  const descField = `description_${locale}` as const

  const title =
    (job[titleField as keyof typeof job] as string) ?? job.title_original
  const description = (
    (job[descField as keyof typeof job] as string) ??
    job.description_original ??
    ''
  ).substring(0, 155)

  const companyName = job.company?.name_original ?? ''
  const fullTitle = `${title} — ${companyName} | 百邦`

  const alternates = generateAlternates('/jobs', job.slug)

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      locale,
      url: `${siteConfig.url}/${locale}/jobs/${job.slug}`,
      images: [{ url: ogImageUrl(fullTitle, description), width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImageUrl(fullTitle, description)],
    },
  }
}

/**
 * Build full Metadata for a worker profile page.
 */
export function buildWorkerMetadata(
  worker: WorkerWithRelations,
  locale: Locale
): Metadata {
  const bioField = `bio_${locale}` as const
  const bio = (
    (worker[bioField as keyof typeof worker] as string) ??
    worker.bio_original ??
    ''
  ).substring(0, 155)

  const name = worker.profile?.full_name
    || worker.slug?.split('-').slice(0, 2).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    || ''
  const profession = worker.profession
  const fullTitle = `${name} — ${profession} | 百邦`

  const alternates = generateAlternates('/workers', worker.slug)

  return {
    title: fullTitle,
    description: bio,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: fullTitle,
      description: bio,
      type: 'profile',
      locale,
      url: `${siteConfig.url}/${locale}/workers/${worker.slug}`,
      images: [{ url: worker.photo_url || ogImageUrl(fullTitle, bio), width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: bio,
      images: [worker.photo_url || ogImageUrl(fullTitle, bio)],
    },
  }
}

/**
 * Build full Metadata for a company page.
 */
export function buildCompanyMetadata(
  company: Company,
  locale: Locale
): Metadata {
  const nameField = `name_${locale}` as const
  const descField = `description_${locale}` as const

  const name =
    (company[nameField as keyof typeof company] as string) ??
    company.name_original
  const description = (
    (company[descField as keyof typeof company] as string) ?? ''
  ).substring(0, 155)

  const fullTitle = `${name} | 百邦`

  const alternates = generateAlternates('/companies', company.slug)

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      locale,
      url: `${siteConfig.url}/${locale}/companies/${company.slug}`,
      images: [{ url: company.logo_url || ogImageUrl(fullTitle, description), width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [company.logo_url || ogImageUrl(fullTitle, description)],
    },
  }
}
