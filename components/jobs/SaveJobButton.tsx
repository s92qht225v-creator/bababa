'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { toggleSaveJob } from '@/lib/actions/saved-jobs'

interface SaveJobButtonProps {
  jobId: string
  initialSaved: boolean
  size?: 'sm' | 'md'
}

export function SaveJobButton({ jobId, initialSaved, size = 'sm' }: SaveJobButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    const result = await toggleSaveJob(jobId)
    if (result.success) {
      setSaved(result.saved ?? false)
    }
    setLoading(false)
  }

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-full p-1.5 transition ${
        saved
          ? 'text-red-500 hover:text-red-600'
          : 'text-gray-400 hover:text-red-500'
      } ${loading ? 'opacity-50' : ''}`}
      title={saved ? 'Saqlangan' : 'Saqlash'}
    >
      <Heart className={`${iconSize} ${saved ? 'fill-current' : ''}`} />
    </button>
  )
}
