'use client'

import { useTranslations, useLocale } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <a href={`/${locale}`} className="text-xl font-bold text-red-600">bababa</a>
            <p className="mt-2 text-xs text-gray-500">
              &copy; {new Date().getFullYear()} bababa. {t('copyright')}
            </p>
          </div>
          <div>
            <ul className="space-y-2 text-sm">
              <li><a href={`/${locale}/jobs`} className="text-gray-600 hover:text-gray-900">{t('jobs')}</a></li>
              <li><a href={`/${locale}/companies`} className="text-gray-600 hover:text-gray-900">{t('companies')}</a></li>
              <li><a href={`/${locale}/workers`} className="text-gray-600 hover:text-gray-900">{t('workers')}</a></li>
            </ul>
          </div>
          <div>
            <ul className="space-y-2 text-sm">
              <li><a href={`/${locale}/about`} className="text-gray-600 hover:text-gray-900">{t('about')}</a></li>
              <li><a href={`/${locale}/how-it-works`} className="text-gray-600 hover:text-gray-900">{t('how_it_works')}</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm text-gray-600">info@bababa.uz</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
