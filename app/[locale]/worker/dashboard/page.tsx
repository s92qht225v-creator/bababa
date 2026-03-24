import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkerDashboardContent } from './DashboardContent'

export const dynamic = 'force-dynamic'

export default async function WorkerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // Update last_active timestamp
  await supabase
    .from('worker_profiles')
    .update({ last_active: new Date().toISOString() })
    .eq('user_id', user.id)

  return (
    <WorkerDashboardContent
      locale={locale}
      userName={profile?.full_name ?? ''}
      userRole={profile?.role ?? 'worker'}
    />
  )
}
