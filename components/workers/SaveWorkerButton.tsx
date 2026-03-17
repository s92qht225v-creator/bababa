'use client'

import { useState } from 'react'
import { saveWorkerBookmark } from '@/lib/actions/worker'
import { useToast } from '@/components/ui/Toast'
import { useTranslations } from 'next-intl'

export function SaveWorkerButton({
  workerId,
  initialSaved,
}: {
  workerId: string
  initialSaved: boolean
}) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const t = useTranslations('worker')

  async function handleSave() {
    setLoading(true)
    const result = await saveWorkerBookmark(workerId)
    setLoading(false)
    if (result.success) {
      setSaved(!saved)
    } else {
      toast(result.error ?? 'Error', 'error')
    }
  }

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className={`rounded-lg px-4 py-2 text-sm font-medium ${
        saved
          ? 'bg-gray-100 text-gray-600'
          : 'border border-red-600 text-red-600 hover:bg-red-50'
      }`}
    >
      {saved ? `✓ ${t('saved')}` : t('save_worker')}
    </button>
  )
}
