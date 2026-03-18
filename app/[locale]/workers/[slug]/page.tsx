import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildWorkerMetadata } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'
import { SaveWorkerButton } from '@/components/workers/SaveWorkerButton'
import Image from 'next/image'
import { localizeLocation } from '@/lib/location-names'
import type { Locale, WorkerWithRelations, ExperienceEntry } from '@/types'

// Map DB language codes to translation keys
const LANG_KEY_MAP: Record<string, string> = {
  uz: 'uzbek', uzbek: 'uzbek',
  zh: 'chinese', chinese: 'chinese',
  ru: 'russian', russian: 'russian',
  en: 'english', english: 'english',
  ko: 'korean', korean: 'korean',
  other: 'other',
}

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = await createClient()

  const { data: worker } = await supabase
    .from('worker_profiles')
    .select('*, profile:profiles(*)')
    .eq('slug', slug)
    .single()

  if (!worker || !worker.is_public) {
    return {
      title: 'Worker Not Found',
      robots: { index: false, follow: false },
    }
  }

  return buildWorkerMetadata(worker as WorkerWithRelations, locale as Locale)
}

export default async function WorkerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const l = locale as Locale
  const t = await getTranslations('worker')
  const supabase = await createClient()

  const { data: worker } = await supabase
    .from('worker_profiles')
    .select('*, profile:profiles(*), location:locations(*), category:job_categories(*)')
    .eq('slug', slug)
    .single()

  // Check visibility: owner can see own hidden profile
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isOwner = user?.id === worker?.user_id
  if (!worker || (!worker.is_public && !isOwner)) notFound()

  const name = (worker.profile?.full_name
    || worker.slug?.split('-').slice(0, 2).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    || '') as string
  const bio = (worker[`bio_${l}`] ?? worker.bio_original ?? '') as string
  const categoryName = (worker.category?.[`name_${l}`] ?? worker.category?.name_uz ?? '') as string
  const location = worker.location as { city: string; region: string } | null
  const experienceHistory = (worker.experience_history ?? []) as ExperienceEntry[]

  const formatSalary = () => {
    const min = worker.expected_salary_min as number | null
    const max = worker.expected_salary_max as number | null
    if (!min && !max) return '—'
    const cur = worker.salary_currency === 'UZS' ? 'UZS ' : '$'
    if (min && max) return `${cur}${min.toLocaleString()} – ${cur}${max.toLocaleString()}`
    if (min) return `${cur}${min.toLocaleString()}+`
    return `${cur}${max!.toLocaleString()}`
  }

  const hskLabel = worker.hsk_level === 0 ? t('no_chinese') : `HSK ${worker.hsk_level}`

  const daysAgo = Math.floor(
    (Date.now() - new Date(worker.last_active).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Check if employer has saved this worker
  let isSaved = false
  if (user && user.id !== worker.user_id) {
    const { data: savedRow } = await supabase
      .from('saved_workers')
      .select('id')
      .eq('employer_id', user.id)
      .eq('worker_id', worker.id)
      .maybeSingle()
    isSaved = !!savedRow
  }

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: worker.profession,
    ...(worker.photo_url ? { image: worker.photo_url } : {}),
  }

  return (
    <>
      <JsonLd data={personJsonLd} />
      <BreadcrumbSchema
        items={[
          { name: 'bababa', href: `/${locale}` },
          { name: t('all_workers'), href: `/${locale}/workers` },
          { name, href: `/${locale}/workers/${slug}` },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          {worker.photo_url ? (
            <Image
              src={worker.photo_url}
              alt={name}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-3xl font-bold text-red-600">
              {name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{name}</h1>
              {worker.is_verified && (
                <span className="text-sm text-green-600">✓ {t('verified')}</span>
              )}
            </div>
            <p className="mt-1 text-gray-600">{worker.profession}</p>
            {location && (
              <p className="mt-1 text-sm text-gray-500">📍 {localizeLocation(location.city, location.region, locale)}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {worker.availability_status === 'available' && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                  {t('available_now')}
                </span>
              )}
              {worker.availability_status === 'available_from' && worker.available_from && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-700">
                  {t('available_from')} {new Date(worker.available_from).toLocaleDateString()}
                </span>
              )}
              <span className="text-gray-400">
                {t('last_active')}: {daysAgo === 0 ? t('days_ago', { days: 0 }) : t('days_ago', { days: daysAgo })}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons for employers */}
        {user && user.id !== worker.user_id && (
          <div className="mt-6 flex gap-3">
            <a
              href={`/${locale}/messages?partner=${worker.user_id}`}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {t('contact_worker')}
            </a>
            <SaveWorkerButton workerId={worker.id} initialSaved={isSaved} />
          </div>
        )}

        {/* Not logged in */}
        {!user && (
          <div className="mt-6">
            <a
              href={`/${locale}/auth/login`}
              className="inline-block rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              {t('login_to_contact')}
            </a>
          </div>
        )}

        {/* Info cards */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">{t('professional_info')}</h2>
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            {categoryName && <p>• {t('category')}: {categoryName}</p>}
            <p>• {t('chinese_level')}: {hskLabel}</p>
            <p>• {t('experience_years')}: {worker.experience_years}+</p>
            <p>• {t('salary_expectations')}: {formatSalary()}</p>
          </div>
        </div>

        {/* Skills */}
        {worker.skills && (worker.skills as string[]).length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">{t('skills')}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(worker.skills as string[]).map((skill) => (
                <span key={skill} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {worker.languages && (worker.languages as string[]).length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">{t('language_skills')}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(worker.languages as string[]).map((lang) => {
                const key = LANG_KEY_MAP[lang] ?? lang
                return (
                  <span key={lang} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                    {t(key as 'uzbek' | 'russian' | 'english' | 'korean' | 'other')}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Bio */}
        {bio && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">{t('about_me')}</h2>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {bio}
            </div>
          </div>
        )}

        {/* Experience history */}
        {experienceHistory.length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">{t('work_experience')}</h2>
            <div className="mt-3 space-y-4">
              {experienceHistory.map((exp, i) => (
                <div key={i} className="border-l-2 border-gray-200 pl-4">
                  <p className="font-medium text-gray-900">{exp.title}</p>
                  <p className="text-sm text-gray-600">{exp.company}</p>
                  <p className="text-xs text-gray-400">{exp.from} – {exp.to || 'Present'}</p>
                  {exp.description && (
                    <p className="mt-1 text-sm text-gray-700">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video intro */}
        {worker.video_url && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">{t('video_intro')}</h2>
            <video
              src={worker.video_url}
              controls
              className="mt-3 w-full rounded-lg"
            />
          </div>
        )}
      </main>
    </>
  )
}
