import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { validateGhanaPhone, validateDigitalAddress } from '@/lib/ghana-data'

// PATCH /api/profile — update current user's profile (extended with personal + address info)
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const allowed: any = {}

  // Existing fields
  const fields = ['name','resumeUrl','availability','bio','location','website']
  for (const f of fields) if (f in body) allowed[f] = body[f] ?? null
  if ('experienceYears' in body) allowed.experienceYears = body.experienceYears !== '' && body.experienceYears != null ? Number(body.experienceYears) : null
  if ('preferredTypes' in body) {
    allowed.preferredTypes = Array.isArray(body.preferredTypes) ? body.preferredTypes.join(',') : body.preferredTypes ?? null
  }
  if ('specialty' in body) allowed.specialty = body.specialty ?? null
  if ('specialtyOther' in body) allowed.specialtyOther = body.specialtyOther ?? null

  // New personal info fields
  if ('profilePhoto' in body) allowed.profilePhoto = body.profilePhoto ?? null
  if ('gender' in body) allowed.gender = body.gender ?? null
  if ('dateOfBirth' in body) allowed.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null

  // Phone number — validate if provided
  if ('phoneNumber' in body) {
    if (body.phoneNumber) {
      const phoneCheck = validateGhanaPhone(body.phoneNumber)
      if (!phoneCheck.valid) {
        return NextResponse.json({ error: phoneCheck.error }, { status: 400 })
      }
      allowed.phoneNumber = phoneCheck.normalized
    } else {
      allowed.phoneNumber = null
    }
  }

  // Address fields
  if ('region' in body) allowed.region = body.region ?? null
  if ('district' in body) allowed.district = body.district ?? null
  if ('townCity' in body) allowed.townCity = body.townCity ?? null
  if ('streetAddress' in body) allowed.streetAddress = body.streetAddress ?? null
  if ('landmark' in body) allowed.landmark = body.landmark ?? null

  // Digital address — validate format if provided
  if ('digitalAddress' in body) {
    if (body.digitalAddress) {
      const addrCheck = validateDigitalAddress(body.digitalAddress)
      if (!addrCheck.valid) {
        return NextResponse.json({ error: addrCheck.error }, { status: 400 })
      }
      allowed.digitalAddress = body.digitalAddress.toUpperCase().trim()
    } else {
      allowed.digitalAddress = null
    }
  }

  const updated = await db.user.update({ where: { id: user.id }, data: allowed, include: { hospital: true } })
  return NextResponse.json({ user: updated })
}
