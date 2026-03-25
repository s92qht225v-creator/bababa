'use client'

import { useTranslations, useLocale } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()

  return (
    <footer className="border-t border-gray-100 bg-gray-50/80">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <a href={`/${locale}`} className="inline-block">
              <img src="/logo.svg" alt="百邦" className="h-7" />
            </a>
            <p className="mt-3 text-xs leading-relaxed text-gray-400">
              &copy; {new Date().getFullYear()} 百邦.
              <br />
              {t('copyright')}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t('platform')}
            </p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li><a href={`/${locale}/jobs`} className="text-gray-500 transition hover:text-gray-900">{t('jobs')}</a></li>
              <li><a href={`/${locale}/companies`} className="text-gray-500 transition hover:text-gray-900">{t('companies')}</a></li>
              <li><a href={`/${locale}/workers`} className="text-gray-500 transition hover:text-gray-900">{t('workers')}</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t('company')}
            </p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li><a href={`/${locale}/about`} className="text-gray-500 transition hover:text-gray-900">{t('about')}</a></li>
              <li><a href={`/${locale}/how-it-works`} className="text-gray-500 transition hover:text-gray-900">{t('how_it_works')}</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Contact
            </p>
            <p className="mt-3 text-sm text-gray-500">info@baibang.uz</p>
            <a href="tel:+998911733231" className="mt-1 block text-sm text-gray-500 transition hover:text-gray-900">+998 91 173 32 31</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
