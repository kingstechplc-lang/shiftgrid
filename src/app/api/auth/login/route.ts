import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, SESSION_COOKIE, toSafeUser } from '@/lib/auth'
import { sendVerification } from '@/lib/verification'
import { isDemoMode } from '@/lib/email'

// POST /api/auth/login
export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }
  const normalizedEmail = String(email).toLowerCase().trim()
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    include: { hospital: true },
  })
  if (!user || !user.passwordHash || user.passwordHash !== hashPassword(password)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  // Email verification gate
  if (!user.emailVerified) {
    // Don't auto-resend on every login attempt — it invalidates previous codes
    // and confuses users. Only return the pending state; they can request a resend.
    // Check if there's a valid recent code still active (within 10 min)
    const recentToken = await db.verificationToken.findFirst({
      where: {
        userId: user.id,
        type: 'email_verification',
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    let demoCode: string | undefined
    if (!recentToken) {
      // No active code — generate a new one
      const emailResult = await sendVerification(user.id, user.email, user.name)
      demoCode = isDemoMode() ? emailResult.code : undefined
    } else if (isDemoMode()) {
      // In demo mode, return the existing code so the user can see it
      demoCode = recentToken.code
    }

    return NextResponse.json({
      error: 'Please verify your email before signing in.',
      pendingVerification: true,
      email: user.email,
      name: user.name,
      userId: user.id,
      demoCode,
    }, { status: 403 })
  }

  const res = NextResponse.json(toSafeUser(user))
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
  })
  return res
}
