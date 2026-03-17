import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { AdminTranslationsPage } from '@/components/admin/AdminTranslationsPage'

export const dynamic = 'force-dynamic'

export default async function AdminTranslations({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()

  const [{ data: failedJobs }, { data: failedWorkers }, { data: overrides }] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, title_original, description_original, source_language, translation_status')
      .eq('translation_status', 'failed'),
    supabase
      .from('worker_profiles')
      .select('id, bio_original, bio_translation_status, profiles!worker_profiles_user_id_fkey(full_name)')
      .eq('bio_translation_status', 'failed'),
    supabase
      .from('translation_overrides')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  return (
    <AdminTranslationsPage
      failedJobs={failedJobs ?? []}
      failedWorkers={failedWorkers ?? []}
      overrides={overrides ?? []}
      locale={locale}
    />
  )
}
