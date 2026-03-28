'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2 } from 'lucide-react'

interface ShareJobButtonProps {
  jobSlug: string
  jobTitle: string
  companyName: string
  location?: string
  salary: string
  locale: string
}

export function ShareJobButton({ jobSlug, jobTitle, companyName, location, salary, locale }: ShareJobButtonProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const jobUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}/jobs/${jobSlug}`

  const shareText = [
    `📋 ${jobTitle}`,
    `🏢 ${companyName}`,
    location ? `📍 ${location}` : '',
    `💰 ${salary}`,
    '',
    jobUrl,
  ].filter(Boolean).join('\n')

  const shareToTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(jobUrl)}&text=${encodeURIComponent(
        [
          `📋 ${jobTitle}`,
          `🏢 ${companyName}`,
          location ? `📍 ${location}` : '',
          `💰 ${salary}`,
        ].filter(Boolean).join('\n')
      )}`,
      '_blank',
      'noopener,noreferrer'
    )
    setOpen(false)
  }

  const shareToInstagram = () => {
    navigator.clipboard.writeText(shareText)
    setOpen(false)
    alert(locale === 'zh' ? '已复制职位信息，请粘贴到Instagram' : locale === 'ru' ? 'Информация о вакансии скопирована для Instagram' : 'Ish ma\'lumotlari nusxalandi, Instagramga joylashtiring')
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(!open)
        }}
        className="rounded-full p-1.5 text-gray-400 transition hover:text-gray-600"
        aria-label="Share"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 z-50 min-w-[160px] rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <button
            onClick={shareToTelegram}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4 text-[#26A5E4]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Telegram
          </button>
          <button
            onClick={shareToInstagram}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="url(#ig-gradient)">
              <defs>
                <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFDC80" />
                  <stop offset="25%" stopColor="#F77737" />
                  <stop offset="50%" stopColor="#E1306C" />
                  <stop offset="75%" stopColor="#C13584" />
                  <stop offset="100%" stopColor="#833AB4" />
                </linearGradient>
              </defs>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
            Instagram
          </button>
        </div>
      )}
    </div>
  )
}
