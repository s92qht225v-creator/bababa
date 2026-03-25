import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Worker — 百邦'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: worker } = await supabase
    .from('worker_profiles')
    .select('profession, slug, profile:profiles(full_name)')
    .eq('slug', slug)
    .single()

  const profileArr = worker?.profile as { full_name: string }[] | null
  const name = profileArr?.[0]?.full_name || 'Worker'
  const profession = worker?.profession || ''

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
            width: 100,
            height: 100,
            borderRadius: 50,
            background: '#374151',
            marginBottom: 24,
            fontSize: 44,
            color: '#ffffff',
            fontWeight: 700,
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: 48, fontWeight: 700, color: '#ffffff' }}>{name}</span>
        {profession && (
          <span style={{ fontSize: 26, color: '#9ca3af', marginTop: 12 }}>{profession}</span>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#ed2024',
            }}
          >
            <span style={{ fontSize: 20, color: '#ffffff', fontWeight: 700 }}>邦</span>
          </div>
          <span style={{ fontSize: 20, color: '#6b7280' }}>baibang.uz</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
