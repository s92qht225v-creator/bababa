import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { AdminCompaniesPage } from '@/components/admin/AdminCompaniesPage'

export const dynamic = 'force-dynamic'

export default async function AdminCompanies({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('*, profiles!companies_user_id_fkey(full_name, phone), jobs(id)')
    .order('created_at', { ascending: false })

  return <AdminCompaniesPage companies={companies ?? []} locale={locale} />
}
