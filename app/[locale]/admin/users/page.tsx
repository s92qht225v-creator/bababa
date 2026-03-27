import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { AdminUsersPage } from '@/components/admin/AdminUsersPage'

export const dynamic = 'force-dynamic'

export default async function AdminUsers({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone, email, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  return <AdminUsersPage users={(users ?? []) as any} />
}
