import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/banners — list all platform banners (public sees only active)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === 'true'
  const user = await getCurrentUser()
  const isSuperAdmin = user?.role === 'super_admin'

  const now = new Date()
  const where: any = {}

  if (!all || !isSuperAdmin) {
    where.isActive = true
    where.AND = [
      { OR: [{ startDate: null }, { startDate: { lte: now } }] },
      { OR: [{ endDate: null }, { endDate: { gte: now } }] },
    ]
  }

  const banners = await db.platformBanner.findMany({
    where,
    orderBy: { displayOrder: 'asc' },
    include: { createdBy: { select: { name: true } } },
  })

  return NextResponse.json({ items: banners })
}

// POST /api/banners — create a new platform banner (super admin only)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: super admin only' }, { status: 403 })
  }

  const body = await req.json()
  const { title, desktopImageUrl, mobileImageUrl, targetUrl, isActive, displayOrder, startDate, endDate } = body

  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const banner = await db.platformBanner.create({
    data: {
      title,
      desktopImageUrl: desktopImageUrl || null,
      mobileImageUrl: mobileImageUrl || null,
      targetUrl: targetUrl || null,
      isActive: isActive !== false,
      displayOrder: displayOrder ? Number(displayOrder) : 0,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdById: user.id,
    },
  })

  return NextResponse.json({ banner }, { status: 201 })
}
