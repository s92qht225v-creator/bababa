import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { LoginForm } from './LoginForm'

export const metadata = { robots: { index: false, follow: false } }

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm sm:p-10">
        <Suspense>
          <LoginForm locale={locale} />
        </Suspense>
      </div>
    </main>
  )
}
