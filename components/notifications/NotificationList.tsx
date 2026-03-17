'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import type { Locale, Notification } from '@/types'

export function NotificationList() {
  const t = useTranslations('notifications')
  const locale = useLocale() as Locale
  const { user, loading: authLoading } = useUser()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const supabase = createClient()

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifications((data ?? []) as Notification[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Real-time subscription
  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const channel = supabase
      .channel('notifications-list-page')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchNotifications])

  const handleMarkAllRead = async () => {
    if (!user) return
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const handleClick = async (notification: Notification) => {
    if (!user) return
    const supabase = createClient()

    if (!notification.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      )
    }

    const payload = notification.payload as Record<string, string>
    const role = user.role === 'employer' ? 'employer' : 'worker'

    if (notification.type === 'new_message') {
      const messagesRole = role
      window.location.href = `/${locale}/${messagesRole}/messages?partner=${payload.sender_id}&job=${payload.job_id ?? ''}`
    } else if (notification.type === 'application_status_changed') {
      window.location.href = `/${locale}/worker/applications`
    } else if (notification.type === 'new_application') {
      window.location.href = `/${locale}/employer/applicants?job=${payload.job_id ?? ''}`
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffHours < 1) return `${Math.floor(diffMs / 60000)}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getActionLabel = (type: string) => {
    if (type === 'new_message') return t('open_message')
    return t('view_application')
  }

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </main>
    )
  }

  const hasUnread = notifications.some((n) => !n.is_read)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-red-600 hover:text-red-800"
          >
            {t('mark_all_read')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-12 text-center text-gray-500">
          {t('no_notifications')}
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition hover:bg-gray-50 ${
                n.is_read
                  ? 'border-gray-100 bg-white'
                  : 'border-red-100 bg-red-50/30'
              }`}
            >
              {!n.is_read && (
                <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" />
              )}
              <div className={`min-w-0 flex-1 ${n.is_read ? 'ml-[22px]' : ''}`}>
                <p className="text-sm text-gray-900">{n.body}</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {formatDate(n.created_at)}
                  </span>
                  <span className="text-xs font-medium text-red-600">
                    {getActionLabel(n.type)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}
