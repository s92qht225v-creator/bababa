import { setRequestLocale } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function EmployerSavedWorkersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main>
      <h1>Employer Saved Workers</h1>
      {/* Auth-gated employer saved-workers — UI built in later sessions */}
    </main>
  )
}
