import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/media — list all media assets (super admin only)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  const where: any = {}
  if (type && type !== 'all') where.type = type

  const items = await db.mediaAsset.findMany({
    where,
    include: { uploader: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ items })
}
