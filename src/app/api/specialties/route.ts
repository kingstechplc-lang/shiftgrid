import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/specialties — distinct specialties (for filter dropdown)
export async function GET() {
  const offers = await db.offer.findMany({
    where: { specialty: { not: null } },
    distinct: ['specialty'],
    select: { specialty: true },
  })
  const staffSpecialties = await db.user.findMany({
    where: { specialty: { not: null } },
    distinct: ['specialty'],
    select: { specialty: true },
  })
  const set = new Set<string>()
  for (const o of offers) if (o.specialty) set.add(o.specialty)
  for (const s of staffSpecialties) if (s.specialty) set.add(s.specialty)
  return NextResponse.json({ items: Array.from(set).sort() })
}
