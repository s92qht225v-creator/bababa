import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Inter, Noto_Sans_SC } from 'next/font/google'
import { routing } from '@/i18n/routing'
import { UserProvider } from '@/hooks/useUser'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ToastProvider } from '@/components/ui/Toast'
import type { Locale } from '@/types'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' })
const notoSansSC = Noto_Sans_SC({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-noto-sc' })

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
    <html lang={locale} dir="ltr" className={`${inter.variable} ${notoSansSC.variable}`}>
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
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
