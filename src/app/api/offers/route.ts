import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { OfferStatus, OfferType, Visibility } from '@prisma/client'

// GET /api/offers — list with filters
// Public may view published offers; admins may view their hospital's offers (any status)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')        // locum | permanent
  const specialty = searchParams.get('specialty')
  const hospitalId = searchParams.get('hospitalId')
  const q = searchParams.get('q')
  const status = searchParams.get('status')    // for admin view
  const urgentOnly = searchParams.get('urgent') === 'true'
  const sort = searchParams.get('sort') ?? 'newest'
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? '12')))
  const mine = searchParams.get('mine') === 'true'  // admin: their hospital only
  const saved = searchParams.get('saved') === 'true' // staff: only saved

  const user = await getCurrentUser()

  const where: any = {}
  if (mine && user?.hospitalId) {
    where.hospitalId = user.hospitalId
    if (status) where.status = status
  } else {
    where.status = OfferStatus.published
  }
  if (type === 'locum' || type === 'permanent') where.type = type
  if (specialty) where.specialty = { contains: specialty }
  if (hospitalId) where.hospitalId = hospitalId
  if (urgentOnly) where.urgent = true
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { specialty: { contains: q } },
    ]
  }

  if (saved && user) {
    where.savedBy = { some: { userId: user.id } }
  }

  const orderBy: any = sort === 'rate_high'
    ? { rate: 'desc' }
    : sort === 'salary_high'
    ? { salaryMax: 'desc' }
    : sort === 'urgent'
    ? [{ urgent: 'desc' }, { createdAt: 'desc' }]
    : { createdAt: 'desc' }

  const [total, items] = await Promise.all([
    db.offer.count({ where }),
    db.offer.findMany({
      where,
      include: {
        hospital: { select: { id: true, name: true, verified: true, address: true } },
        _count: { select: { applications: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return NextResponse.json({
    items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)),
  })
}

// POST /api/offers — create (admin only)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'hospital_admin' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Forbidden: hospital admin only.' }, { status: 403 })
  }
  if (!user.hospitalId) {
    return NextResponse.json({ error: 'No hospital associated with this account.' }, { status: 400 })
  }
  const body = await req.json()
  const {
    type, title, specialty, description, requirements, location,
    status, visibility, deadline,
    shiftStart, shiftEnd, rate, rateUnit, urgent,
    employmentType, salaryMin, salaryMax, benefits,
  } = body || {}

  if (!title || !type || !['locum', 'permanent'].includes(type)) {
    return NextResponse.json({ error: 'Title and valid type are required.' }, { status: 400 })
  }

  const offer = await db.offer.create({
    data: {
      hospitalId: user.hospitalId,
      createdById: user.id,
      type: type as OfferType,
      title: String(title),
      specialty: specialty ?? null,
      description: description ?? null,
      requirements: requirements ? JSON.stringify(requirements) : null,
      location: location ?? user.hospital?.address ?? null,
      status: status === 'published' ? OfferStatus.published : OfferStatus.draft,
      visibility: visibility === 'internal' ? Visibility.internal : Visibility.public,
      deadline: deadline ? new Date(deadline) : null,
      shiftStart: shiftStart ? new Date(shiftStart) : null,
      shiftEnd: shiftEnd ? new Date(shiftEnd) : null,
      rate: rate != null && rate !== '' ? Number(rate) : null,
      rateUnit: rateUnit ?? null,
      urgent: !!urgent,
      employmentType: employmentType ?? null,
      salaryMin: salaryMin != null && salaryMin !== '' ? Number(salaryMin) : null,
      salaryMax: salaryMax != null && salaryMax !== '' ? Number(salaryMax) : null,
      benefits: benefits ?? null,
    },
    include: { hospital: { select: { id: true, name: true, verified: true, address: true } } },
  })

  await db.auditEvent.create({
    data: { offerId: offer.id, actorId: user.id, action: offer.status === 'published' ? 'published' : 'created', detail: 'Offer created via API' },
  })

  return NextResponse.json({ offer }, { status: 201 })
}
