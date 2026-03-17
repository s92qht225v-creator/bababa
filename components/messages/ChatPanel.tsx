'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, getMessages, markAsRead } from '@/lib/actions/messages'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import type { Locale, Message } from '@/types'

interface Props {
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  jobId: string | null
  jobTitle: string | null
  currentUserId: string
  currentUserLang: Locale
  onBack?: () => void
}

export function ChatPanel({
  partnerId,
  partnerName,
  partnerAvatar,
  jobId,
  jobTitle,
  currentUserId,
  currentUserLang,
  onBack,
}: Props) {
  const t = useTranslations('messages')
  const locale = useLocale() as Locale
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [translating, setTranslating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    const data = await getMessages(partnerId, jobId)
    setMessages(data as Message[])
    setLoading(false)
    // Mark as read
    await markAsRead(partnerId, jobId)
  }, [partnerId, jobId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Subscribe to real-time messages
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${partnerId}:${jobId ?? 'none'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          // Only add if from this conversation partner
          if (
            newMsg.sender_id === partnerId &&
            (newMsg.job_id ?? null) === (jobId ?? null)
          ) {
            setMessages((prev) => [...prev, newMsg])
            // Mark as read immediately
            markAsRead(partnerId, jobId)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [partnerId, jobId, currentUserId])

  const handleSend = async (text: string) => {
    // Optimistic message
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: partnerId,
      job_id: jobId,
      body_original: text,
      body_zh: text,
      body_uz: text,
      body_ru: text,
      source_language: currentUserLang,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setTranslating(true)

    const result = await sendMessage(partnerId, text, jobId, currentUserLang)

    setTranslating(false)

    if (!result.success) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    } else {
      // Refresh to get real translated message
      const data = await getMessages(partnerId, jobId)
      setMessages(data as Message[])
    }
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = []
  let currentDate = ''

  for (const msg of messages) {
    const msgDate = new Date(msg.created_at).toLocaleDateString()
    if (msgDate !== currentDate) {
      currentDate = msgDate
      groupedMessages.push({ date: msg.created_at, messages: [] })
    }
    groupedMessages[groupedMessages.length - 1].messages.push(msg)
  }

  const formatDateDivider = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return t('today')
    if (date.toDateString() === yesterday.toDateString()) return t('yesterday')
    return date.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        {onBack && (
          <button
            onClick={onBack}
            className="mr-1 rounded-full p-1 hover:bg-gray-100 md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {partnerAvatar ? (
          <img
            src={partnerAvatar}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-600">
            {partnerName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {partnerName}
          </p>
          {jobTitle && (
            <p className="truncate text-xs text-gray-500">
              {t('re_job', { title: jobTitle })}
            </p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            {t('no_conversations')}
          </div>
        ) : (
          <div className="space-y-1">
            {groupedMessages.map((group, gi) => (
              <div key={gi}>
                {/* Date divider */}
                <div className="my-4 flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400">
                    {formatDateDivider(group.date)}
                  </span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
                <div className="space-y-3">
                  {group.messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_id === currentUserId}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <MessageInput onSend={handleSend} translating={translating} />
    </div>
  )
}
