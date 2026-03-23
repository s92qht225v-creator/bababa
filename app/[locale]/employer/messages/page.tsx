import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { MessagesPageContent } from '@/components/messages/MessagesPageContent'

export const dynamic = 'force-dynamic'

export default async function EmployerMessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <Suspense fallback={
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-96 animate-pulse rounded-lg bg-gray-100" />
      </main>
    }>
      <MessagesPageContent />
    </Suspense>
  )
}
