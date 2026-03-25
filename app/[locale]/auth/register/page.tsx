import { setRequestLocale } from 'next-intl/server'
import { RegisterForm } from './RegisterForm'

export const metadata = { robots: { index: false, follow: false } }

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm sm:p-10">
        <RegisterForm locale={locale} />
      </div>
    </main>
  )
}
