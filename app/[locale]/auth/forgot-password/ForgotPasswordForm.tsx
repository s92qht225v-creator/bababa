'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { forgotPassword } from '@/lib/actions/auth'

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('error_invalid_email'))
      return
    }

    setSubmitting(true)
    const result = await forgotPassword(email.trim())
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t('reset_password_title')}</h1>
        <p className="text-sm text-gray-600">
          {t('reset_password_email_sent')}
        </p>
        <a
          href={`/${locale}/auth/login`}
          className="inline-block text-sm font-medium text-red-600 hover:underline"
        >
          {t('back_to_login')}
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-center text-2xl font-bold">
        {t('reset_password_title')}
      </h1>
      <p className="text-center text-sm text-gray-600">
        {t('reset_password_desc')}
      </p>

      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('email')}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-red-200"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {submitting ? '...' : t('reset_password_button')}
      </button>

      <p className="text-center">
        <a
          href={`/${locale}/auth/login`}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          {t('back_to_login')}
        </a>
      </p>
    </form>
  )
}
