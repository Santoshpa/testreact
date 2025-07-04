"use client"

import type React from "react"

import { useState, type ChangeEvent, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { EquityLogo } from "@/components/Logo"
import { useAuth } from "@/components/AuthProvider"
import Link from "next/link"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading, login } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      if (user.user_role === "admin") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return null
  }

  const handleEmailBlur = () => {
    if (email && !emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.")
    } else {
      setEmailError("")
    }
  }

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (emailError && emailRegex.test(e.target.value)) {
      setEmailError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.")
      setLoading(false)
      return
    }

    try {
      await login(email, password, rememberMe)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center md:justify-between px-4 md:px-32 py-12 bg-gray-100">
      <div className="mb-12 md:mb-0 md:max-w-md">
        <div className="flex justify-center md:justify-start mb-4">
          <EquityLogo width={250} height={60} />
        </div>
        <p
          className="text-2xl md:text-3xl font-normal text-gray-800 mt-4"
          style={{ textAlign: "justify", textJustify: "inter-word" }}
        >
          We provide customized logistics solutions at competitive rates for parcels to full containers.
        </p>
      </div>

      <div className="max-w-md w-full bg-white shadow-3xl rounded-lg p-10 shadow-md transform transition-all duration-500 hover:scale-107">
        <h1 className="text-3xl text-black text-center font-extrabold mb-10 bg-gradient-to-r from-red-700 to-purple-500 bg-clip-text text-transparent">
          Sign In
        </h1>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5 text-black">
          <div>
            <label htmlFor="email" className="block text-lg font-medium text-black">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="example@gmail.com"
              required
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              className={`w-full px-4 py-2 mt-2 border rounded-md focus:outline-none transition-all duration-300 ${
                emailError && !loading ? "border-red-500 focus:ring-red-500" : "border-black focus:ring-blue-500"
              }`}
            />
            {emailError && !loading && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="block text-lg font-medium text-black">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-800 hover:text-blue-1000 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-black">
              Remember Me {rememberMe && <span className="text-gray-500">(Keep me logged in for 14 days)</span>}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md font-semibold shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  )
}
