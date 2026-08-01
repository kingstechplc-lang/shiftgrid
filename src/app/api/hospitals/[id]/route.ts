import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/hospitals/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const hospital = await db.hospital.findUnique({
    where: { id },
    include: {
      members: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { offers: true } },
    },
  })
  if (!hospital) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ hospital })
}

// PATCH /api/hospitals/[id]  (admin of same hospital)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || (user.role !== 'hospital_admin' && user.role !== 'super_admin') || user.hospitalId !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const { name, description, address, logoUrl } = body
  const hospital = await db.hospital.update({
    where: { id },
    data: {
      name: name ?? undefined,
      description: description ?? undefined,
      address: address ?? undefined,
      logoUrl: logoUrl ?? undefined,
    },
  })
  return NextResponse.json({ hospital })
}
