import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE, toSafeUser } from '@/lib/auth'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

// POST /api/auth/google-demo
// Sandbox-friendly Google login simulation.
// In production, replace this with real NextAuth Google OAuth:
//   1. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
//   2. Use next-auth with GoogleProvider — see /api/auth/[...nextauth]/route.ts
//
// This demo endpoint creates (or logs in) a Google-authenticated user
// with a verified email, so the full UI flow is testable without OAuth creds.

const DEMO_GOOGLE_USERS = [
  { email: 'demo.google@staff.test', name: 'Alex Chen', role: 'staff', specialty: 'Emergency Medicine', experienceYears: 5, location: 'Toronto, ON' },
  { email: 'demo.google.admin@stmarys.test', name: 'Jordan Lee', role: 'hospital_admin', hospitalName: 'Riverside Medical Center', hospitalAddress: '200 River Rd, Toronto, ON' },
]

export async function POST(req: NextRequest) {
  const { role } = await req.json().catch(() => ({}))

  // Pick a demo profile based on requested role
  const profile = role === 'hospital_admin' ? DEMO_GOOGLE_USERS[1] : DEMO_GOOGLE_USERS[0]

  // Find or create the Google user
  let user = await db.user.findUnique({
    where: { email: profile.email },
    include: { hospital: true },
  })

  if (!user) {
    let hospitalId: string | null = null
    if (profile.role === 'hospital_admin' && profile.hospitalName) {
      const h = await db.hospital.create({
        data: { name: profile.hospitalName, address: profile.hospitalAddress ?? null, verified: false },
      })
      hospitalId = h.id
    }

    user = await db.user.create({
      data: {
        email: profile.email,
        passwordHash: null,  // OAuth users don't have a password
        name: profile.name,
        role: profile.role as Role,
        authProvider: 'google',
        emailVerified: new Date(),  // Google users are auto-verified
        hospitalId,
        specialty: (profile as any).specialty ?? null,
        experienceYears: (profile as any).experienceYears ?? null,
        location: (profile as any).location ?? null,
      },
      include: { hospital: true },
    })
  }

  const res = NextResponse.json(toSafeUser(user))
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
  })
  return res
}
