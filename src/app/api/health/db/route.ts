import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/health/db — verify the database is reachable and report basic stats
export async function GET() {
  const start = Date.now()
  try {
    // Run a SELECT 1 to verify the connection works
    await db.$queryRaw`SELECT 1`

    // Collect row counts from each table
    const counts = await db.$queryRaw<{name: string; cnt: number}[]>`
      SELECT 'hospitals' AS name, COUNT(*) AS cnt FROM Hospital
      UNION ALL SELECT 'users', COUNT(*) FROM User
      UNION ALL SELECT 'offers', COUNT(*) FROM Offer
      UNION ALL SELECT 'applications', COUNT(*) FROM Application
      UNION ALL SELECT 'credentials', COUNT(*) FROM Credential
      UNION ALL SELECT 'messages', COUNT(*) FROM Message
      UNION ALL SELECT 'notifications', COUNT(*) FROM Notification
      UNION ALL SELECT 'savedOffers', COUNT(*) FROM SavedOffer
      UNION ALL SELECT 'auditEvents', COUNT(*) FROM AuditEvent
    `

    const latencyMs = Date.now() - start
    const tableCounts: Record<string, number> = {}
    for (const row of counts) {
      // SQLite returns lowercase, Prisma may format differently — normalize
      const name = String(row.name)
      const cnt = Number(row.cnt)
      tableCounts[name] = cnt
    }

    return NextResponse.json({
      status: 'ok',
      database: 'reachable',
      latencyMs,
      timestamp: new Date().toISOString(),
      engine: 'sqlite (development)',
      tables: tableCounts,
      totalRows: Object.values(tableCounts).reduce((a, b) => a + b, 0),
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
