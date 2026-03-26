'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Flag, Globe } from 'lucide-react'
import { reportMessage } from '@/lib/actions/admin'
import { useToast } from '@/components/ui/Toast'
import type { Locale, Message } from '@/types'

const LANG_LABELS: Record<string, Record<string, string>> = {
  uz: { uz: "O'zbek", zh: 'Xitoy', ru: 'Rus' },
  zh: { uz: '乌兹别克语', zh: '中文', ru: '俄语' },
  ru: { uz: 'Узбекский', zh: 'Китайский', ru: 'Русский' },
}

interface Props {
  message: Message
  isOwn: boolean
  locale: Locale
}

export function MessageBubble({ message, isOwn, locale }: Props) {
  const t = useTranslations('messages')
  const { toast } = useToast()
  const [showOriginal, setShowOriginal] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)

  const bodyField = `body_${locale}` as keyof Message
  const translatedBody = (message[bodyField] as string) ?? message.body_original
  const sourceLang = message.source_language as Locale
  const isTranslated = sourceLang !== locale

  const displayText = showOriginal ? message.body_original : translatedBody
  const langLabel = LANG_LABELS[locale]?.[sourceLang] ?? sourceLang

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] sm:max-w-[60%]`}>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{displayText}</p>
        </div>

        <div className="mt-1 flex items-center gap-2 px-1">
          <span className="text-[11px] text-gray-400">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {isTranslated && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600"
            >
              <Globe className="h-3 w-3" />
              {showOriginal
                ? t('show_translation')
                : t('translated_from', { lang: langLabel })}
            </button>
          )}

          {!isOwn && (
            <div className="relative">
              <button
                onClick={() => setShowReport(!showReport)}
                className="text-[11px] text-gray-300 hover:text-red-500"
                title={t('report')}
              >
                <Flag className="h-3 w-3" />
              </button>
              {showReport && (
                <div className="absolute bottom-5 left-0 z-10 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <p className="px-3 py-1 text-xs font-medium text-gray-500">{t('report_select_reason')}</p>
                  {(['spam', 'inappropriate', 'harassment', 'scam', 'other'] as const).map((reason) => (
                    <button
                      key={reason}
                      disabled={reportLoading}
                      onClick={async () => {
                        setReportLoading(true)
                        const result = await reportMessage(message.id, reason)
                        if (result.success) {
                          toast(t('report_submitted'), 'success')
                        } else {
                          toast(result.error ?? 'Error', 'error')
                        }
                        setShowReport(false)
                        setReportLoading(false)
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                    >
                      {t(`report_reason_${reason}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
