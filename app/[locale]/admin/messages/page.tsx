import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { AdminMessagesPage } from '@/components/admin/AdminMessagesPage'
import { getAdminConversations } from '@/lib/actions/admin'

export const dynamic = 'force-dynamic'

export default async function AdminMessages({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()

  const [{ data: reports }, conversations] = await Promise.all([
    supabase
      .from('message_reports')
      .select('id, reason, status, created_at, messages(body_original, sender_id, profiles!messages_sender_id_fkey(full_name)), reporter:profiles!message_reports_reported_by_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(200),
    getAdminConversations(),
  ])

  return <AdminMessagesPage reports={(reports ?? []) as any} conversations={conversations as any} />
}
