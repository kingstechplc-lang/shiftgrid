import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// PATCH /api/banners/[id] — update banner
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { title, desktopImageUrl, mobileImageUrl, targetUrl, isActive, displayOrder, startDate, endDate } = body

  const banner = await db.platformBanner.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(desktopImageUrl !== undefined && { desktopImageUrl }),
      ...(mobileImageUrl !== undefined && { mobileImageUrl }),
      ...(targetUrl !== undefined && { targetUrl }),
      ...(isActive !== undefined && { isActive }),
      ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
    },
  })

  return NextResponse.json({ banner })
}

// DELETE /api/banners/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  if (searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({ error: 'Confirmation required' }, { status: 400 })
  }

  await db.platformBanner.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
