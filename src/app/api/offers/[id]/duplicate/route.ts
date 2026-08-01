import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/offers/[id]/duplicate — clone an existing offer as a new draft
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || (user.role !== 'hospital_admin' && user.role !== 'super_admin') || !user.hospitalId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const src = await db.offer.findUnique({ where: { id } })
  if (!src) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (src.hospitalId !== user.hospitalId) {
    return NextResponse.json({ error: 'You can only duplicate your own hospital\u2019s offers.' }, { status: 403 })
  }
  const dup = await db.offer.create({
    data: {
      hospitalId: src.hospitalId,
      createdById: user.id,
      type: src.type,
      title: `${src.title} (Copy)`,
      specialty: src.specialty,
      description: src.description,
      requirements: src.requirements,
      location: src.location,
      status: 'draft',
      visibility: src.visibility,
      deadline: null,
      shiftStart: null, shiftEnd: null,
      rate: src.rate, rateUnit: src.rateUnit, urgent: false,
      employmentType: src.employmentType, salaryMin: src.salaryMin, salaryMax: src.salaryMax, benefits: src.benefits,
    },
  })
  await db.auditEvent.create({ data: { offerId: dup.id, actorId: user.id, action: 'created', detail: `Duplicated from ${src.id}` } })
  return NextResponse.json({ offer: dup }, { status: 201 })
}
