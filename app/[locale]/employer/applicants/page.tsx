import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { ApplicantKanban } from '@/components/applicants/ApplicantKanban'

export const dynamic = 'force-dynamic'

export default async function EmployerApplicantsPage({
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
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </main>
    }>
      <ApplicantKanban />
    </Suspense>
  )
}
