"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { redirect, useRouter } from "next/navigation"
import { createClient } from "@/app/lib/supabase/client"
import type { AuthUser, Session } from "@supabase/supabase-js"
import axios from "axios"
import { FeedsClient } from "@stream-io/feeds-client"

type AuthContextType = {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  client: FeedsClient | null;
  session: Session | null;
  isAuthLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null)
  const [client, setClient] = useState<FeedsClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        setIsAuthLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        const user = session?.user ?? null;

        if (sessionError || !user) {
          setUser(null);
          setSession(null);
          setIsAuthLoading(false);
          router.push("/login");
        }
        try {
          if (!user?.user_metadata.get_stream_token) {
            const client = new FeedsClient(process.env.NEXT_PUBLIC_GETSTREAM_API_KEY!);
            const response = await axios.get("/api/get_stream/create-token");
            if (response.data && user?.id) {
              const token = response.data.token;

              await client.connectUser(
                {
                  id: user?.id,
                  custom: {
                    full_name: user?.user_metadata.full_name,
                  },
                  name: user?.user_metadata.username,
                  image: user?.user_metadata.avatar_url
                },
                token,
              );
              setClient(client);
            }
          } else {
            const client = new FeedsClient(process.env.NEXT_PUBLIC_GETSTREAM_API_KEY!);
            await client.connectUser(
              { id: user.id },
              user.user_metadata.get_stream_token,
            );
            setClient(client)
          }
        } catch (error: any) {
          if(error?.toString()?.includes("token is expired")){
            const response = await axios.get("/api/get_stream/create-token");
            if (response.data && user?.id) {
              const token = response.data.token;
              const client = new FeedsClient(process.env.NEXT_PUBLIC_GETSTREAM_API_KEY!);
              await client.connectUser(
                {id: user?.id,},
                token,
              );
              setClient(client);
            }
          } else {
            throw (error);
          }
        }
        setSession(session)
        setUser(user)
        console.log("Initial session:", session);
        console.log("Initial user:", user);
      } catch (err) {
        console.error("Error fetching session:", err)
        setUser(null);
        router.push("/login");
      } finally {
        setIsAuthLoading(false)
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("_event", _event);
      console.log("session", session);
      setSession(session)
      setUser(session?.user ?? null)

      if (_event === "SIGNED_IN") {
        if (window.location.pathname === "/login" || window.location.pathname === "/signup") {
          router.push("/");
        }
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
    <AuthContext.Provider value={{ user, setUser, client, session, isAuthLoading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}