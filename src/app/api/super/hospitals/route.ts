import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/super/hospitals — list all hospitals (super admin)
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const hospitals = await db.hospital.findMany({
    select: {
      id: true, name: true, description: true, logoUrl: true, bannerUrl: true,
      address: true, verified: true, createdAt: true,
      _count: { select: { offers: true, members: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ items: hospitals })
}

// PATCH /api/super/hospitals — verify/unverify a hospital
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, verified } = await req.json()
  if (!id) return NextResponse.json({ error: 'Hospital id required' }, { status: 400 })

  const hospital = await db.hospital.update({
    where: { id },
    data: { verified: !!verified },
  })

  return NextResponse.json({ hospital })
}
