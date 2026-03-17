import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { siteConfig } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'
import type { Locale } from '@/types'

export const revalidate = 86400

const META_TITLES: Record<Locale, string> = {
  uz: 'bababa haqida',
  zh: '关于 bababa',
  ru: 'О платформе bababa',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale
  return {
    title: `${META_TITLES[l]} | ${siteConfig.name}`,
    description: siteConfig.description[l],
    alternates: {
      canonical: `${siteConfig.url}/${l}/about`,
      languages: {
        uz: `${siteConfig.url}/uz/about`,
        zh: `${siteConfig.url}/zh/about`,
        ru: `${siteConfig.url}/ru/about`,
      },
    },
  }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('about')

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'bababa',
    url: siteConfig.url,
    description: siteConfig.description[locale as Locale],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@bababa.uz',
      contactType: 'customer service',
    },
  }

  return (
    <>
      <JsonLd data={orgJsonLd} />
      <BreadcrumbSchema
        items={[
          { name: 'bababa', href: `/${locale}` },
          { name: t('title'), href: `/${locale}/about` },
        ]}
      />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">{t('title')}</h1>

        <p className="mt-6 text-lg leading-relaxed text-gray-700">
          {t('what_is')}
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">{t('who_for')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('for_workers_desc')}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">{t('who_for')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('for_employers_desc')}</p>
          </div>
        </div>

        <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">{t('how_translation')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('translation_desc')}</p>
        </div>

        <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">{t('contact')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('contact_email')}</p>
        </div>
      </div>
    </>
  )
}
