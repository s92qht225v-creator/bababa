'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { verifyCompany, rejectCompany } from '@/lib/actions/admin'
import { useToast } from '@/components/ui/Toast'

interface Company {
  id: string
  name_original: string
  logo_url: string | null
  industry: string | null
  is_verified: boolean
  verification_status: string | null
  created_at: string
  profiles: { full_name: string; phone: string } | null
  jobs: { id: string }[]
}

const tabs = ['all', 'pending', 'verified', 'rejected'] as const

export function AdminCompaniesPage({ companies: initial, locale }: { companies: Company[]; locale: string }) {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [companies, setCompanies] = useState(initial)
  const [tab, setTab] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [rejectModal, setRejectModal] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = companies.filter((c) => {
    if (tab !== 'all' && c.verification_status !== tab) return false
    if (search && !c.name_original.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleVerify(id: string) {
    setLoading(id)
    const result = await verifyCompany(id)
    if (result.success) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_verified: true, verification_status: 'verified' } : c))
      )
      toast(t('company_verified'), 'success')
    } else {
      toast(result.error ?? t('error'), 'error')
    }
    setLoading(null)
  }

  async function handleReject() {
    if (!rejectModal) return
    setLoading(rejectModal)
    const result = await rejectCompany(rejectModal, rejectReason || 'No reason provided')
    if (result.success) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === rejectModal ? { ...c, is_verified: false, verification_status: 'rejected' } : c))
      )
      toast(t('company_rejected'), 'success')
    } else {
      toast(result.error ?? t('error'), 'error')
    }
    setRejectModal(null)
    setRejectReason('')
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('companies')}</h1>

      {/* Tabs */}
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

      {/* Search */}
      <input
        type="text"
        placeholder={t('search_placeholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none sm:max-w-xs"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_company')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_industry')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_status')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_jobs')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_created')}</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">{t('th_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
                        {c.name_original[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{c.name_original}</div>
                      <div className="text-xs text-gray-400">{c.profiles?.full_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{c.industry || '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.verification_status ?? 'pending'} />
                </td>
                <td className="px-4 py-3 text-gray-500">{c.jobs?.length ?? 0}</td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {c.verification_status !== 'verified' && (
                      <button
                        onClick={() => handleVerify(c.id)}
                        disabled={loading === c.id}
                        className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
                      >
                        {t('verify')}
                      </button>
                    )}
                    {c.verification_status !== 'rejected' && (
                      <button
                        onClick={() => setRejectModal(c.id)}
                        disabled={loading === c.id}
                        className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                      >
                        {t('reject')}
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

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">{t('reject_reason')}</h3>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">{t('reject_reason')}</option>
              <option value="incomplete_info">{t('incomplete_info')}</option>
              <option value="suspicious_activity">{t('suspicious_activity')}</option>
              <option value="duplicate_account">{t('duplicate_account')}</option>
              <option value="other">{t('other_reason')}</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={loading !== null}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t('reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    verified: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    unverified: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.pending}`}>
      {status}
    </span>
  )
}
