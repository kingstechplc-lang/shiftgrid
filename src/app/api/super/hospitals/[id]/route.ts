import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/super/hospitals/[id] — detailed hospital info for super admin preview
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const hospital = await db.hospital.findUnique({
    where: { id },
    include: {
      members: {
        select: {
          id: true, name: true, email: true, role: true, status: true,
          profilePhoto: true, createdAt: true, emailVerified: true,
          specialty: true, phoneNumber: true, region: true,
        }
      },
      offers: {
        select: {
          id: true, title: true, type: true, status: true, urgent: true,
          createdAt: true, _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: { select: { offers: true, members: true } },
    },
  })

  if (!hospital) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ hospital })
}

// PATCH /api/super/hospitals/[id] — verify/unverify, change status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { verified, status } = body
  const data: any = {}

  if (typeof verified === 'boolean') data.verified = verified
  if (status && ['active', 'suspended', 'banned'].includes(status)) data.status = status

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updated = await db.hospital.update({ where: { id }, data })
  return NextResponse.json({ hospital: updated })
}

// DELETE /api/super/hospitals/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const confirm = searchParams.get('confirm')
  if (confirm !== 'yes') {
    return NextResponse.json({ error: 'Confirmation required' }, { status: 400 })
  }

  await db.hospital.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
