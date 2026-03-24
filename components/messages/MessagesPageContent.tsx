'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { getConversations } from '@/lib/actions/messages'
import { ConversationList, type Conversation } from './ConversationList'
import { ChatPanel } from './ChatPanel'
import type { Locale } from '@/types'

export function MessagesPageContent() {
  const t = useTranslations('messages')
  const locale = useLocale() as Locale
  const { user, loading: authLoading } = useUser()
  const searchParams = useSearchParams()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)

  // Get active partner details
  const activeConv = conversations.find(
    (c) =>
      c.partnerId === activePartnerId &&
      (c.jobId ?? null) === (activeJobId ?? null)
  )

  const fetchConversations = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const data = await getConversations()
    setConversations(data as Conversation[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Handle URL params (e.g., ?partner=xxx&job=yyy from "Message" button)
  useEffect(() => {
    const partner = searchParams.get('partner')
    const job = searchParams.get('job')
    if (partner) {
      setActivePartnerId(partner)
      setActiveJobId(job ?? null)
      setShowChat(true)
    }
  }, [searchParams])

  // Subscribe to new messages for conversation list updates
  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const channel = supabase
      .channel('messages-list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          // Refresh conversation list
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchConversations])

  const handleSelectConversation = (partnerId: string, jobId: string | null) => {
    setActivePartnerId(partnerId)
    setActiveJobId(jobId)
    setShowChat(true)
    // Update unread count in conversation list
    setConversations((prev) =>
      prev.map((c) =>
        c.partnerId === partnerId && (c.jobId ?? null) === (jobId ?? null)
          ? { ...c, unreadCount: 0 }
          : c
      )
    )
  }

  const handleBack = () => {
    setShowChat(false)
    setActivePartnerId(null)
    setActiveJobId(null)
    fetchConversations()
  }

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 h-[600px] animate-pulse rounded-lg bg-gray-100" />
      </main>
    )
  }

  const getJobTitle = (conv: Conversation) => {
    const field = `jobTitle${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof Conversation
    return (conv[field] as string) ?? conv.jobTitle
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-8">
      <h1 className={`mb-6 text-2xl font-bold ${showChat ? 'hidden md:block' : ''}`}>{t('title')}</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white" style={{ height: 'calc(100dvh - 140px)' }}>
        <div className="flex h-full">
          {/* Conversation list — hidden on mobile when chat is active */}
          <div
            className={`h-full w-full overflow-y-auto border-r border-gray-200 md:w-80 md:flex-shrink-0 ${
              showChat ? 'hidden md:block' : 'block'
            }`}
          >
            <ConversationList
              conversations={conversations}
              activePartnerId={activePartnerId}
              activeJobId={activeJobId}
              currentUserId={user?.id ?? ''}
              onSelect={handleSelectConversation}
            />
          </div>

          {/* Chat panel — hidden on mobile when no chat selected */}
          <div
            className={`h-full flex-1 ${
              showChat ? 'block' : 'hidden md:block'
            }`}
          >
            {activePartnerId && activeConv ? (
              <ChatPanel
                partnerId={activePartnerId}
                partnerName={activeConv.partnerName}
                partnerAvatar={activeConv.partnerAvatar}
                jobId={activeJobId}
                jobTitle={getJobTitle(activeConv)}
                currentUserId={user?.id ?? ''}
                currentUserLang={locale}
                onBack={handleBack}
              />
            ) : activePartnerId ? (
              /* Partner from URL params but not in conversations yet */
              <ChatPanel
                partnerId={activePartnerId}
                partnerName=""
                partnerAvatar={null}
                jobId={activeJobId}
                jobTitle={null}
                currentUserId={user?.id ?? ''}
                currentUserLang={locale}
                onBack={handleBack}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                {t('no_conversations')}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
