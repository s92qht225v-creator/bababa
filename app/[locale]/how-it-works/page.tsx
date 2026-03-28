import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { siteConfig, ogImageUrl } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'
import { HowItWorksTabs } from '@/components/home/HowItWorksTabs'
import type { Locale } from '@/types'

export const revalidate = 86400

const META_TITLES: Record<Locale, string> = {
  uz: 'Qanday ishlaydi',
  zh: '如何使用',
  ru: 'Как это работает',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const l = locale as Locale
  const title = `${META_TITLES[l]} | ${siteConfig.name}`
  const description = siteConfig.description[l]
  return {
    title,
    description,
    alternates: {
      canonical: `${siteConfig.url}/${l}/how-it-works`,
      languages: {
        uz: `${siteConfig.url}/uz/how-it-works`,
        zh: `${siteConfig.url}/zh/how-it-works`,
        ru: `${siteConfig.url}/ru/how-it-works`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: l,
      url: `${siteConfig.url}/${l}/how-it-works`,
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

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('how_it_works_page')
  const tHome = await getTranslations('home')

  const faqItems = Array.from({ length: 8 }, (_, i) => ({
    question: t(`faq_${i + 1}_q`),
    answer: t(`faq_${i + 1}_a`),
  }))

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <BreadcrumbSchema
        items={[
          { name: '百邦', href: `/${locale}` },
          { name: t('title'), href: `/${locale}/how-it-works` },
        ]}
      />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold">{t('title')}</h1>

        {/* Steps tabs — reuses homepage component */}
        <div className="mt-10">
          <HowItWorksTabs />
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold">{t('faq_title')}</h2>
          <div className="mt-6 space-y-4">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-lg border border-gray-200 bg-white"
              >
                <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-gray-900 group-open:border-b group-open:border-gray-200">
                  {item.question}
                </summary>
                <p className="px-6 py-4 text-sm text-gray-600">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
