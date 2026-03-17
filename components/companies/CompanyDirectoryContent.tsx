'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

interface CompanyItem {
  id: string
  slug: string
  name: string
  industry: string | null
  logo_url: string | null
  is_verified: boolean
  job_count: number
}

export function CompanyDirectoryContent({
  companies,
  locale,
}: {
  companies: CompanyItem[]
  locale: string
}) {
  const t = useTranslations('companies_page')
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('')

  const industries = [...new Set(companies.map((c) => c.industry).filter(Boolean))] as string[]

  const filtered = companies.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (industry && c.industry !== industry) return false
    return true
  })

  return (
    <>
      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search_placeholder')}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          <option value="">{t('all_industries')}</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500">{t('no_companies')}</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((company) => (
            <a
              key={company.id}
              href={`/${locale}/companies/${company.slug}`}
              className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-red-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                {company.logo_url ? (
                  <Image
                    src={company.logo_url}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-lg font-bold text-red-600">
                    {company.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{company.name}</h3>
                  {company.is_verified && (
                    <span className="text-xs text-green-600">✓</span>
                  )}
                </div>
              </div>
              {company.industry && (
                <p className="mt-2 text-sm text-gray-500">{company.industry}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                {t('open_positions', { count: company.job_count })}
              </p>
            </a>
          ))}
        </div>
      )}
    </>
  )
}
