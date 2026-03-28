import { ImageResponse } from '@vercel/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title = searchParams.get('title') || '百邦'
  const description = searchParams.get('description') || ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          padding: '60px 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#ed2024',
              letterSpacing: '-1px',
            }}
          >
            百邦 BAIBANG
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.3,
              maxWidth: '900px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: '22px',
                color: '#94a3b8',
                textAlign: 'center',
                lineHeight: 1.5,
                maxWidth: '800px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {description.substring(0, 120)}
            </div>
          )}
          <div
            style={{
              marginTop: '16px',
              fontSize: '18px',
              color: '#64748b',
            }}
          >
            baibang.uz
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
