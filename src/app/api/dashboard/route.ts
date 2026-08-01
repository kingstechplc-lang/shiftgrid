import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/dashboard — stats for the current user's role
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (user.role === 'staff') {
    const [applications, savedOffers, unreadMessages, unreadNotifications, expiringCreds] = await Promise.all([
      db.application.count({ where: { userId: user.id } }),
      db.savedOffer.count({ where: { userId: user.id } }),
      db.message.count({ where: { recipientId: user.id, read: false } }),
      db.notification.count({ where: { userId: user.id, read: false } }),
      db.credential.count({
        where: {
          userId: user.id,
          expiryDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
        },
      }),
    ])

    // Status breakdown
    const byStatus = await db.application.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: true,
    })
    const statusCounts: Record<string, number> = {}
    for (const s of byStatus) statusCounts[s.status] = s._count

    // Recommended offers — match specialty
    const recommended = user.specialty
      ? await db.offer.findMany({
          where: { status: 'published', specialty: { contains: user.specialty } },
          include: { hospital: { select: { id: true, name: true, verified: true, address: true } }, _count: { select: { applications: true } } },
          orderBy: { urgent: 'desc' },
          take: 6,
        })
      : await db.offer.findMany({
          where: { status: 'published' },
          include: { hospital: { select: { id: true, name: true, verified: true, address: true } }, _count: { select: { applications: true } } },
          orderBy: { createdAt: 'desc' },
          take: 6,
        })

    return NextResponse.json({
      role: 'staff',
      stats: { applications, savedOffers, unreadMessages, unreadNotifications, expiringCreds },
      statusCounts,
      recommended,
    })
  }

  if (user.role === 'hospital_admin' || user.role === 'super_admin') {
    if (!user.hospitalId) return NextResponse.json({ error: 'No hospital' }, { status: 400 })
    const hospitalId = user.hospitalId
    const [openOffers, applicants, upcomingShifts, filledRoles, draftOffers, unreadMessages, unreadNotifications, teamCount] = await Promise.all([
      db.offer.count({ where: { hospitalId, status: 'published' } }),
      db.application.count({ where: { offer: { hospitalId } } }),
      db.offer.count({ where: { hospitalId, status: 'published', type: 'locum', shiftStart: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 3600 * 1000) } } }),
      db.offer.count({ where: { hospitalId, status: 'filled' } }),
      db.offer.count({ where: { hospitalId, status: 'draft' } }),
      db.message.count({ where: { recipientId: user.id, read: false } }),
      db.notification.count({ where: { userId: user.id, read: false } }),
      db.user.count({ where: { hospitalId } }),
    ])

    // Pipeline counts (across all this hospital's offers)
    const pipelineRaw = await db.application.groupBy({
      by: ['status'],
      where: { offer: { hospitalId } },
      _count: true,
    })
    const pipeline: Record<string, number> = {}
    for (const s of pipelineRaw) pipeline[s.status] = s._count

    // Recent offers
    const recentOffers = await db.offer.findMany({
      where: { hospitalId },
      include: { _count: { select: { applications: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    // Recent applicants
    const recentApplicants = await db.application.findMany({
      where: { offer: { hospitalId } },
      include: { offer: { select: { id: true, title: true } }, user: { select: { id: true, name: true, specialty: true, experienceYears: true } } },
      orderBy: { appliedAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({
      role: 'hospital_admin',
      stats: { openOffers, applicants, upcomingShifts, filledRoles, draftOffers, unreadMessages, unreadNotifications, teamCount },
      pipeline,
      recentOffers,
      recentApplicants,
    })
  }

  return NextResponse.json({ error: 'Unsupported role' }, { status: 400 })
}
