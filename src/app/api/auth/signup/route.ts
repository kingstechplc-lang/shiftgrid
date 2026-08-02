import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, SESSION_COOKIE, toSafeUser, generateRegistrationId } from '@/lib/auth'
import { Role } from '@prisma/client'
import { sendVerification } from '@/lib/verification'
import { isDemoMode } from '@/lib/email'

// POST /api/auth/signup
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, password, name, role, hospitalName, hospitalAddress, hospitalWebsite, specialty, specialtyOther, experienceYears, location, availability, preferredTypes, bio, website } = body || {}
  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: 'Email, password, name, and role are required.' }, { status: 400 })
  }
  if (!['staff', 'hospital_admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
  }
  const normalizedEmail = String(email).toLowerCase().trim()
  const exists = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (exists) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })

  let hospitalId: string | null = null
  if (role === 'hospital_admin') {
    if (!hospitalName) return NextResponse.json({ error: 'Hospital name required for admin sign-up.' }, { status: 400 })
    const h = await db.hospital.create({ data: { name: String(hospitalName), address: hospitalAddress ?? null, website: hospitalWebsite ?? null, description: null, verified: false } })
    hospitalId = h.id
  }

  const registrationId = await generateRegistrationId(role)

  const user = await db.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      name: String(name),
      role: role as Role,
      hospitalId,
      authProvider: 'local',
      emailVerified: null,
      registrationId,
      website: website ?? null,
      specialty: specialty ?? null,
      specialtyOther: specialty === 'Other' ? (specialtyOther ?? null) : null,
      experienceYears: experienceYears ? Number(experienceYears) : null,
      location: location ?? null,
      availability: availability ?? null,
      preferredTypes: Array.isArray(preferredTypes) ? preferredTypes.join(',') : (preferredTypes ?? null),
      bio: bio ?? null,
    },
    include: { hospital: true },
  })

  const emailResult = await sendVerification(user.id, user.email, user.name)

  return NextResponse.json({
    pendingVerification: true,
    email: user.email,
    name: user.name,
    userId: user.id,
    registrationId: user.registrationId,
    demoCode: isDemoMode() ? emailResult.code : undefined,
  }, { status: 201 })
}
