import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendVerification } from '@/lib/verification'
import { isDemoMode } from '@/lib/email'

export const dynamic = 'force-dynamic'

// POST /api/auth/resend-verification
// Body: { email }
// Cooldown: 30 seconds between resends
export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 })

  const user = await db.user.findUnique({ where: { email: String(email).toLowerCase().trim() } })
  if (!user) return NextResponse.json({ error: 'No account found with that email.' }, { status: 404 })
  if (user.emailVerified) return NextResponse.json({ error: 'This email is already verified.' }, { status: 400 })

  // Cooldown: check the most recent token
  const latest = await db.verificationToken.findFirst({
    where: { userId: user.id, type: 'email_verification' },
    orderBy: { createdAt: 'desc' },
  })
  if (latest && Date.now() - latest.createdAt.getTime() < 30 * 1000) {
    const wait = Math.ceil((30 * 1000 - (Date.now() - latest.createdAt.getTime())) / 1000)
    return NextResponse.json({ error: `Please wait ${wait}s before requesting a new code.`, cooldown: wait }, { status: 429 })
  }

  const emailResult = await sendVerification(user.id, user.email, user.name)
  return NextResponse.json({
    success: true,
    userId: user.id,
    email: user.email,
    name: user.name,
    demoCode: isDemoMode() ? emailResult.code : undefined,
  })
}
