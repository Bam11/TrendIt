"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { createClient } from "../lib/supabase/client"
import type { AuthUser, Session } from "@supabase/supabase-js"

type AuthContextType = {
  user: AuthUser | null
  session: Session | null
  isAuthLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setIsAuthLoading(false)
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (_event === "SIGNED_IN") {
        router.push("/")
        router.refresh()
      }

      if (_event === "SIGNED_OUT") {
        router.push("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, isAuthLoading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}