'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { reviewReport } from '@/lib/actions/admin'
import { useToast } from '@/components/ui/Toast'

interface Report {
  id: string
  reason: string
  status: string
  created_at: string
  reviewed_at: string | null
  messages: {
    content: string
    sender_id: string
    profiles: { full_name: string } | null
  } | null
  reporter: { full_name: string } | null
}

const tabs = ['pending', 'reviewed', 'dismissed'] as const

export function AdminMessagesPage({ reports: initial }: { reports: Report[] }) {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [reports, setReports] = useState(initial)
  const [tab, setTab] = useState<string>('pending')
  const [loading, setLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = reports.filter((r) => r.status === tab)

  async function handleReview(id: string, action: 'reviewed' | 'dismissed') {
    setLoading(id)
    const result = await reviewReport(id, action)
    if (result.success) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)))
      toast(action === 'reviewed' ? t('report_reviewed') : t('report_dismissed'), 'success')
    } else {
      toast(result.error ?? 'Error', 'error')
    }
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('messages')}</h1>

      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {tabs.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === key ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {key === 'reviewed' ? t('verified') : key === 'dismissed' ? t('rejected') : t('pending')}
            {key === 'pending' && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                {reports.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">
                    {r.reporter?.full_name ?? 'Unknown'}
                  </span>
                  <span className="text-gray-400">reported</span>
                  <span className="font-medium text-gray-700">
                    {r.messages?.profiles?.full_name ?? 'Unknown'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Reason: {r.reason} &middot; {new Date(r.created_at).toLocaleString()}
                </div>

                {expanded === r.id && r.messages && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    {r.messages.content}
                  </div>
                )}
              </div>

              <div className="ml-3 flex items-center gap-2">
                <button
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                >
                  {expanded === r.id ? 'Hide' : 'View'}
                </button>
                {r.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleReview(r.id, 'reviewed')}
                      disabled={loading === r.id}
                      className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleReview(r.id, 'dismissed')}
                      disabled={loading === r.id}
                      className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">{t('no_data')}</p>
        )}
      </div>
    </div>
  )
}
