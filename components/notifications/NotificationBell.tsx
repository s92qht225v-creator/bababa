'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Bell } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import type { Locale, Notification } from '@/types'

export function NotificationBell() {
  const t = useTranslations('notifications')
  const locale = useLocale() as Locale
  const { user } = useUser()

  const [unreadCount, setUnreadCount] = useState(0)
  const [recent, setRecent] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const supabase = createClient()

      // Fetch recent 5 + unread IDs in parallel (avoid HEAD requests that cause 503)
      const [{ data }, { data: unreadData }] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .limit(100),
      ])

      setRecent((data ?? []) as Notification[])
      setUnreadCount(unreadData?.length ?? 0)
    } catch {
      // Ignore fetch errors (503 etc.)
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Real-time subscription
  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const channel = supabase
      .channel('notifications-bell')
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    if (!user) return
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setUnreadCount(0)
    setRecent((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!user) return
    const supabase = createClient()

    // Mark as read
    if (!notification.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id)
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    setIsOpen(false)

    // Navigate based on type
    const payload = notification.payload as Record<string, string>
    if (notification.type === 'new_message') {
      window.location.href = `/${locale}/worker/messages?partner=${payload.sender_id}&job=${payload.job_id ?? ''}`
    } else if (notification.type === 'application_status_changed' || notification.type === 'new_application') {
      const role = user.role === 'employer' ? 'employer' : 'worker'
      if (role === 'employer') {
        window.location.href = `/${locale}/employer/applicants?job=${payload.job_id ?? ''}`
      } else {
        window.location.href = `/${locale}/worker/applications`
      }
    }
  }

  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    return `${diffDays}d`
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <span className="text-sm font-semibold">{t('title')}</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-red-600 hover:text-red-800"
              >
                {t('mark_all_read')}
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              {t('no_notifications')}
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                    !n.is_read ? 'bg-red-50/50' : ''
                  }`}
                >
                  {!n.is_read && (
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                  )}
                  <div className={`min-w-0 flex-1 ${n.is_read ? 'ml-5' : ''}`}>
                    <p className="text-sm text-gray-900">
                      {n.body}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100">
            <a
              href={`/${locale}/${user.role === 'employer' ? 'employer' : 'worker'}/notifications`}
              className="block px-4 py-2.5 text-center text-xs font-medium text-red-600 hover:text-red-800"
              onClick={() => setIsOpen(false)}
            >
              {t('view_all')}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
