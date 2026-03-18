import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Authenticated Supabase client — uses cookies(), which opts the route into dynamic rendering.
 * Use this for protected pages and server actions that need the user session.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
