import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId,
      hospital: user.hospital ? { id: user.hospital.id, name: user.hospital.name, verified: user.hospital.verified, address: user.hospital.address, description: user.hospital.description } : null,
      specialty: user.specialty,
      experienceYears: user.experienceYears,
      resumeUrl: user.resumeUrl,
      availability: user.availability,
      bio: user.bio,
      location: user.location,
      preferredTypes: user.preferredTypes,
    },
  })
}
