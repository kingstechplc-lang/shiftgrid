import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/super/stats — platform-wide stats for super admin
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: super admin only' }, { status: 403 })
  }

  const [hospitals, users, offers, applications, staffUsers, adminUsers, publishedOffers, filledOffers, pendingHospitals] = await Promise.all([
    db.hospital.count(),
    db.user.count(),
    db.offer.count(),
    db.application.count(),
    db.user.count({ where: { role: 'staff' } }),
    db.user.count({ where: { role: 'hospital_admin' } }),
    db.offer.count({ where: { status: 'published' } }),
    db.offer.count({ where: { status: 'filled' } }),
    db.hospital.count({ where: { verified: false } }),
  ])

  // Recent signups
  const recentUsers = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, authProvider: true, emailVerified: true, createdAt: true, hospital: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  // Recent hospitals
  const recentHospitals = await db.hospital.findMany({
    select: { id: true, name: true, verified: true, address: true, createdAt: true, _count: { select: { offers: true, members: true } } },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })

  // Offers by type
  const locumOffers = await db.offer.count({ where: { type: 'locum' } })
  const permanentOffers = await db.offer.count({ where: { type: 'permanent' } })

  return NextResponse.json({
    stats: {
      hospitals, users, offers, applications,
      staffUsers, adminUsers,
      publishedOffers, filledOffers,
      pendingHospitals,
      locumOffers, permanentOffers,
    },
    recentUsers,
    recentHospitals,
  })
}
