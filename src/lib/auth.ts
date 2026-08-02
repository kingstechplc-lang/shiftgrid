import { cookies } from 'next/headers'
import { createHash, pbkdf2Sync, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'

export const SESSION_COOKIE = 'sg_session'

// Legacy SHA-256 hashing (used by seed data — backward compatible)
export function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

// Secure PBKDF2 hashing (used for new accounts, especially super admin)
export function hashPasswordSecure(pw: string): string {
  const salt = createHash('sha256').update(pw + Date.now() + Math.random()).digest('hex').slice(0, 32)
  const hash = pbkdf2Sync(pw, salt, 100000, 64, 'sha512').toString('hex')
  return `pbkdf2$${salt}$${hash}`
}

// Verify a password against either hash format
export function verifyPassword(pw: string, storedHash: string): boolean {
  if (!storedHash) return false

  // PBKDF2 format: "pbkdf2$salt$hash"
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$')
    if (parts.length !== 3) return false
    const salt = parts[1]
    const hash = parts[2]
    const computedHash = pbkdf2Sync(pw, salt, 100000, 64, 'sha512').toString('hex')
    // Timing-safe comparison to prevent timing attacks
    try {
      return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'))
    } catch {
      return false
    }
  }

  // Legacy SHA-256 format
  const sha256Hash = createHash('sha256').update(pw).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sha256Hash, 'hex'), Buffer.from(storedHash, 'hex'))
  } catch {
    return sha256Hash === storedHash
  }
}

export async function getSession(): Promise<{ userId: string } | null> {
  const store = await cookies()
  const sid = store.get(SESSION_COOKIE)?.value
  if (!sid) return null
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
  // Check if user is suspended or banned
  if (user.status === 'suspended' || user.status === 'banned') {
    throw new Error(`Account ${user.status}: ${user.status === 'suspended' ? 'Your account has been suspended. Please contact support.' : 'Your account has been banned.'}`)
  }
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

export async function requireSuperAdmin() {
  const user = await requireUser()
  if (user.role !== 'super_admin') throw new Error('Forbidden: super admin only')
  return user
}

// Generate a unique registration ID based on role
export async function generateRegistrationId(role: string): Promise<string> {
  const prefix = role === 'super_admin' ? 'SG-SUPER' : role === 'hospital_admin' ? 'SG-ADMIN' : 'SG-STAFF'
  // Count existing users with this role to determine the next number
  const count = await db.user.count({ where: { role: role as any } })
  const num = String(count + 1).padStart(5, '0')
  let regId = `${prefix}-${num}`
  // Ensure uniqueness (in case of race condition)
  let attempt = 0
  while (attempt < 100) {
    const existing = await db.user.findUnique({ where: { registrationId: regId } })
    if (!existing) break
    attempt++
    regId = `${prefix}-${String(count + 1 + attempt).padStart(5, '0')}`
  }
  return regId
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
    status: user.status ?? 'active',
    registrationId: user.registrationId ?? null,
    website: user.website ?? null,
    canReceiveMessages: user.canReceiveMessages ?? 'true',
    hospitalId: user.hospitalId,
    hospital: user.hospital ? { id: user.hospital.id, name: user.hospital.name, verified: user.hospital.verified, address: user.hospital.address, description: user.hospital.description, logoUrl: user.hospital.logoUrl, bannerUrl: user.hospital.bannerUrl, website: user.hospital.website, status: user.hospital.status } : null,
    specialty: user.specialty,
    specialtyOther: user.specialtyOther ?? null,
    experienceYears: user.experienceYears,
    resumeUrl: user.resumeUrl,
    availability: user.availability,
    bio: user.bio,
    location: user.location,
    preferredTypes: user.preferredTypes,
    offerTypes: user.offerTypes ?? null,
    profilePhoto: user.profilePhoto ?? null,
    coverPhotoUrl: user.coverPhotoUrl ?? null,
    phoneNumber: user.phoneNumber ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    gender: user.gender ?? null,
    region: user.region ?? null,
    district: user.district ?? null,
    townCity: user.townCity ?? null,
    streetAddress: user.streetAddress ?? null,
    landmark: user.landmark ?? null,
    digitalAddress: user.digitalAddress ?? null,
  }
}
