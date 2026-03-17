'use client'

import { useTranslations } from 'next-intl'
import {
  Users,
  HardHat,
  Building2,
  Briefcase,
  FileText,
  ShieldAlert,
  Languages,
  MessageSquare,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  stats: {
    totalUsers: number
    totalWorkers: number
    totalCompanies: number
    activeJobs: number
    totalApplications: number
    pendingVerifications: number
    failedTranslations: number
    reportedMessages: number
  }
  chartData: {
    registrations: { day: string; count: number }[]
    applications: { day: string; count: number }[]
  }
  activity: {
    id: string
    type: string
    message_uz: string | null
    message_zh: string | null
    message_ru: string | null
    created_at: string
  }[]
  locale: string
}

const statCards = [
  { key: 'total_users', icon: Users, color: 'text-blue-600' },
  { key: 'total_workers', icon: HardHat, color: 'text-green-600' },
  { key: 'total_companies', icon: Building2, color: 'text-purple-600' },
  { key: 'active_jobs', icon: Briefcase, color: 'text-red-600' },
  { key: 'total_applications', icon: FileText, color: 'text-orange-600' },
  { key: 'pending_verifications', icon: ShieldAlert, color: 'text-yellow-600' },
  { key: 'failed_translations', icon: Languages, color: 'text-red-500' },
  { key: 'reported_messages', icon: MessageSquare, color: 'text-pink-600' },
] as const

const statKeyMap: Record<string, keyof Props['stats']> = {
  total_users: 'totalUsers',
  total_workers: 'totalWorkers',
  total_companies: 'totalCompanies',
  active_jobs: 'activeJobs',
  total_applications: 'totalApplications',
  pending_verifications: 'pendingVerifications',
  failed_translations: 'failedTranslations',
  reported_messages: 'reportedMessages',
}

export function AdminDashboard({ stats, chartData, activity, locale }: Props) {
  const t = useTranslations('admin')

  const msgKey = `message_${locale}` as 'message_uz' | 'message_zh' | 'message_ru'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ key, icon: Icon, color }) => (
          <div
            key={key}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="text-2xl font-bold text-gray-900">
                {stats[statKeyMap[key]]}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{t(key)}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            {t('registrations_chart')} — {t('last_30_days')}
          </h2>
          {chartData.registrations.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData.registrations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#dc2626"
                  fill="#dc262620"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-gray-400">{t('no_data')}</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            {t('applications_chart')} — {t('last_30_days')}
          </h2>
          {chartData.applications.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData.applications}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#dc2626"
                  fill="#dc262620"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-gray-400">{t('no_data')}</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          {t('recent_activity')}
        </h2>
        {activity.length > 0 ? (
          <div className="space-y-3">
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0"
              >
                <p className="text-sm text-gray-700">
                  {item[msgKey] || item.message_uz}
                </p>
                <span className="ml-4 shrink-0 text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">{t('no_data')}</p>
        )}
      </div>
    </div>
  )
}
