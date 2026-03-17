'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname } from '@/i18n/routing'
import {
  LayoutDashboard,
  Users,
  Building2,
  HardHat,
  Briefcase,
  MessageSquare,
  Languages,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { key: 'users', icon: Users, href: '/admin/users' },
  { key: 'companies', icon: Building2, href: '/admin/companies' },
  { key: 'workers', icon: HardHat, href: '/admin/workers' },
  { key: 'jobs', icon: Briefcase, href: '/admin/jobs' },
  { key: 'messages', icon: MessageSquare, href: '/admin/messages' },
  { key: 'translations', icon: Languages, href: '/admin/translations' },
]

export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode
  adminName: string
}) {
  const t = useTranslations('admin')
  const locale = useLocale()
  const pathname = usePathname()
  const { signOut } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="-mt-[calc(theme(spacing.16)+1px)] flex min-h-screen pt-[calc(theme(spacing.16)+1px)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:z-auto lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <a href={`/${locale}`} className="text-xl font-bold text-red-600">
            bababa
          </a>
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Admin
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3">
          {navItems.map(({ key, icon: Icon, href }) => {
            const isActive = pathname.startsWith(href)
            return (
              <a
                key={key}
                href={`/${locale}${href}`}
                onClick={() => setSidebarOpen(false)}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {t(key)}
              </a>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-200 p-4">
          <div className="mb-2 truncate text-sm font-medium text-gray-700">
            {adminName}
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header bar */}
        <div className="flex h-12 items-center border-b border-gray-200 px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 text-sm font-semibold text-gray-700">
            {t('title')}
          </span>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
