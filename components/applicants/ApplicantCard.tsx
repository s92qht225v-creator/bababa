'use client'

import { useTranslations, useLocale } from 'next-intl'
import { MessageSquare, Star, X, CheckCircle } from 'lucide-react'
import type { Locale, ApplicationStatus } from '@/types'
import type { ApplicantWithDetails } from '@/lib/actions/applicants'

interface Props {
  applicant: ApplicantWithDetails
  onStatusChange: (id: string, status: ApplicationStatus) => void
  onMessage: (workerUserId: string, jobId: string) => void
  onHire: (applicant: ApplicantWithDetails) => void
  locale: string
}

export function ApplicantCard({
  applicant,
  onStatusChange,
  onMessage,
  onHire,
  locale,
}: Props) {
  const t = useTranslations('applicants')
  const currentLocale = useLocale() as Locale

  const getJobTitle = () => {
    const field = `title_${currentLocale}` as keyof typeof applicant.job
    return (applicant.job[field] as string) ?? applicant.job.title_original
  }

  const daysAgo = () => {
    const diff = Math.floor(
      (Date.now() - new Date(applicant.applied_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    return diff === 0 ? t('today') : t('days_ago', { days: diff })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      {/* Photo + Name */}
      <div className="flex items-start gap-2">
        {applicant.worker.photo_url || applicant.workerProfile.avatar_url ? (
          <img
            src={applicant.worker.photo_url || applicant.workerProfile.avatar_url || ''}
            alt=""
            className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-600">
            {(applicant.workerProfile.full_name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {applicant.workerProfile.full_name}
          </p>
          <p className="truncate text-xs text-gray-500">
            {applicant.worker.profession}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="mt-2 space-y-1 text-xs text-gray-500">
        <p>HSK {applicant.worker.hsk_level}</p>
        <p>{applicant.worker.experience_years}y exp</p>
        <p className="truncate">{getJobTitle()}</p>
        <p>{daysAgo()}</p>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => onMessage(applicant.worker.user_id, applicant.job_id)}
          className="flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
        >
          <MessageSquare className="h-3 w-3" />
          {t('message_applicant')}
        </button>

        {applicant.status === 'applied' || applicant.status === 'viewed' ? (
          <>
            <button
              onClick={() => onStatusChange(applicant.id, 'shortlisted')}
              className="flex items-center gap-1 rounded border border-yellow-200 px-2 py-1 text-[11px] font-medium text-yellow-700 hover:bg-yellow-50"
            >
              <Star className="h-3 w-3" />
              {t('shortlist')}
            </button>
            <button
              onClick={() => onStatusChange(applicant.id, 'rejected')}
              className="flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
            >
              <X className="h-3 w-3" />
              {t('reject')}
            </button>
          </>
        ) : null}

        {applicant.status === 'shortlisted' && (
          <>
            <button
              onClick={() => onHire(applicant)}
              className="flex items-center gap-1 rounded border border-green-200 px-2 py-1 text-[11px] font-medium text-green-700 hover:bg-green-50"
            >
              <CheckCircle className="h-3 w-3" />
              {t('hire')}
            </button>
            <button
              onClick={() => onStatusChange(applicant.id, 'rejected')}
              className="flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
            >
              <X className="h-3 w-3" />
              {t('reject')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
