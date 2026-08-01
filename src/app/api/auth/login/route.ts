import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, SESSION_COOKIE } from '@/lib/auth'

// POST /api/auth/login
export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }
  const user = await db.user.findUnique({
    where: { email: String(email).toLowerCase().trim() },
    include: { hospital: true },
  })
  if (!user || user.passwordHash !== hashPassword(password)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }
  const res = NextResponse.json({
    id: user.id, email: user.email, name: user.name, role: user.role,
    hospitalId: user.hospitalId, hospital: user.hospital,
  })
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
  })
  return res
}
