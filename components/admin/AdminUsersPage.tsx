'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { suspendUser, reactivateUser, makeAdmin } from '@/lib/actions/admin'
import { useToast } from '@/components/ui/Toast'
import type { Profile } from '@/types'

const tabs = ['all', 'worker', 'employer', 'admin', 'suspended'] as const

export function AdminUsersPage({ users: initial }: { users: Profile[] }) {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [users, setUsers] = useState(initial)
  const [tab, setTab] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ type: 'suspend' | 'admin'; userId: string } | null>(null)
  const [confirmText, setConfirmText] = useState('')

  const filtered = users.filter((u) => {
    if (tab === 'suspended') return u.is_active === false
    if (tab !== 'all' && u.role !== tab) return false
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleSuspend(userId: string) {
    setLoading(userId)
    const result = await suspendUser(userId)
    if (result.success) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: false } : u)))
      toast(t('user_suspended'), 'success')
    } else {
      toast(result.error ?? t('error'), 'error')
    }
    setLoading(null)
    setConfirmModal(null)
  }

  async function handleReactivate(userId: string) {
    setLoading(userId)
    const result = await reactivateUser(userId)
    if (result.success) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: true } : u)))
      toast(t('user_reactivated'), 'success')
    } else {
      toast(result.error ?? t('error'), 'error')
    }
    setLoading(null)
  }

  async function handleMakeAdmin() {
    if (!confirmModal || confirmText !== 'CONFIRM') return
    setLoading(confirmModal.userId)
    const result = await makeAdmin(confirmModal.userId)
    if (result.success) {
      setUsers((prev) => prev.map((u) => (u.id === confirmModal.userId ? { ...u, role: 'admin' } : u)))
      toast(t('admin_promoted'), 'success')
    } else {
      toast(result.error ?? t('error'), 'error')
    }
    setLoading(null)
    setConfirmModal(null)
    setConfirmText('')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('users')}</h1>

      <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {tabs.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === key ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ all: t('all'), worker: t('workers'), employer: t('companies'), admin: t('role_admin'), suspended: t('suspended') }[key]}
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
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_name')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_role')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_phone')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_status')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('th_joined')}</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">{t('th_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role} label={t(`role_${u.role}`)} />
                </td>
                <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                <td className="px-4 py-3">
                  {u.is_active === false ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      {t('suspended')}
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {t('active')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {u.is_active === false ? (
                      <button
                        onClick={() => handleReactivate(u.id)}
                        disabled={loading === u.id}
                        className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
                      >
                        {t('reactivate')}
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmModal({ type: 'suspend', userId: u.id })}
                        disabled={loading === u.id || u.role === 'admin'}
                        className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                      >
                        {t('suspend')}
                      </button>
                    )}
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => setConfirmModal({ type: 'admin', userId: u.id })}
                        disabled={loading === u.id}
                        className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 disabled:opacity-50"
                      >
                        {t('make_admin')}
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

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {confirmModal.type === 'suspend' ? t('confirm_suspend') : t('confirm_make_admin')}
            </h3>
            {confirmModal.type === 'admin' && (
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CONFIRM"
                className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setConfirmModal(null); setConfirmText('') }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  if (confirmModal.type === 'suspend') handleSuspend(confirmModal.userId)
                  else handleMakeAdmin()
                }}
                disabled={confirmModal.type === 'admin' && confirmText !== 'CONFIRM'}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t('confirm_action')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RoleBadge({ role, label }: { role: string; label: string }) {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    employer: 'bg-blue-100 text-blue-700',
    worker: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}
