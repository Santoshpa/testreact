"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  loginUser,
  isAuthenticated,
  getToken,
  removeToken,
  removeUser,
  getRememberMe,
  getTokenExpirationInfo,
  getUser as getUserFromStorage,
} from "@/lib/auth"
import { useSessionTimeout } from "@/hooks/useSessionTimeout"
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning"

interface User {
  id: number
  email: string
  name?: string
  user_role?: string
  [key: string]: unknown
}

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<boolean>
  tokenInfo: unknown
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  login: async () => {},
  logout: async () => false,
  tokenInfo: null,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === "undefined" || !mounted) return

      setLoading(true)

      try {
        if (!isAuthenticated()) {
          setUserState(null)
          setLoading(false)
          return
        }

        await refreshUser()
      } catch (err) {
        setUserState(null)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      checkAuth()
    }
  }, [mounted])

  useEffect(() => {
    if (user) {
      const info = getTokenExpirationInfo()
      setTokenInfo(info)
    } else {
      setTokenInfo(null)
    }
  }, [user])

  const logout = async (): Promise<boolean> => {
    try {
      const token = getToken()

      if (token) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
        } catch (error) {
          // Continue with local cleanup even if API call fails
        }
      }

      removeToken()
      removeUser()
      setUserState(null)
      setTokenInfo(null)
      router.push("/login")
      return true
    } catch (error) {
      return false
    }
  }

  const handleSessionTimeout = async () => {
    await logout()
  }

  const getSessionTimeout = () => {
    const rememberMe = getRememberMe()
    return rememberMe ? 14 * 24 * 60 : 2 * 60
  }

  const { showWarning, timeLeft, dismissWarning } = useSessionTimeout({
    timeoutInMinutes: getSessionTimeout(),
    warningInSeconds: 30,
    onTimeout: handleSessionTimeout,
    isAuthenticated: !!user,
  })

  const refreshUser = async () => {
    try {
      if (typeof window === "undefined") return

      const token = getToken()
      if (!token) {
        setUserState(null)
        return
      }

      const storedUser = getUserFromStorage()
      if (storedUser) {
        setUserState(storedUser)
        return
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL
      const storedUserId = localStorage.getItem("user_id")
      const userId = storedUserId ? JSON.parse(storedUserId) : null

      if (!userId || !API_URL) {
        setUserState(null)
        return
      }

      const response = await fetch(`${API_URL}/GetUser/?id=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        await logout()
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch user data")
      }

      const data = await response.json()
      const userData = data.details?.[0] || null
      setUserState(userData)
    } catch (err) {
      setUserState(null)
    }
  }

  const login = async (email: string, password: string, rememberMe = false): Promise<void> => {
    try {
      const data = await loginUser(email, password, rememberMe)

      setUserState(data.user)

      const info = getTokenExpirationInfo()
      setTokenInfo(info)

      setTimeout(() => {
        if (data.user?.user_role === "admin") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }, 100)
    } catch (error) {
      throw error
    }
  }

  if (!mounted) return null

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, login, logout, tokenInfo }}>
      {children}
      {showWarning && <SessionTimeoutWarning timeLeft={timeLeft} onContinue={dismissWarning} />}
    </AuthContext.Provider>
  )
}
