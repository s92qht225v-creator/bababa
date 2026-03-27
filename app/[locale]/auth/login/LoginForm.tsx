'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { login, resendConfirmation } from '@/lib/actions/auth'
import { GoogleButton } from '@/components/layout/GoogleButton'

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const isSuspended = searchParams.get('suspended') === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [showResend, setShowResend] = useState(false)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = t('error_invalid_email')
    if (!password || password.length < 8) e.password = t('error_weak_password')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSubmitting(true)

    const result = await login(email.trim(), password)

    if (result.error) {
      setServerError(
        result.error.startsWith('error_') ? t(result.error) : result.error
      )
      setShowResend(result.error === 'error_email_not_confirmed')
      setResendSent(false)
      setSubmitting(false)
      return
    }

    if (result.redirectTo) {
      window.location.href = result.redirectTo
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-center text-2xl font-bold tracking-tight">{t('login_title')}</h1>

      {isSuspended && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {t('account_suspended')}
        </div>
      )}

      {/* Social login */}
      <GoogleButton locale={locale} />

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-gray-300" />
        <span className="mx-4 shrink-0 text-sm text-gray-500">
          {t('or')}
        </span>
        <div className="flex-grow border-t border-gray-300" />
      </div>

      {serverError && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600">
          <p>{serverError}</p>
          {showResend && !resendSent && (
            <button
              type="button"
              disabled={resending}
              onClick={async () => {
                setResending(true)
                const result = await resendConfirmation(email)
                if (!result.error) setResendSent(true)
                setResending(false)
              }}
              className="mt-2 font-medium text-red-700 underline hover:no-underline disabled:opacity-50"
            >
              {resending ? `${t('resend_button')}...` : t('resend_button')}
            </button>
          )}
          {resendSent && (
            <p className="mt-2 text-green-600">{t('resend_success')}</p>
          )}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('email')}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
            errors.email
              ? 'border-red-400 focus:ring-red-200'
              : 'border-gray-200 bg-gray-50/50 focus:border-red-300 focus:bg-white focus:ring-red-100'
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('password')}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
            errors.password
              ? 'border-red-400 focus:ring-red-200'
              : 'border-gray-300 focus:ring-red-200'
          }`}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {/* Remember me + forgot password */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-gray-600">
          <input type="checkbox" className="rounded border-gray-300" />
          {t('remember_me')}
        </label>
        <a
          href={`/${locale}/auth/forgot-password`}
          className="text-red-600 hover:underline"
        >
          {t('forgot_password')}
        </a>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-red-200 transition-all hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 disabled:opacity-50"
      >
        {submitting ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('login_button')}...
          </>
        ) : t('login_button')}
      </button>

      <p className="text-center text-sm text-gray-600">
        {t('dont_have_account')}{' '}
        <a
          href={`/${locale}/auth/register`}
          className="font-medium text-red-600 hover:underline"
        >
          {t('register_link')}
        </a>
      </p>
    </form>
  )
}
