import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { AdminJobsPage } from '@/components/admin/AdminJobsPage'

export const dynamic = 'force-dynamic'

export default async function AdminJobs({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, companies(name_original, logo_url), job_categories(name_uz, name_zh, name_ru), applications(id)')
    .order('created_at', { ascending: false })

  return <AdminJobsPage jobs={jobs ?? []} locale={locale} />
}
