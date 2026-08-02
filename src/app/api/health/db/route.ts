import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/health/db — verify the database is reachable and report basic stats
export async function GET() {
  const start = Date.now()
  try {
    // Use Prisma model API (works on both SQLite and Postgres, case-correct)
    const [hospitals, users, offers, applications, credentials, messages, notifications, savedOffers, auditEvents] = await Promise.all([
      db.hospital.count(),
      db.user.count(),
      db.offer.count(),
      db.application.count(),
      db.credential.count(),
      db.message.count(),
      db.notification.count(),
      db.savedOffer.count(),
      db.auditEvent.count(),
    ])

    const latencyMs = Date.now() - start

    return NextResponse.json({
      status: 'ok',
      database: 'reachable',
      engine: 'postgresql (neon)',
      latencyMs,
      timestamp: new Date().toISOString(),
      tables: {
        hospitals,
        users,
        offers,
        applications,
        credentials,
        messages,
        notifications,
        savedOffers,
        auditEvents,
      },
      totalRows: hospitals + users + offers + applications + credentials + messages + notifications + savedOffers + auditEvents,
    })
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      database: 'unreachable',
      error: e.message,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
}
