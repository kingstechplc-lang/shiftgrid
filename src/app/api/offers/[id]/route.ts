import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { OfferStatus, Visibility } from '@prisma/client'

// GET /api/offers/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const offer = await db.offer.findUnique({
    where: { id },
    include: {
      hospital: { select: { id: true, name: true, verified: true, address: true, description: true } },
      _count: { select: { applications: true } },
    },
  })
  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Visibility: draft/closed only visible to that hospital's admins
  if (offer.status === 'draft' || offer.status === 'closed') {
    if (!user || (user.role !== 'super_admin' && user.hospitalId !== offer.hospitalId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }
  return NextResponse.json({ offer })
}

// PATCH /api/offers/[id]  (admin of same hospital)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || (user.role !== 'hospital_admin' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const offer = await db.offer.findUnique({ where: { id } })
  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user.hospitalId !== offer.hospitalId) {
    return NextResponse.json({ error: 'You can only edit your own hospital\u2019s offers.' }, { status: 403 })
  }

  const body = await req.json()
  const allowed: any = {}
  const fields = ['title','specialty','description','location','rateUnit','employmentType','benefits']
  for (const f of fields) if (f in body) allowed[f] = body[f] ?? null
  if ('requirements' in body) allowed.requirements = body.requirements ? JSON.stringify(body.requirements) : null
  if ('status' in body && ['draft','published','closed','filled'].includes(body.status)) {
    allowed.status = body.status as OfferStatus
  }
  if ('visibility' in body && ['public','internal'].includes(body.visibility)) {
    allowed.visibility = body.visibility as Visibility
  }
  if ('deadline' in body) allowed.deadline = body.deadline ? new Date(body.deadline) : null
  if ('shiftStart' in body) allowed.shiftStart = body.shiftStart ? new Date(body.shiftStart) : null
  if ('shiftEnd' in body) allowed.shiftEnd = body.shiftEnd ? new Date(body.shiftEnd) : null
  if ('rate' in body) allowed.rate = body.rate !== '' && body.rate != null ? Number(body.rate) : null
  if ('urgent' in body) allowed.urgent = !!body.urgent
  if ('salaryMin' in body) allowed.salaryMin = body.salaryMin !== '' && body.salaryMin != null ? Number(body.salaryMin) : null
  if ('salaryMax' in body) allowed.salaryMax = body.salaryMax !== '' && body.salaryMax != null ? Number(body.salaryMax) : null
  allowed.updatedAt = new Date()

  const updated = await db.offer.update({
    where: { id },
    data: allowed,
    include: { hospital: { select: { id: true, name: true, verified: true, address: true } } },
  })

  if (allowed.status) {
    await db.auditEvent.create({
      data: { offerId: id, actorId: user.id, action: `status:${allowed.status}`, detail: `Status changed to ${allowed.status}` },
    })
    // If offer was filled, notify other applicants
    if (allowed.status === OfferStatus.filled) {
      const others = await db.application.findMany({
        where: { offerId: id, status: { notIn: ['accepted', 'declined', 'withdrawn'] } },
      })
      for (const a of others) {
        await db.notification.create({
          data: { userId: a.userId, type: 'offer_filled', title: 'Offer has been filled', body: `${updated.title} is no longer accepting applications.` },
        })
      }
    }
  }

  return NextResponse.json({ offer: updated })
}

// DELETE /api/offers/[id]  (admin of same hospital)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || (user.role !== 'hospital_admin' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const offer = await db.offer.findUnique({ where: { id } })
  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user.hospitalId !== offer.hospitalId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await db.offer.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
