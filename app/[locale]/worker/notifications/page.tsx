import { setRequestLocale } from 'next-intl/server'
import { NotificationList } from '@/components/notifications/NotificationList'

export const dynamic = 'force-dynamic'

export default async function WorkerNotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <NotificationList />
}
