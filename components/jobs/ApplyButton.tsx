'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { applyToJob } from '@/lib/actions/worker'
import { useToast } from '@/components/ui/Toast'

export function ApplyButton({
  jobId,
  jobTitle,
  locale,
  hasProfile,
  alreadyApplied,
  isLoggedIn,
  isOwner,
}: {
  jobId: string
  jobTitle: string
  locale: string
  hasProfile: boolean
  alreadyApplied: boolean
  isLoggedIn: boolean
  isOwner?: boolean
}) {
  const t = useTranslations('worker')
  const { toast } = useToast()
  const [applied, setApplied] = useState(alreadyApplied)
  const [showModal, setShowModal] = useState(false)
  const [coverNote, setCoverNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isOwner) {
    return (
      <a
        href={`/${locale}/employer/dashboard`}
        className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-500 hover:bg-gray-50"
      >
        {t('your_listing')}
      </a>
    )
  }

  if (!isLoggedIn) {
    return (
      <a
        href={`/${locale}/auth/login`}
        className="block w-full rounded-lg border border-red-600 px-4 py-3 text-center text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        {t('login_to_contact')}
      </a>
    )
  }

  if (applied) {
    return (
      <button
        disabled
        className="block w-full rounded-lg bg-gray-100 px-4 py-3 text-center text-sm font-semibold text-gray-500"
      >
        ✓ {t('already_applied')}
      </button>
    )
  }

  async function handleSubmit() {
    setSubmitting(true)
    const result = await applyToJob(jobId, coverNote)
    setSubmitting(false)
    if (result.success) {
      setApplied(true)
      setShowModal(false)
      toast(t('application_submitted'), 'success')
    } else {
      toast(result.error ?? 'Error', 'error')
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="block w-full rounded-lg bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-red-700"
      >
        {t('apply_now')}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="text-lg font-semibold">{t('apply_for', { title: jobTitle })}</h2>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                {t('cover_note')}
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder={t('cover_note_placeholder')}
                rows={4}
                maxLength={500}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                {t('char_count', { count: coverNote.length, max: 500 })}
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ✕
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? '...' : t('submit_application')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
