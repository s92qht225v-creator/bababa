'use client'

import { useTranslations, useLocale } from 'next-intl'
import type { Locale } from '@/types'

export interface Conversation {
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  partnerLang: string
  jobId: string | null
  jobTitle: string | null
  jobTitleZh: string | null
  jobTitleUz: string | null
  jobTitleRu: string | null
  lastMessage: {
    body_original: string
    body_zh: string | null
    body_uz: string | null
    body_ru: string | null
    source_language: string
    created_at: string
    sender_id: string
  }
  unreadCount: number
}

interface Props {
  conversations: Conversation[]
  activePartnerId: string | null
  activeJobId: string | null
  currentUserId: string
  onSelect: (partnerId: string, jobId: string | null) => void
}

export function ConversationList({
  conversations,
  activePartnerId,
  activeJobId,
  currentUserId,
  onSelect,
}: Props) {
  const t = useTranslations('messages')
  const locale = useLocale() as Locale

  const getJobTitle = (conv: Conversation) => {
    const field = `jobTitle${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof Conversation
    return (conv[field] as string) ?? conv.jobTitle
  }

  const getPreview = (conv: Conversation) => {
    const field = `body_${locale}` as keyof typeof conv.lastMessage
    const text = (conv.lastMessage[field] as string) ?? conv.lastMessage.body_original
    return text.length > 50 ? text.substring(0, 50) + '...' : text
  }

  const timeAgo = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays === 1) return t('yesterday')
    return `${diffDays}d`
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-gray-400">
        {t('no_conversations')}
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => {
        const isActive =
          conv.partnerId === activePartnerId &&
          (conv.jobId ?? null) === (activeJobId ?? null)

        return (
          <button
            key={`${conv.partnerId}:${conv.jobId ?? 'none'}`}
            onClick={() => onSelect(conv.partnerId, conv.jobId)}
            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
              isActive ? 'bg-red-50' : ''
            }`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {conv.partnerAvatar ? (
                <img
                  src={conv.partnerAvatar}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-600">
                  {conv.partnerName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-gray-900">
                  {conv.partnerName}
                </span>
                <span className="flex-shrink-0 text-[11px] text-gray-400">
                  {timeAgo(conv.lastMessage.created_at)}
                </span>
              </div>
              {conv.jobId && (
                <p className="truncate text-xs text-gray-500">
                  {t('re_job', { title: getJobTitle(conv) ?? '' })}
                </p>
              )}
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {conv.lastMessage.sender_id === currentUserId ? 'You: ' : ''}
                {getPreview(conv)}
              </p>
            </div>

            {/* Unread badge */}
            {conv.unreadCount > 0 && (
              <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
