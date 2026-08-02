import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, toSafeUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// PATCH /api/settings/messages — toggle canReceiveMessages for current user
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { canReceiveMessages } = await req.json()
  if (typeof canReceiveMessages !== 'boolean') {
    return NextResponse.json({ error: 'canReceiveMessages (boolean) required' }, { status: 400 })
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { canReceiveMessages: canReceiveMessages ? 'true' : 'false' },
    include: { hospital: true },
  })

  return NextResponse.json({ user: toSafeUser(updated) })
}
