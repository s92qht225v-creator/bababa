import type { Metadata } from 'next'
import type {
  Locale,
  JobWithRelations,
  WorkerWithRelations,
  Company,
} from '@/types'

export const siteConfig = {
  name: 'bababa | 888',
  url: 'https://bababa.uz',
  defaultLocale: 'uz' as Locale,
  description: {
    uz: "O'zbekistondagi xitoy kompaniyalari uchun ish o'rinlari platformasi",
    zh: '连接乌兹别克斯坦中国企业与当地人才的招聘平台',
    ru: 'Платформа по трудоустройству для китайских компаний в Узбекистане',
  },
} as const

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
  const fullTitle = `${title} — ${companyName} | bababa`

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
  const fullTitle = `${name} — ${profession} | bababa`

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

  const fullTitle = `${name} | bababa`

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
    },
  }
}
