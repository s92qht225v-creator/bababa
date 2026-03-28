'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { reviewReport, getAdminConversationMessages } from '@/lib/actions/admin'
import { useToast } from '@/components/ui/Toast'
import { MessageSquare, Flag, Search } from 'lucide-react'

interface Report {
  id: string
  reason: string
  status: string
  created_at: string
  reviewed_at: string | null
  messages: {
    body_original: string
    sender_id: string
    profiles: { full_name: string } | null
  } | null
  reporter: { full_name: string } | null
}

interface Conversation {
  participant1: { id: string; name: string; role: string }
  participant2: { id: string; name: string; role: string }
  jobId: string | null
  lastMessage: string
  lastMessageAt: string
  messageCount: number
}

interface ConversationMessage {
  id: string
  sender_id: string
  body_original: string
  body_uz: string | null
  body_zh: string | null
  body_ru: string | null
  source_language: string
  created_at: string
  sender: { full_name: string; role: string } | null
}

const mainTabs = ['conversations', 'reports'] as const
const reportTabs = ['pending', 'reviewed', 'dismissed'] as const

export function AdminMessagesPage({
  reports: initial,
  conversations,
}: {
  reports: Report[]
  conversations: Conversation[]
}) {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [mainTab, setMainTab] = useState<string>('conversations')
  const [reports, setReports] = useState(initial)
  const [reportTab, setReportTab] = useState<string>('pending')
  const [loading, setLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Conversation thread state
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [threadMessages, setThreadMessages] = useState<ConversationMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)

  const filteredReports = reports.filter((r) => r.status === reportTab)

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.participant1.name.toLowerCase().includes(q) ||
      c.participant2.name.toLowerCase().includes(q)
    )
  })

  async function handleReview(id: string, action: 'reviewed' | 'dismissed') {
    setLoading(id)
    const result = await reviewReport(id, action)
    if (result.success) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)))
      toast(action === 'reviewed' ? t('report_reviewed') : t('report_dismissed'), 'success')
    } else {
      toast(result.error ?? t('error'), 'error')
    }
    setLoading(null)
  }

  async function openThread(conv: Conversation) {
    const key = `${conv.participant1.id}|${conv.participant2.id}`
    if (activeConv === key) {
      setActiveConv(null)
      setThreadMessages([])
      return
    }
    setActiveConv(key)
    setThreadLoading(true)
    const msgs = await getAdminConversationMessages(
      conv.participant1.id,
      conv.participant2.id,
      conv.jobId
    )
    setThreadMessages((msgs ?? []) as unknown as ConversationMessage[])
    setThreadLoading(false)
  }

  function roleBadge(role: string) {
    if (role === 'worker') return <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">Worker</span>
    if (role === 'employer') return <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">Employer</span>
    return <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">{role}</span>
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('messages')}</h1>

      {/* Main tabs: Conversations / Reports */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          onClick={() => setMainTab('conversations')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            mainTab === 'conversations' ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {t('all_conversations')}
          <span className="ml-1 rounded-full bg-gray-200 px-1.5 text-[10px] text-gray-600">
            {conversations.length}
          </span>
        </button>
        <button
          onClick={() => setMainTab('reports')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            mainTab === 'reports' ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Flag className="h-3.5 w-3.5" />
          {t('reports')}
          {reports.filter((r) => r.status === 'pending').length > 0 && (
            <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[10px] text-white">
              {reports.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Conversations Tab */}
      {mainTab === 'conversations' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-red-300 focus:outline-none focus:ring-1 focus:ring-red-300"
            />
          </div>

          {filteredConversations.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">{t('no_conversations')}</p>
          ) : (
            filteredConversations.map((conv) => {
              const key = `${conv.participant1.id}|${conv.participant2.id}`
              const isOpen = activeConv === key
              return (
                <div key={key} className="rounded-lg border border-gray-200 bg-white">
                  <button
                    onClick={() => openThread(conv)}
                    className="w-full p-4 text-left transition hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{conv.participant1.name}</span>
                        {roleBadge(conv.participant1.role)}
                        <span className="text-gray-400">&harr;</span>
                        <span className="font-medium text-gray-800">{conv.participant2.name}</span>
                        {roleBadge(conv.participant2.role)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                          {conv.messageCount} {t('messages_count')}
                        </span>
                        <span>{timeAgo(conv.lastMessageAt)}</span>
                      </div>
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {conv.lastMessage}
                    </p>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      {threadLoading ? (
                        <p className="py-4 text-center text-sm text-gray-400">...</p>
                      ) : (
                        <div className="max-h-96 space-y-2 overflow-y-auto">
                          {threadMessages.map((msg) => {
                            const sender = msg.sender as Record<string, string> | null
                            const isP1 = msg.sender_id === conv.participant1.id
                            return (
                              <div
                                key={msg.id}
                                className={`rounded-lg p-3 ${isP1 ? 'bg-white' : 'bg-blue-50'}`}
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-gray-700">
                                    {sender?.full_name ?? 'Unknown'}
                                  </span>
                                  <span className="text-gray-400">
                                    {new Date(msg.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-800">{msg.body_original}</p>
                                <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-gray-400">
                                  {msg.body_uz && (
                                    <span>
                                      <span className="font-medium text-gray-500">UZ:</span> {msg.body_uz}
                                    </span>
                                  )}
                                  {msg.body_zh && (
                                    <span>
                                      <span className="font-medium text-gray-500">ZH:</span> {msg.body_zh}
                                    </span>
                                  )}
                                  {msg.body_ru && (
                                    <span>
                                      <span className="font-medium text-gray-500">RU:</span> {msg.body_ru}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                          {threadMessages.length === 0 && (
                            <p className="py-4 text-center text-sm text-gray-400">{t('no_data')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Reports Tab */}
      {mainTab === 'reports' && (
        <div className="space-y-3">
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            {reportTabs.map((key) => (
              <button
                key={key}
                onClick={() => setReportTab(key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  reportTab === key ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {key === 'reviewed' ? t('verified') : key === 'dismissed' ? t('rejected') : t('pending')}
                {key === 'pending' && (
                  <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                    {reports.filter((r) => r.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filteredReports.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">
                      {r.reporter?.full_name ?? 'Unknown'}
                    </span>
                    <span className="text-gray-400">{t('reported_by')}</span>
                    <span className="font-medium text-gray-700">
                      {r.messages?.profiles?.full_name ?? 'Unknown'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {t('reason')}: {r.reason} &middot; {new Date(r.created_at).toLocaleString()}
                  </div>

                  {expanded === r.id && r.messages && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      {r.messages.body_original}
                    </div>
                  )}
                </div>

                <div className="ml-3 flex items-center gap-2">
                  <button
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                  >
                    {expanded === r.id ? t('hide') : t('show')}
                  </button>
                  {r.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReview(r.id, 'reviewed')}
                        disabled={loading === r.id}
                        className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
                      >
                        {t('review')}
                      </button>
                      <button
                        onClick={() => handleReview(r.id, 'dismissed')}
                        disabled={loading === r.id}
                        className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                      >
                        {t('dismiss')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredReports.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">{t('no_data')}</p>
          )}
        </div>
      )}
    </div>
  )
}
