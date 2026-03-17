'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function HowItWorksTabs() {
  const t = useTranslations('home')
  const [tab, setTab] = useState<'workers' | 'employers'>('workers')

  const workerSteps = [
    { icon: '📝', title: t('step_w1'), desc: t('step_w1_desc') },
    { icon: '🔍', title: t('step_w2'), desc: t('step_w2_desc') },
    { icon: '📨', title: t('step_w3'), desc: t('step_w3_desc') },
    { icon: '💬', title: t('step_w4'), desc: t('step_w4_desc') },
  ]

  const employerSteps = [
    { icon: '🏢', title: t('step_e1'), desc: t('step_e1_desc') },
    { icon: '📋', title: t('step_e2'), desc: t('step_e2_desc') },
    { icon: '👥', title: t('step_e3'), desc: t('step_e3_desc') },
    { icon: '💬', title: t('step_e4'), desc: t('step_e4_desc') },
  ]

  const steps = tab === 'workers' ? workerSteps : employerSteps

  return (
    <div>
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setTab('workers')}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${
            tab === 'workers'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('for_workers')}
        </button>
        <button
          onClick={() => setTab('employers')}
          className={`rounded-full px-5 py-2 text-sm font-medium transition ${
            tab === 'employers'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('for_employers')}
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div key={i} className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
              {step.icon}
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              {i + 1}. {step.title}
            </p>
            <p className="mt-1 text-xs text-gray-500">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
