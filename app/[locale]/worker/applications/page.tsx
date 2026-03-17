import { setRequestLocale } from 'next-intl/server'
import { ApplicationList } from '@/components/applications/ApplicationList'

export const dynamic = 'force-dynamic'

export default async function WorkerApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ApplicationList />
}
