'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname } from '@/i18n/routing'
import { useUser } from '@/hooks/useUser'
import { MessageSquare, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export function Header() {
  const t = useTranslations('nav')
  const tm = useTranslations('messages')
  const locale = useLocale()
  const pathname = usePathname()
  const { user, loading, isEmployer, isWorker, signOut } = useUser()

  const [unreadMessages, setUnreadMessages] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fetchUnreadMessages = useCallback(async () => {
    if (!user) return
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .limit(100)
      setUnreadMessages(data?.length ?? 0)
    } catch {
      // Ignore 503 / network errors
    }
  }, [user])

  useEffect(() => {
    fetchUnreadMessages()
  }, [fetchUnreadMessages])

  // Real-time unread message count
  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    const channel = supabase
      .channel('header-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadMessages()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchUnreadMessages])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const messagesHref = isEmployer
    ? `/${locale}/employer/messages`
    : `/${locale}/worker/messages`

  const profileHref = isEmployer
    ? `/${locale}/employer/company`
    : `/${locale}/worker/profile`

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <a href={`/${locale}`} className="flex items-center">
          <img src="/logo.svg" alt="百邦" className="h-8" />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a href={`/${locale}/jobs`} className="text-gray-600 hover:text-gray-900">
            {t('jobs')}
          </a>
          <a href={`/${locale}/workers`} className="text-gray-600 hover:text-gray-900">
            {t('workers')}
          </a>
          <a href={`/${locale}/companies`} className="text-gray-600 hover:text-gray-900">
            {t('companies')}
          </a>
        </nav>

        {/* Right side — desktop */}
        <div className="hidden items-center gap-3 text-sm md:flex">
          {/* Locale switcher */}
          <div className="flex gap-1 rounded-md border border-gray-200 p-0.5">
            {(['uz', 'zh', 'ru'] as const).map((l) => (
              <a
                key={l}
                href={`/${l}${pathname}`}
                className={`rounded px-2 py-1 text-xs font-medium transition ${
                  locale === l
                    ? 'bg-red-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {l.toUpperCase()}
              </a>
            ))}
          </div>

          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
          ) : user ? (
            <>
              <a
                href={messagesHref}
                className="relative rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title={tm('title')}
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </a>
              <NotificationBell />
              <span className="text-gray-700">{user.full_name}</span>
              {isEmployer && (
                <>
                  <a href={`/${locale}/employer/company`} className="text-gray-500 hover:text-gray-700">
                    {t('company_profile')}
                  </a>
                  <a
                    href={`/${locale}/employer/post-job`}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    {t('post_a_job')}
                  </a>
                </>
              )}
              {isWorker && (
                <a href={`/${locale}/worker/profile`} className="text-gray-500 hover:text-gray-700">
                  {t('my_profile')}
                </a>
              )}
              <button onClick={signOut} className="text-gray-500 hover:text-gray-700">
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <a href={`/${locale}/auth/login`} className="text-gray-600 hover:text-gray-900">
                {t('login')}
              </a>
              <a
                href={`/${locale}/auth/register`}
                className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700"
              >
                {t('register')}
              </a>
            </>
          )}
        </div>

        {/* Mobile — icons + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Locale switcher (compact) */}
          <div className="flex gap-0.5 rounded-md border border-gray-200 p-0.5">
            {(['uz', 'zh', 'ru'] as const).map((l) => (
              <a
                key={l}
                href={`/${l}${pathname}`}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition ${
                  locale === l
                    ? 'bg-red-600 text-white'
                    : 'text-gray-500'
                }`}
              >
                {l.toUpperCase()}
              </a>
            ))}
          </div>

          {user && (
            <>
              <a
                href={messagesHref}
                className="relative rounded-full p-1.5 text-gray-500"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </a>
              <NotificationBell />
            </>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <a href={`/${locale}/jobs`} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t('jobs')}
            </a>
            <a href={`/${locale}/workers`} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t('workers')}
            </a>
            <a href={`/${locale}/companies`} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t('companies')}
            </a>

            <hr className="border-gray-200" />

            {user ? (
              <>
                <div className="px-3 py-1 text-sm font-semibold text-gray-900">
                  {user.full_name}
                </div>
                <a href={profileHref} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  {isEmployer ? t('company_profile') : t('my_profile')}
                </a>
                {isEmployer && (
                  <a href={`/${locale}/employer/post-job`} className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    {t('post_a_job')}
                  </a>
                )}
                <a href={messagesHref} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  {tm('title')} {unreadMessages > 0 && `(${unreadMessages})`}
                </a>
                <button
                  onClick={signOut}
                  className="rounded-lg px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <a href={`/${locale}/auth/login`} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {t('login')}
                </a>
                <a href={`/${locale}/auth/register`} className="rounded-lg bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-red-700">
                  {t('register')}
                </a>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
