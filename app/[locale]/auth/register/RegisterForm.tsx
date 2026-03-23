'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { register } from '@/lib/actions/auth'
import { TelegramButton } from '@/components/layout/TelegramButton'
import type { Locale, UserRole } from '@/types'

export function RegisterForm({ locale }: { locale: string }) {
  const t = useTranslations('auth')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [companyName, setCompanyName] = useState('')
  const [langPref, setLangPref] = useState<Locale>(locale as Locale)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!fullName || fullName.trim().length < 2) e.fullName = t('error_name_min')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = t('error_invalid_email')
    if (!password || password.length < 8) e.password = t('error_weak_password')
    if (!role) e.role = t('error_required')
    if (role === 'employer' && !companyName.trim())
      e.companyName = t('error_required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSubmitting(true)

    const result = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      role: role as UserRole,
      companyName: companyName.trim() || undefined,
      languagePreference: langPref,
    })

    if (result.error) {
      setServerError(
        result.error.startsWith('error_') ? t(result.error) : result.error
      )
      setSubmitting(false)
      return
    }

    if (result.redirectTo) {
      window.location.href = result.redirectTo
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-center text-2xl font-bold">{t('register_title')}</h1>

      {/* Telegram */}
      <TelegramButton />

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-gray-300" />
        <span className="mx-4 shrink-0 text-sm text-gray-500">
          {t('or')}
        </span>
        <div className="flex-grow border-t border-gray-300" />
      </div>

      {serverError && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">
          {serverError}
        </p>
      )}

      {/* Full name */}
      <Field
        label={t('full_name')}
        value={fullName}
        onChange={setFullName}
        error={errors.fullName}
        required
      />

      {/* Phone */}
      <Field
        label={t('phone')}
        value={phone}
        onChange={setPhone}
        type="tel"
      />

      {/* Email */}
      <Field
        label={t('email')}
        value={email}
        onChange={setEmail}
        type="email"
        error={errors.email}
        required
      />

      {/* Password */}
      <Field
        label={t('password')}
        value={password}
        onChange={setPassword}
        type="password"
        error={errors.password}
        required
      />

      {/* Role selector */}
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-gray-700">
          {t('role_label')}
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <RoleCard
            selected={role === 'worker'}
            onClick={() => setRole('worker')}
            icon="👷"
            title={t('role_worker')}
            desc={t('role_worker_desc')}
          />
          <RoleCard
            selected={role === 'employer'}
            onClick={() => setRole('employer')}
            icon="🏢"
            title={t('role_employer')}
            desc={t('role_employer_desc')}
          />
        </div>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role}</p>
        )}
      </fieldset>

      {/* Company name — only when employer */}
      {role === 'employer' && (
        <Field
          label={t('company_name')}
          value={companyName}
          onChange={setCompanyName}
          error={errors.companyName}
          required
        />
      )}

      {/* Language preference */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('language_preference')}
        </label>
        <div className="flex gap-2">
          {(['uz', 'zh', 'ru'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLangPref(l)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                langPref === l
                  ? 'border-red-600 bg-red-600 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {submitting ? '...' : t('register_button')}
      </button>

      <p className="text-center text-sm text-gray-600">
        {t('already_have_account')}{' '}
        <a
          href={`/${locale}/auth/login`}
          className="font-medium text-red-600 hover:underline"
        >
          {t('login_link')}
        </a>
      </p>
    </form>
  )
}

/* ── Reusable field ── */
function Field({
  label,
  value,
  onChange,
  type = 'text',
  error,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  error?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-gray-300 focus:ring-red-200'
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

/* ── Role card ── */
function RoleCard({
  selected,
  onClick,
  icon,
  title,
  desc,
}: {
  selected: boolean
  onClick: () => void
  icon: string
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-lg border-2 p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-red-300 ${
        selected
          ? 'border-red-600 bg-red-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {selected && (
        <span className="absolute right-2 top-2 text-red-600">✓</span>
      )}
      <span className="text-2xl">{icon}</span>
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{desc}</p>
    </button>
  )
}
