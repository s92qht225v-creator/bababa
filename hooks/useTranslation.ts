'use client'

import { useTranslations, useLocale } from 'next-intl'
import type { Locale } from '@/types'

export function useTranslation(namespace?: string) {
  const t = useTranslations(namespace)
  const locale = useLocale() as Locale

  return { t, locale }
}
