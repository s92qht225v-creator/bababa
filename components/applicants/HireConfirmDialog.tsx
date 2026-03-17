'use client'

import { useTranslations } from 'next-intl'

interface Props {
  workerName: string
  jobTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export function HireConfirmDialog({ workerName, jobTitle, onConfirm, onCancel }: Props) {
  const t = useTranslations('applicants')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('confirm_hire')}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          {t('confirm_hire_body', { name: workerName, job: jobTitle })}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
