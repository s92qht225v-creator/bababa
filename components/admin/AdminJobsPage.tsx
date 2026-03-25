'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { updateJobAdmin, retryTranslation } from '@/lib/actions/admin'
import { useToast } from '@/components/ui/Toast'

interface Job {
  id: string
  title_original: string
  status: string
  translation_status: string | null
  views_count: number
  created_at: string
  companies: { name_original: string; logo_url: string | null } | null
  job_categories: { name_uz: string; name_zh: string; name_ru: string } | null
  applications: { id: string }[]
}

const tabs = ['all', 'active', 'paused', 'closed', 'failed'] as const

export function AdminJobsPage({ jobs: initial, locale }: { jobs: Job[]; locale: string }) {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [jobs, setJobs] = useState(initial)
  const [tab, setTab] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = jobs.filter((j) => {
    if (tab === 'failed') return j.translation_status === 'failed'
    if (tab !== 'all' && j.status !== tab) return false
    if (search && !j.title_original.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleStatus(id: string, status: string) {
    setLoading(id)
    const result = await updateJobAdmin(id, status)
    if (result.success) {
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)))
      toast(`Job ${status}`, 'success')
    } else {
      toast(result.error ?? t('error'), 'error')
    }
    setLoading(null)
  }

  async function handleRetry(id: string) {
    setLoading(id)
    const result = await retryTranslation(id)
    if (result.success) {
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, translation_status: 'done' } : j)))
      toast(t('translation_retried'), 'success')
    } else {
      toast(result.error ?? t('error'), 'error')
    }
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('jobs')}</h1>

      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {tabs.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === key ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder={t('search_placeholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none sm:max-w-xs"
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_job')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_company')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_status')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_translation')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_apps')}</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">{t('th_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((j) => (
              <tr key={j.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{j.title_original}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(j.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {j.companies?.name_original ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={j.status} />
                </td>
                <td className="px-4 py-3">
                  <TranslationBadge status={j.translation_status ?? 'pending'} />
                </td>
                <td className="px-4 py-3 text-gray-500">{j.applications?.length ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {j.status === 'active' && (
                      <button
                        onClick={() => handleStatus(j.id, 'paused')}
                        disabled={loading === j.id}
                        className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200 disabled:opacity-50"
                      >
                        {t('paused')}
                      </button>
                    )}
                    {j.status === 'paused' && (
                      <button
                        onClick={() => handleStatus(j.id, 'active')}
                        disabled={loading === j.id}
                        className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
                      >
                        {t('active')}
                      </button>
                    )}
                    {j.status !== 'closed' && (
                      <button
                        onClick={() => handleStatus(j.id, 'closed')}
                        disabled={loading === j.id}
                        className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                      >
                        {t('closed')}
                      </button>
                    )}
                    {j.translation_status === 'failed' && (
                      <button
                        onClick={() => handleRetry(j.id)}
                        disabled={loading === j.id}
                        className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                      >
                        {t('retry_translation')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  {t('no_data')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function TranslationBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    done: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
