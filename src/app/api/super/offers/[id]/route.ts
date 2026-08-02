import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { OfferStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

// PATCH /api/super/offers/[id] — change offer status (close, ban, restore)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { status } = await req.json()
  if (!['draft', 'published', 'closed', 'filled'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const offer = await db.offer.update({
    where: { id },
    data: { status: status as OfferStatus },
  })

  return NextResponse.json({ offer })
}

// DELETE /api/super/offers/[id] — permanently delete an offer
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

  await db.offer.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
