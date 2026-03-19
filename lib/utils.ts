import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Locale, LocalizedField } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get a localized value from a trilingual object.
 * Falls back through uz → ru → zh → first non-null value.
 */
export function localized(
  field: LocalizedField | null | undefined,
  locale: Locale
): string {
  if (!field) return ''
  const val = field[locale]
  if (val) return val
  // Fallback order
  const fallbacks: Locale[] = ['uz', 'ru', 'zh']
  for (const fb of fallbacks) {
    if (field[fb]) return field[fb]!
  }
  return ''
}

/**
 * Get the localized column name for a given base field and locale.
 * e.g. localizedColumn('title', 'zh') → 'title_zh'
 */
export function localizedColumn(base: string, locale: Locale): string {
  return `${base}_${locale}`
}

/**
 * Format salary range for display.
 */
export function formatSalary(
  min: number | null,
  max: number | null,
  currency: string = 'USD'
): string {
  if (min == null && max == null) return '—'

  const fmt = (n: number) => {
    if (currency === 'UZS') {
      // 3000000 → "3 000 000"
      return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    }
    return n.toLocaleString('en-US')
  }

  const symbol = currency === 'UZS' ? '' : currency === 'CNY' ? '¥' : '$'
  const suffix = currency === 'UZS' ? ' UZS' : ''

  if (min != null && max != null) {
    return `${symbol}${fmt(min)}–${symbol}${fmt(max)}${suffix}`
  }
  if (min != null) return `${symbol}${fmt(min)}+${suffix}`
  return `${symbol}${fmt(max!)}${suffix}`
}
