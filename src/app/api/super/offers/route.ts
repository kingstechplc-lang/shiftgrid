import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { OfferStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET /api/super/offers — list all offers across all hospitals (super admin)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  const where: any = {}
  if (status) where.status = status
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { specialty: { contains: q, mode: 'insensitive' } },
    ]
  }

  const offers = await db.offer.findMany({
    where,
    select: {
      id: true, title: true, type: true, status: true, specialty: true,
      urgent: true, createdAt: true, updatedAt: true,
      hospital: { select: { id: true, name: true, logoUrl: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ items: offers })
}
