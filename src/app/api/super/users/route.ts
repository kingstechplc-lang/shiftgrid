import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/super/users — list all users (super admin) with filters
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const q = searchParams.get('q')
  const status = searchParams.get('status') // active, suspended, banned

  const where: any = {}
  if (role) where.role = role
  if (status) where.status = status
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { registrationId: { contains: q, mode: 'insensitive' } },
    ]
  }

  const users = await db.user.findMany({
    where,
    select: {
      id: true, name: true, email: true, role: true, authProvider: true,
      emailVerified: true, status: true, registrationId: true,
      specialty: true, region: true, createdAt: true,
      profilePhoto: true, website: true,
      hospital: { select: { id: true, name: true } },
      _count: { select: { applications: true, offersCreated: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ items: users })
}
