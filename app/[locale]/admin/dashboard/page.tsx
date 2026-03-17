import { setRequestLocale } from 'next-intl/server'
import { getAdminStats, getDashboardChartData, getRecentActivity } from '@/lib/actions/admin'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const [stats, chartData, activity] = await Promise.all([
    getAdminStats(),
    getDashboardChartData(30),
    getRecentActivity(10),
  ])

  return (
    <AdminDashboard
      stats={stats}
      chartData={chartData}
      activity={activity}
      locale={locale}
    />
  )
}
