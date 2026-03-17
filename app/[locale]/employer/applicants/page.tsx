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

  return <ApplicantKanban />
}
