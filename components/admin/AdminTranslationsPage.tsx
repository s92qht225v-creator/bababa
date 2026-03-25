'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  retryTranslation,
  manualTranslation,
  saveTranslationOverride,
  deleteTranslationOverride,
} from '@/lib/actions/admin'
import { useToast } from '@/components/ui/Toast'

interface FailedJob {
  id: string
  title_original: string
  description_original: string | null
  source_language: string
  translation_status: string
}

interface FailedWorker {
  id: string
  bio_original: string | null
  bio_translation_status: string
  profiles: { full_name: string }[] | { full_name: string } | null
}

interface Override {
  id: string
  term_en: string
  term_zh: string | null
  term_uz: string | null
  term_ru: string | null
  created_at: string
}

export function AdminTranslationsPage({
  failedJobs: initialJobs,
  failedWorkers: initialWorkers,
  overrides: initialOverrides,
  locale,
}: {
  failedJobs: FailedJob[]
  failedWorkers: FailedWorker[]
  overrides: Override[]
  locale: string
}) {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [failedJobs, setFailedJobs] = useState(initialJobs)
  const [failedWorkers] = useState(initialWorkers)
  const [overrides, setOverrides] = useState(initialOverrides)
  const [loading, setLoading] = useState<string | null>(null)
  const [editingManual, setEditingManual] = useState<{ table: string; id: string; field: string } | null>(null)
  const [manualText, setManualText] = useState('')
  const [newOverride, setNewOverride] = useState({ term_en: '', term_zh: '', term_uz: '', term_ru: '' })
  const [showAddForm, setShowAddForm] = useState(false)

  async function handleRetry(jobId: string) {
    setLoading(jobId)
    const result = await retryTranslation(jobId)
    if (result.success) {
      setFailedJobs((prev) => prev.filter((j) => j.id !== jobId))
      toast(t('translation_retried'), 'success')
    } else {
      toast(result.error ?? t('error'), 'error')
    }
    setLoading(null)
  }

  async function handleManualSave() {
    if (!editingManual) return
    setLoading(editingManual.id)
    const result = await manualTranslation(editingManual.table, editingManual.id, editingManual.field, manualText)
    if (result.success) {
      toast(t('translation_saved'), 'success')
      setEditingManual(null)
      setManualText('')
    } else {
      toast(result.error ?? t('error'), 'error')
    }
    setLoading(null)
  }

  async function handleSaveOverride() {
    if (!newOverride.term_en) return
    setLoading('new')
    const result = await saveTranslationOverride(newOverride)
    if (result.success) {
      toast(t('override_saved'), 'success')
      setNewOverride({ term_en: '', term_zh: '', term_uz: '', term_ru: '' })
      setShowAddForm(false)
      // Optimistic: we don't have the new ID, page will refresh
    } else {
      toast(result.error ?? t('error'), 'error')
    }
    setLoading(null)
  }

  async function handleDeleteOverride(id: string) {
    setLoading(id)
    const result = await deleteTranslationOverride(id)
    if (result.success) {
      setOverrides((prev) => prev.filter((o) => o.id !== id))
      toast(t('override_deleted'), 'success')
    } else {
      toast(result.error ?? t('error'), 'error')
    }
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('translations')}</h1>

      {/* Failed Translations */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">{t('failed_translations')}</h2>

        {failedJobs.length === 0 && failedWorkers.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">{t('no_data')}</p>
        ) : (
          <div className="space-y-3">
            {failedJobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div className="min-w-0 flex-1">
                  <span className="mr-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">{t('th_job')}</span>
                  <span className="text-sm font-medium text-gray-700">{j.title_original}</span>
                </div>
                <div className="ml-3 flex gap-2">
                  <button
                    onClick={() => handleRetry(j.id)}
                    disabled={loading === j.id}
                    className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                  >
                    {t('retry_translation')}
                  </button>
                  <button
                    onClick={() => {
                      setEditingManual({ table: 'jobs', id: j.id, field: 'title_uz' })
                      setManualText('')
                    }}
                    className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                  >
                    {t('fix_manually')}
                  </button>
                </div>
              </div>
            ))}
            {failedWorkers.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div className="min-w-0 flex-1">
                  <span className="mr-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">{t('th_worker')}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {Array.isArray(w.profiles) ? w.profiles[0]?.full_name : w.profiles?.full_name}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">{w.bio_original?.slice(0, 50)}...</span>
                </div>
                <button
                  onClick={() => {
                    setEditingManual({ table: 'worker_profiles', id: w.id, field: 'bio_uz' })
                    setManualText('')
                  }}
                  className="ml-3 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  {t('fix_manually')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Edit Modal */}
      {editingManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">{t('fix_manually')}</h3>
            <p className="mb-2 text-sm text-gray-500">
              {editingManual.table} / {editingManual.field}
            </p>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingManual(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleManualSave}
                disabled={!manualText || loading !== null}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t('save_override')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Translation Overrides */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">{t('translation_overrides')}</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            {t('add_term')}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-4 grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-4">
            <input
              placeholder={t('term_en')}
              value={newOverride.term_en}
              onChange={(e) => setNewOverride((p) => ({ ...p, term_en: e.target.value }))}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="UZ"
              value={newOverride.term_uz}
              onChange={(e) => setNewOverride((p) => ({ ...p, term_uz: e.target.value }))}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="ZH"
              value={newOverride.term_zh}
              onChange={(e) => setNewOverride((p) => ({ ...p, term_zh: e.target.value }))}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <input
                placeholder="RU"
                value={newOverride.term_ru}
                onChange={(e) => setNewOverride((p) => ({ ...p, term_ru: e.target.value }))}
                className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <button
                onClick={handleSaveOverride}
                disabled={!newOverride.term_en || loading === 'new'}
                className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {t('save_override')}
              </button>
            </div>
          </div>
        )}

        {overrides.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">EN</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">UZ</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">ZH</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">RU</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overrides.map((o) => (
                  <tr key={o.id}>
                    <td className="px-3 py-2 text-gray-700">{o.term_en}</td>
                    <td className="px-3 py-2 text-gray-500">{o.term_uz || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{o.term_zh || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{o.term_ru || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleDeleteOverride(o.id)}
                        disabled={loading === o.id}
                        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-gray-400">{t('no_data')}</p>
        )}
      </div>
    </div>
  )
}
