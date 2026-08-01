import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/unread-counts — lightweight endpoint for sidebar badges
// Returns just two numbers. Used by the app-shell poller every 60s.
// Replaces the old pattern of fetching ALL messages + ALL notifications just to count unread.
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [unreadMessages, unreadNotifications] = await Promise.all([
    db.message.count({ where: { recipientId: user.id, read: false } }),
    db.notification.count({ where: { userId: user.id, read: false } }),
  ])

  return NextResponse.json({ unreadMessages, unreadNotifications })
}
