import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase URL — use SUPABASE_URL (direct) if set, otherwise fall back to NEXT_PUBLIC_SUPABASE_URL.
 * This allows server-side calls to go directly to Supabase without going through a proxy.
 */
const serverSupabaseUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!

/**
 * Authenticated Supabase client — uses cookies(), which opts the route into dynamic rendering.
 * Use this for protected pages and server actions that need the user session.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    serverSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from a Server Component —
            // this can be ignored if middleware refreshes the session.
          }
        },
      },
    }
  )
}

/**
 * Anonymous Supabase client — does NOT use cookies(), so pages remain cacheable (ISR).
 * Use this for public pages that only read public data (jobs, workers, companies, home).
 */
export function createPublicClient() {
  return createServerClient(
    serverSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op — public client doesn't need cookies
        },
      },
    }
  )
}
