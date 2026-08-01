import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/notifications
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const items = await db.notification.findMany({
    where: { userId: user.id, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  const unreadCount = await db.notification.count({ where: { userId: user.id, read: false } })
  return NextResponse.json({ items, unreadCount })
}

// PATCH /api/notifications — mark all (or one) as read
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (id) {
    await db.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } })
  } else {
    await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } })
  }
  return NextResponse.json({ ok: true })
}
