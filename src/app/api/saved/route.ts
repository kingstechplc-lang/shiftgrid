import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/saved — list user's saved offers
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.savedOffer.findMany({
    where: { userId: user.id },
    include: {
      offer: {
        include: {
          hospital: { select: { id: true, name: true, verified: true, address: true } },
          _count: { select: { applications: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ items: items.map(s => s.offer) })
}

// POST /api/saved — save an offer
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { offerId } = await req.json()
  if (!offerId) return NextResponse.json({ error: 'offerId required' }, { status: 400 })
  try {
    await db.savedOffer.create({ data: { userId: user.id, offerId } })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ ok: true, alreadySaved: true })
    throw e
  }
  return NextResponse.json({ ok: true })
}
