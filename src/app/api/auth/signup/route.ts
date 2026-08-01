import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, SESSION_COOKIE } from '@/lib/auth'
import { Role } from '@prisma/client'

// POST /api/auth/signup
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, password, name, role, hospitalName, hospitalAddress, specialty, experienceYears, location, availability, preferredTypes, bio } = body || {}
  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: 'Email, password, name, and role are required.' }, { status: 400 })
  }
  if (!['staff', 'hospital_admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
  }
  const exists = await db.user.findUnique({ where: { email: String(email).toLowerCase().trim() } })
  if (exists) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })

  let hospitalId: string | null = null
  if (role === 'hospital_admin') {
    if (!hospitalName) return NextResponse.json({ error: 'Hospital name required for admin sign-up.' }, { status: 400 })
    const h = await db.hospital.create({ data: { name: String(hospitalName), address: hospitalAddress ?? null, description: null, verified: false } })
    hospitalId = h.id
  }

  const user = await db.user.create({
    data: {
      email: String(email).toLowerCase().trim(),
      passwordHash: hashPassword(password),
      name: String(name),
      role: role as Role,
      hospitalId,
      specialty: specialty ?? null,
      experienceYears: experienceYears ? Number(experienceYears) : null,
      location: location ?? null,
      availability: availability ?? null,
      preferredTypes: Array.isArray(preferredTypes) ? preferredTypes.join(',') : (preferredTypes ?? null),
      bio: bio ?? null,
    },
    include: { hospital: true },
  })

  const res = NextResponse.json({
    id: user.id, email: user.email, name: user.name, role: user.role,
    hospitalId: user.hospitalId, hospital: user.hospital,
  })
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
  })
  return res
}
