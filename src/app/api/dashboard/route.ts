import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/dashboard — stats for the current user's role
// Optimized for Neon: minimize round-trips by fetching richer data in fewer queries.
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check account status
    if (user.status === 'banned') {
      return NextResponse.json({ error: 'Your account has been banned.' }, { status: 403 })
    }
    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 })
    }

    if (user.role === 'staff') {
      const [allApps, savedCount, unreadCounts, unreadNotifications, expiringCreds, recommended] = await Promise.all([
        db.application.findMany({
          where: { userId: user.id },
          select: { id: true, status: true, appliedAt: true, updatedAt: true, offerId: true,
            offer: { select: { id: true, title: true, specialty: true, type: true, status: true, shiftStart: true, salaryMin: true, salaryMax: true, location: true, createdById: true,
              hospital: { select: { id: true, name: true, verified: true, address: true } } } } },
          orderBy: { updatedAt: 'desc' },
        }),
        db.savedOffer.count({ where: { userId: user.id } }),
        db.message.count({ where: { recipientId: user.id, read: false } }),
        db.notification.count({ where: { userId: user.id, read: false } }),
        db.credential.count({
          where: { userId: user.id, expiryDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 3600 * 1000) } },
        }),
        db.offer.findMany({
          where: { status: 'published', ...(user.specialty ? { specialty: { contains: user.specialty } } : {}) },
          include: { hospital: { select: { id: true, name: true, verified: true, address: true } }, _count: { select: { applications: true } } },
          orderBy: user.specialty ? [{ urgent: 'desc' }, { createdAt: 'desc' }] : { createdAt: 'desc' },
          take: 6,
        }),
      ])

      const statusCounts: Record<string, number> = {}
      for (const a of allApps) statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1

      return NextResponse.json({
        role: 'staff',
        stats: {
          applications: allApps.length,
          savedOffers: savedCount,
          unreadMessages: unreadCounts,
          unreadNotifications,
          expiringCreds,
        },
        statusCounts,
        recommended,
      })
    }

    if (user.role === 'hospital_admin' || user.role === 'super_admin') {
      // Super admins don't have a hospitalId, so they use the super admin dashboard instead.
      // But if a super admin is viewing this, redirect them to super stats.
      if (user.role === 'super_admin') {
        return NextResponse.json({
          role: 'super_admin',
          stats: {},
          message: 'Use /api/super/stats for super admin dashboard',
        })
      }
      if (!user.hospitalId) return NextResponse.json({ error: 'No hospital' }, { status: 400 })
      const hospitalId = user.hospitalId

      const [allOffers, recentApplicants, unreadMessages, unreadNotifications, teamCount, applicantTotal] = await Promise.all([
        db.offer.findMany({
          where: { hospitalId },
          select: {
            id: true, title: true, type: true, status: true, urgent: true,
            specialty: true, updatedAt: true, createdAt: true,
            shiftStart: true,
            _count: { select: { applications: true } },
            applications: { select: { status: true } },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        db.application.findMany({
          where: { offer: { hospitalId } },
          include: { offer: { select: { id: true, title: true } }, user: { select: { id: true, name: true, specialty: true, experienceYears: true } } },
          orderBy: { appliedAt: 'desc' },
          take: 5,
        }),
        db.message.count({ where: { recipientId: user.id, read: false } }),
        db.notification.count({ where: { userId: user.id, read: false } }),
        db.user.count({ where: { hospitalId } }),
        db.application.count({ where: { offer: { hospitalId } } }),
      ])

      const now = Date.now()
      const weekAhead = new Date(now + 7 * 24 * 3600 * 1000)
      const openOffers = allOffers.filter(o => o.status === 'published').length
      const draftOffers = allOffers.filter(o => o.status === 'draft').length
      const filledRoles = allOffers.filter(o => o.status === 'filled').length
      const upcomingShifts = allOffers.filter(o =>
        o.status === 'published' && o.type === 'locum' && o.shiftStart &&
        o.shiftStart >= new Date() && o.shiftStart <= weekAhead
      ).length

      const pipeline: Record<string, number> = {}
      for (const o of allOffers) {
        for (const a of o.applications) {
          pipeline[a.status] = (pipeline[a.status] ?? 0) + 1
        }
      }

      const recentOffers = allOffers.slice(0, 5).map(o => ({
        id: o.id, title: o.title, type: o.type, status: o.status,
        updatedAt: o.updatedAt, _count: { applications: o._count.applications },
      }))

      return NextResponse.json({
        role: 'hospital_admin',
        stats: {
          openOffers, applicants: applicantTotal, upcomingShifts, filledRoles,
          draftOffers, unreadMessages, unreadNotifications, teamCount,
        },
        pipeline,
        recentOffers,
        recentApplicants,
      })
    }

    return NextResponse.json({ error: 'Unsupported role' }, { status: 400 })
  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard', detail: error.message },
      { status: 500 }
    )
  }
}
