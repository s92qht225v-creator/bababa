'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { saveCompanyProfile, uploadCompanyLogo } from '@/lib/actions/company'
import { useToast } from '@/components/ui/Toast'
import Image from 'next/image'

interface CompanyData {
  id: string
  name_original: string
  name_uz: string | null
  name_zh: string | null
  name_ru: string | null
  logo_url: string | null
  industry: string | null
  description_uz: string | null
  description_zh: string | null
  description_ru: string | null
  website: string | null
  established_year: number | null
  employee_count: string | null
}

export function CompanyProfileForm({
  company,
  locale,
}: {
  company: CompanyData
  locale: string
}) {
  const t = useTranslations('company_profile')
  const { toast } = useToast()

  const [nameOriginal, setNameOriginal] = useState(company.name_original)
  const [nameUz, setNameUz] = useState(company.name_uz ?? '')
  const [nameZh, setNameZh] = useState(company.name_zh ?? '')
  const [nameRu, setNameRu] = useState(company.name_ru ?? '')
  const [industry, setIndustry] = useState(company.industry ?? '')
  const [description, setDescription] = useState(
    (company[`description_${locale}` as keyof CompanyData] as string) ?? ''
  )
  const [descLang, setDescLang] = useState(locale)
  const [website, setWebsite] = useState(company.website ?? '')
  const [establishedYear, setEstablishedYear] = useState(company.established_year?.toString() ?? '')
  const [employeeCount, setEmployeeCount] = useState(company.employee_count ?? '')
  const [logoUrl, setLogoUrl] = useState(company.logo_url ?? '')
  const [saving, setSaving] = useState(false)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('logo', file)
    const result = await uploadCompanyLogo(formData)
    if (result.success && result.url) {
      setLogoUrl(result.url)
      toast(t('saved'), 'success')
    } else {
      toast(result.error ?? 'Error', 'error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await saveCompanyProfile({
      nameOriginal,
      nameUz,
      nameZh,
      nameRu,
      industry,
      descriptionOriginal: description,
      sourceLanguage: descLang,
      website,
      establishedYear: establishedYear ? Number(establishedYear) : null,
      employeeCount,
    })
    setSaving(false)
    if (result.success) {
      toast(t('saved'), 'success')
    } else {
      toast(result.error ?? 'Error', 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('logo')}</label>
        <div className="mt-2 flex items-center gap-4">
          {logoUrl ? (
            <Image src={logoUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-red-100 text-2xl font-bold text-red-600">
              {nameOriginal.charAt(0)}
            </div>
          )}
          <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            {t('upload_logo')}
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Name fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('name_original')}</label>
          <input
            type="text"
            value={nameOriginal}
            onChange={(e) => setNameOriginal(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('name_uz')}</label>
          <input
            type="text"
            value={nameUz}
            onChange={(e) => setNameUz(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('name_zh')}</label>
          <input
            type="text"
            value={nameZh}
            onChange={(e) => setNameZh(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('name_ru')}</label>
          <input
            type="text"
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Industry */}
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('industry')}</label>
        <input
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">{t('description')}</label>
          <select
            value={descLang}
            onChange={(e) => setDescLang(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="uz">O&apos;zbek</option>
            <option value="zh">中文</option>
            <option value="ru">Русский</option>
          </select>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('description_placeholder')}
          rows={5}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>

      {/* Website, Founded, Employees */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('website')}</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('founded_year')}</label>
          <input
            type="number"
            value={establishedYear}
            onChange={(e) => setEstablishedYear(e.target.value)}
            min="1900"
            max="2030"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('employee_count')}</label>
          <input
            type="text"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
            placeholder="10-50"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {saving ? t('saving') : t('save')}
      </button>
    </form>
  )
}
