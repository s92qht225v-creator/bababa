import { setRequestLocale } from 'next-intl/server'
import { EmployerDashboardContent } from './DashboardContent'

export const dynamic = 'force-dynamic'

export default async function EmployerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <EmployerDashboardContent locale={locale} />
}
