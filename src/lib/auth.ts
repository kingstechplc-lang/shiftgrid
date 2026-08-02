import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import { db } from '@/lib/db'

export const SESSION_COOKIE = 'sg_session'

export function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

export async function getSession(): Promise<{ userId: string } | null> {
  const store = await cookies()
  const sid = store.get(SESSION_COOKIE)?.value
  if (!sid) return null
  // We store the user ID directly in the cookie for this demo sandbox.
  // In production this would be a signed session token backed by NextAuth.
  return { userId: sid }
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { hospital: true },
  })
  return user
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'hospital_admin' && user.role !== 'super_admin') {
    throw new Error('Forbidden: admin only')
  }
  return user as typeof user & { hospitalId: string }
}

export async function requireStaff() {
  const user = await requireUser()
  if (user.role !== 'staff') throw new Error('Forbidden: staff only')
  return user
}

// Safe user object for client — never expose passwordHash
export function toSafeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    authProvider: user.authProvider ?? 'local',
    emailVerified: user.emailVerified ?? null,
    hospitalId: user.hospitalId,
    hospital: user.hospital ? { id: user.hospital.id, name: user.hospital.name, verified: user.hospital.verified, address: user.hospital.address, description: user.hospital.description } : null,
    specialty: user.specialty,
    specialtyOther: user.specialtyOther ?? null,
    experienceYears: user.experienceYears,
    resumeUrl: user.resumeUrl,
    availability: user.availability,
    bio: user.bio,
    location: user.location,
    preferredTypes: user.preferredTypes,
    // Personal info
    profilePhoto: user.profilePhoto ?? null,
    phoneNumber: user.phoneNumber ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    gender: user.gender ?? null,
    // Address info
    region: user.region ?? null,
    district: user.district ?? null,
    townCity: user.townCity ?? null,
    streetAddress: user.streetAddress ?? null,
    landmark: user.landmark ?? null,
    digitalAddress: user.digitalAddress ?? null,
  }
}
