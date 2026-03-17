import { setRequestLocale } from 'next-intl/server'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <ForgotPasswordForm locale={locale} />
      </div>
    </main>
  )
}
