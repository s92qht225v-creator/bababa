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
    .select('id, title_original, status, translation_status, created_at, companies(name_original), applications(id)')
    .order('created_at', { ascending: false })
    .limit(500)

  return <AdminJobsPage jobs={(jobs ?? []) as any} locale={locale} />
}
