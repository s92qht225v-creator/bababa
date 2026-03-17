'use client'

import { useState, useRef, type KeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Paperclip, Send } from 'lucide-react'

interface Props {
  onSend: (text: string) => Promise<void>
  translating: boolean
}

export function MessageInput({ onSend, translating }: Props) {
  const t = useTranslations('messages')
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || translating) return
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    await onSend(trimmed)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      {translating && (
        <div className="mb-2 text-xs text-red-500">{t('translating')}</div>
      )}
      <div className="flex items-end gap-2">
        <button
          disabled
          title={t('attachment_coming')}
          className="flex-shrink-0 rounded-full p-2 text-gray-300 cursor-not-allowed"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={t('type_message')}
          maxLength={2000}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || translating}
          className="flex-shrink-0 rounded-full bg-red-600 p-2 text-white transition hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
