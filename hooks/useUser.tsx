'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

interface UserContextValue {
  user: Profile | null
  loading: boolean
  isWorker: boolean
  isEmployer: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  isWorker: false,
  isEmployer: false,
  isAdmin: false,
  signOut: async () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const fetchedRef = useRef(false)

  const fetchProfile = useCallback(async (userId: string) => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setUser(data)
    } catch {
      // Ignore errors
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        fetchProfile(authUser.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchedRef.current = false
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        fetchedRef.current = false
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    fetchedRef.current = false
    router.push('/')
    router.refresh()
  }, [router])

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        isWorker: user?.role === 'worker',
        isEmployer: user?.role === 'employer',
        isAdmin: user?.role === 'admin',
        signOut,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
