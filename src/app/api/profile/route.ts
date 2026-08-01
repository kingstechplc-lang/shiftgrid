import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PATCH /api/profile — update current user's profile
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const allowed: any = {}
  const fields = ['name','specialty','resumeUrl','availability','bio','location']
  for (const f of fields) if (f in body) allowed[f] = body[f] ?? null
  if ('experienceYears' in body) allowed.experienceYears = body.experienceYears !== '' && body.experienceYears != null ? Number(body.experienceYears) : null
  if ('preferredTypes' in body) {
    allowed.preferredTypes = Array.isArray(body.preferredTypes) ? body.preferredTypes.join(',') : body.preferredTypes ?? null
  }
  const updated = await db.user.update({ where: { id: user.id }, data: allowed, include: { hospital: true } })
  return NextResponse.json({ user: updated })
}
