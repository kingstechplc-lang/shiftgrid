import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/super/users — list all users (super admin)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const q = searchParams.get('q')

  const where: any = {}
  if (role) where.role = role
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
    ]
  }

  const users = await db.user.findMany({
    where,
    select: {
      id: true, name: true, email: true, role: true, authProvider: true,
      emailVerified: true, specialty: true, region: true, createdAt: true,
      profilePhoto: true,
      hospital: { select: { id: true, name: true } },
      _count: { select: { applications: true, offersCreated: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ items: users })
}
