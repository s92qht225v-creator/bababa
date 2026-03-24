import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { DM_Sans } from 'next/font/google'
import { routing } from '@/i18n/routing'
import { UserProvider } from '@/hooks/useUser'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ToastProvider } from '@/components/ui/Toast'
import type { Locale } from '@/types'
import '@/app/globals.css'

const dmSans = DM_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-dm-sans' })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <html lang={locale} dir="ltr" className={dmSans.variable}>
      <head>
        {locale === 'zh' && (
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap"
            rel="stylesheet"
          />
        )}
      </head>
      <body className={`min-h-screen bg-gray-50/50 font-sans text-gray-900 antialiased ${locale === 'zh' ? 'font-chinese' : ''}`}>
        <NextIntlClientProvider messages={messages}>
          <UserProvider>
            <ToastProvider>
              <Header />
              <main className="min-h-[calc(100vh-200px)]">
                {children}
              </main>
              <Footer />
            </ToastProvider>
          </UserProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
