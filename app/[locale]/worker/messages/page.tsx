import { setRequestLocale } from 'next-intl/server'
import { MessagesPageContent } from '@/components/messages/MessagesPageContent'

export const dynamic = 'force-dynamic'

export default async function WorkerMessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <MessagesPageContent />
}
