'use client'

import { useTranslations } from 'next-intl'

export function TelegramButton() {
  const t = useTranslations('auth')

  // The real Telegram Widget requires NEXT_PUBLIC_TELEGRAM_BOT_NAME env var.
  // When the bot name is not set, render a styled placeholder button.
  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME

  return (
    <button
      type="button"
      onClick={() => {
        if (botName) {
          // In production, Telegram OAuth widget handles this
          window.open(
            `https://oauth.telegram.org/auth?bot_id=${botName}&origin=${window.location.origin}`,
            'telegram-login',
            'width=550,height=470'
          )
        }
      }}
      className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#2AABEE] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#229ED9]"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
      </svg>
      {t('continue_with_telegram')}
    </button>
  )
}
