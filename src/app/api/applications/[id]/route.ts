import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { ApplicationStatus } from '@prisma/client'

// GET /api/applications/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const app = await db.application.findUnique({
    where: { id },
    include: {
      offer: true,
      user: {
        select: {
          id: true, email: true, name: true, role: true,
          specialty: true, experienceYears: true, location: true,
          availability: true, bio: true, preferredTypes: true, resumeUrl: true,
          credentials: true,
        },
      },
    },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Permission: applicant themselves, or admin of offer's hospital
  if (user.id !== app.userId) {
    if (user.role !== 'hospital_admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (user.hospitalId !== app.offer.hospitalId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  return NextResponse.json({ application: app })
}

// PATCH /api/applications/[id]
//   - staff: can withdraw
//   - admin: can change status (must own the offer's hospital)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { status } = await req.json()
  if (!status || !['applied','under_review','shortlisted','offered','accepted','declined','withdrawn'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const app = await db.application.findUnique({
    where: { id },
    include: { offer: true },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (status === 'withdrawn') {
    if (user.id !== app.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else {
    // Admin action — must own offer's hospital
    if (user.role !== 'hospital_admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (user.hospitalId !== app.offer.hospitalId) {
      return NextResponse.json({ error: 'Forbidden — not your hospital.' }, { status: 403 })
    }
  }

  const updated = await db.application.update({
    where: { id },
    data: { status: status as ApplicationStatus },
  })

  // Notify the applicant
  await db.notification.create({
    data: {
      userId: app.userId,
      type: 'application_status',
      title: 'Application status updated',
      body: `${app.offer.title} — your application is now ${status.replace('_', ' ')}.`,
      payload: JSON.stringify({ offerId: app.offerId, applicationId: app.id, status }),
    },
  })

  // If accepted, also mark offer as filled
  if (status === 'accepted') {
    await db.offer.update({ where: { id: app.offerId }, data: { status: 'filled' } })
    await db.auditEvent.create({ data: { offerId: app.offerId, actorId: user.id, action: 'filled', detail: `Accepted applicant ${app.userId}` } })
  }

  return NextResponse.json({ application: updated })
}
