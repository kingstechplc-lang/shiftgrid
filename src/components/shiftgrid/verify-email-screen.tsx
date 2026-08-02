'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HeartPulse, MailCheck, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function VerifyEmailScreen({ email, name, userId, demoCode }: {
  email: string
  name: string
  userId: string
  demoCode?: string
}) {
  const { setUser } = useApp()
  const { toast } = useToast()
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resending, setResending] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-fill demo code if in demo mode
  useEffect(() => {
    if (demoCode && demoCode.length === 6) {
      setDigits(demoCode.split(''))
      // Auto-submit after filling
      setTimeout(() => submitCode(demoCode), 500)
    }
  }, [demoCode])

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Auto-focus first digit on mount
  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  function handleDigitChange(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError(null)

    // Auto-advance
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits filled
    if (digit && index === 5 && next.every(d => d)) {
      submitCode(next.join(''))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputs.current[index + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const next = pasted.split('').concat(Array(6 - pasted.length).fill(''))
      setDigits(next)
      if (pasted.length === 6) {
        submitCode(pasted)
      } else {
        inputs.current[pasted.length]?.focus()
      }
    }
  }

  async function submitCode(code: string) {
    if (code.length !== 6) {
      setError('Please enter all 6 digits.')
      return
    }
    setVerifying(true)
    setError(null)
    try {
      const res = await api<{ success: boolean; user: any; error?: string }>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ userId, code }),
      })
      if (res.success && res.user) {
        setVerified(true)
        toast({ title: 'Email verified!', description: 'Welcome to ShiftGrid.' })
        setTimeout(() => setUser(res.user), 1200)
      } else {
        setError(res.error || 'Invalid code.')
        setDigits(['', '', '', '', '', ''])
        inputs.current[0]?.focus()
      }
    } catch (e: any) {
      setError(e.message || 'Verification failed.')
      setDigits(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setVerifying(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0) return
    setResending(true)
    setError(null)
    try {
      const res = await api<{ success: boolean; demoCode?: string; error?: string; cooldown?: number }>('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      if (res.success) {
        toast({ title: 'Verification code sent', description: `Check ${email}` })
        setCooldown(30)
        if (res.demoCode) {
          // Auto-fill new demo code
          setDigits(res.demoCode.split(''))
          setTimeout(() => submitCode(res.demoCode!), 500)
        }
      } else {
        setError(res.error)
        if (res.cooldown) setCooldown(res.cooldown)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setResending(false)
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950 dark:via-teal-950 dark:to-emerald-900 p-6">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Email verified!</h1>
            <p className="text-muted-foreground mb-6">Taking you to your dashboard…</p>
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <Sparkles className="size-4 animate-pulse" />
              <span className="text-sm font-medium">Welcome to ShiftGrid</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950 dark:via-teal-950 dark:to-emerald-900 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="size-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
            <HeartPulse className="size-6" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">ShiftGrid</span>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            {/* Icon */}
            <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-5">
              <MailCheck className="size-8 text-emerald-600 dark:text-emerald-400" />
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">Verify your email</h1>
            <p className="text-center text-muted-foreground text-sm mb-1">
              We sent a 6-digit verification code to
            </p>
            <p className="text-center font-semibold text-sm mb-6">{email}</p>

            {/* Demo mode banner */}
            {demoCode && (
              <div className="mb-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-medium mb-1">
                  <Sparkles className="size-3.5" />
                  DEMO MODE — no real email was sent
                </div>
                <p className="text-amber-700 dark:text-amber-400 text-xs">
                  Your verification code is <span className="font-mono font-bold text-base tracking-widest">{demoCode}</span>. Auto-filling…
                </p>
              </div>
            )}

            {/* 6-digit input */}
            <div className="flex justify-center gap-2 mb-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={verifying}
                  className={`size-12 sm:size-14 text-center text-2xl font-bold rounded-xl border-2 transition-all ${
                    error
                      ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20'
                      : digit
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                      : 'border-input bg-background hover:border-emerald-300'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500`}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center justify-center gap-1.5 text-rose-600 dark:text-rose-400 text-sm mt-3">
                <AlertCircle className="size-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Verify button */}
            <Button
              onClick={() => submitCode(digits.join(''))}
              disabled={verifying || digits.some(d => !d)}
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 h-11 text-base"
            >
              {verifying ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Verifying…
                </>
              ) : (
                'Verify email'
              )}
            </Button>

            {/* Resend */}
            <div className="text-center mt-5 text-sm">
              <span className="text-muted-foreground">Didn&apos;t receive a code? </span>
              <button
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Wrong email? <button onClick={() => window.location.reload()} className="text-emerald-600 hover:underline font-medium">Use a different email</button>
        </p>
      </div>
    </div>
  )
}
