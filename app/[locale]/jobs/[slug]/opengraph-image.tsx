import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Job — 百邦'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: job } = await supabase
    .from('jobs')
    .select('title_original, title_uz, title_zh, title_ru, salary_min, salary_max, salary_currency, company:companies(name_original)')
    .eq('slug', slug)
    .single()

  const title = job?.[`title_${locale}` as keyof typeof job] as string || job?.title_original || 'Job'
  const company = (job?.company as { name_original: string } | null)?.name_original || ''
  const salary = job?.salary_min
    ? `${job.salary_min.toLocaleString()}${job.salary_max ? ` – ${job.salary_max.toLocaleString()}` : '+'} ${job.salary_currency || 'USD'}`
    : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 60,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#ed2024',
              }}
            >
              <span style={{ fontSize: 24, color: '#ffffff', fontWeight: 700 }}>邦</span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#9ca3af' }}>百邦</span>
          </div>
          <span
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
              maxWidth: 900,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </span>
          {company && (
            <span style={{ fontSize: 28, color: '#9ca3af', marginTop: 16 }}>{company}</span>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {salary ? (
            <span style={{ fontSize: 32, fontWeight: 600, color: '#ed2024' }}>{salary}</span>
          ) : (
            <span />
          )}
          <span style={{ fontSize: 20, color: '#6b7280' }}>baibang.uz</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
