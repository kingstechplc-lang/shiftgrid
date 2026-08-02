import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyCode, verifyToken } from '@/lib/verification'
import { SESSION_COOKIE, toSafeUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/auth/verify-email  — verify a 6-digit code
// GET  /api/auth/verify-email?token=...  — verify via email link
export async function POST(req: NextRequest) {
  const { userId, code } = await req.json()
  if (!userId || !code) return NextResponse.json({ error: 'userId and code are required.' }, { status: 400 })

  const result = await verifyCode(userId, String(code).trim())
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Set session cookie — user is now verified and logged in
  const user = await db.user.findUnique({ where: { id: userId }, include: { hospital: true } })
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  const res = NextResponse.json({ success: true, user: toSafeUser(user) })
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
  })
  return res
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required.' }, { status: 400 })

  const result = await verifyToken(token)
  if (!result.success) {
    return NextResponse.redirect(new URL(`/?verifyError=${encodeURIComponent(result.error!)}`, process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
  }

  // Set session cookie via redirect
  const res = NextResponse.redirect(new URL('/?verified=true', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
  res.cookies.set(SESSION_COOKIE, result.userId!, {
    httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
  })
  return res
}
