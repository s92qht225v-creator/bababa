'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  end: number
  label: string
  suffix?: string
}

export function StatsCounter({ end, label, suffix = '+' }: Props) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const duration = 1200
    const steps = 40
    const increment = end / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(interval)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(interval)
  }, [started, end])

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-bold tracking-tight gradient-text">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="mt-2 text-sm text-gray-500">{label}</p>
    </div>
  )
}
