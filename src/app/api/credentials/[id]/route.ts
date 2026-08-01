import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// DELETE /api/credentials/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cred = await db.credential.findUnique({ where: { id } })
  if (!cred) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (cred.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await db.credential.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
