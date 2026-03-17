import { setRequestLocale } from 'next-intl/server'
import { WorkerDashboardContent } from './DashboardContent'

export const dynamic = 'force-dynamic'

export default async function WorkerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <WorkerDashboardContent locale={locale} />
}
