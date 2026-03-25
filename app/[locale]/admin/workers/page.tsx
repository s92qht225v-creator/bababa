import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { AdminWorkersPage } from '@/components/admin/AdminWorkersPage'

export const dynamic = 'force-dynamic'

export default async function AdminWorkers({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const { data: workers } = await supabase
    .from('worker_profiles')
    .select('id, photo_url, profession, profession_uz, profession_zh, profession_ru, hsk_level, experience_years, verification_status, is_verified, created_at, profiles!worker_profiles_user_id_fkey(full_name, phone), job_categories(name_uz, name_zh, name_ru)')
    .order('created_at', { ascending: false })
    .limit(500)

  return <AdminWorkersPage workers={workers ?? []} locale={locale} />
}
