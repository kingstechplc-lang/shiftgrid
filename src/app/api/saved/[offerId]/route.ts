import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// DELETE /api/saved/[offerId]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.savedOffer.deleteMany({ where: { userId: user.id, offerId } })
  return NextResponse.json({ ok: true })
}
