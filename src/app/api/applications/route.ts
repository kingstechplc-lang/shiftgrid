import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { ApplicationStatus } from '@prisma/client'

// GET /api/applications
//   - staff (mine=true): their own applications
//   - admin: applications for an offer they own (pass offerId)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const offerId = searchParams.get('offerId')
  const mine = searchParams.get('mine') === 'true'
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (mine) {
    if (user.role !== 'staff') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const items = await db.application.findMany({
      where: { userId: user.id },
      include: {
        offer: {
          include: {
            hospital: { select: { id: true, name: true, verified: true, address: true } },
            _count: { select: { applications: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ items })
  }

  if (offerId) {
    if (user.role !== 'hospital_admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const offer = await db.offer.findUnique({ where: { id: offerId } })
    if (!offer || offer.hospitalId !== user.hospitalId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const items = await db.application.findMany({
      where: { offerId },
      include: {
        user: {
          select: {
            id: true, email: true, name: true, role: true,
            specialty: true, experienceYears: true, location: true,
            availability: true, bio: true, preferredTypes: true, resumeUrl: true,
            credentials: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    })
    return NextResponse.json({ items })
  }

  return NextResponse.json({ items: [] })
}

// POST /api/applications — staff applies to an offer
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'staff') {
    return NextResponse.json({ error: 'Forbidden: staff only.' }, { status: 403 })
  }
  const { offerId, coverNote } = await req.json()
  if (!offerId) return NextResponse.json({ error: 'offerId required' }, { status: 400 })

  const offer = await db.offer.findUnique({ where: { id: offerId } })
  if (!offer || offer.status !== 'published') {
    return NextResponse.json({ error: 'Offer not available.' }, { status: 400 })
  }
  const existing = await db.application.findUnique({
    where: { offerId_userId: { offerId, userId: user.id } },
  })
  if (existing) return NextResponse.json({ error: 'You have already applied.' }, { status: 409 })

  const app = await db.application.create({
    data: { offerId, userId: user.id, coverNote: coverNote ?? null },
  })

  // Notify the offer creator
  await db.notification.create({
    data: {
      userId: offer.createdById,
      type: 'application',
      title: 'New application received',
      body: `${user.name} applied to ${offer.title}.`,
      payload: JSON.stringify({ offerId, applicationId: app.id }),
    },
  })

  return NextResponse.json({ application: app }, { status: 201 })
}
