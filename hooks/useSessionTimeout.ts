"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseSessionTimeoutProps {
  timeoutInMinutes: number
  warningInSeconds: number
  onTimeout: () => void
  isAuthenticated: boolean
}

export const useSessionTimeout = ({
  timeoutInMinutes,
  warningInSeconds,
  onTimeout,
  isAuthenticated,
}: UseSessionTimeoutProps) => {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)

    setShowWarning(false)

    // Set warning timer
    warningRef.current = setTimeout(
      () => {
        setShowWarning(true)
        setTimeLeft(warningInSeconds)

        // Start countdown
        countdownRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              onTimeout()
              return 0
            }
            return prev - 1
          })
        }, 1000)
      },
      (timeoutInMinutes * 60 - warningInSeconds) * 1000,
    )

    // Set timeout timer
    timeoutRef.current = setTimeout(
      () => {
        onTimeout()
      },
      timeoutInMinutes * 60 * 1000,
    )
  }, [timeoutInMinutes, warningInSeconds, onTimeout, isAuthenticated])

  const dismissWarning = useCallback(() => {
    setShowWarning(false)
    if (countdownRef.current) clearInterval(countdownRef.current)
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    if (isAuthenticated) {
      resetTimer()

      // Reset timer on user activity
      const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]
      const resetOnActivity = () => resetTimer()

      events.forEach((event) => {
        document.addEventListener(event, resetOnActivity, true)
      })

      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, resetOnActivity, true)
        })
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (warningRef.current) clearTimeout(warningRef.current)
        if (countdownRef.current) clearInterval(countdownRef.current)
      }
    }
  }, [isAuthenticated, resetTimer])

  return { showWarning, timeLeft, dismissWarning }
}
