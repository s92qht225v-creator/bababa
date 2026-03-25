import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '百邦 — Baibang.uz'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            borderRadius: 24,
            background: '#ed2024',
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 64, color: '#ffffff', fontWeight: 700 }}>邦</span>
        </div>
        <span style={{ fontSize: 72, fontWeight: 700, color: '#ffffff', letterSpacing: 2 }}>
          百邦
        </span>
        <span style={{ fontSize: 28, color: '#9ca3af', marginTop: 16 }}>
          baibang.uz
        </span>
        <div
          style={{
            display: 'flex',
            gap: 32,
            marginTop: 40,
            fontSize: 20,
            color: '#d1d5db',
          }}
        >
          <span>O&apos;zbek</span>
          <span style={{ color: '#6b7280' }}>·</span>
          <span>中文</span>
          <span style={{ color: '#6b7280' }}>·</span>
          <span>Русский</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
