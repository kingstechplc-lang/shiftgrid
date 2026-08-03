import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/ads — public: returns enabled ad configs; ?all=true returns all (super admin)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === 'true'

  let where: any = { enabled: true }
  if (all) {
    const user = await getCurrentUser()
    if (user?.role === 'super_admin') {
      where = {} // super admin sees all
    }
  }

  const configs = await db.adConfig.findMany({
    where,
    select: {
      id: true,
      slotName: true,
      label: true,
      enabled: true,
      adKey: true,
      adScriptSrc: true,
      width: true,
      height: true,
      adType: true,
      customCode: true,
      updatedAt: true,
    },
  })

  // Convert to a map for easy lookup
  const adMap: Record<string, any> = {}
  for (const c of configs) {
    adMap[c.slotName] = c
  }

  return NextResponse.json({ ads: adMap })
}

// PATCH /api/ads — super admin: update ad config
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: super admin only' }, { status: 403 })
  }

  const { slotName, enabled, adKey, adScriptSrc, adType, customCode } = await req.json()
  if (!slotName) return NextResponse.json({ error: 'slotName required' }, { status: 400 })

  const existing = await db.adConfig.findUnique({ where: { slotName } })
  if (!existing) return NextResponse.json({ error: 'Ad slot not found' }, { status: 404 })

  const data: any = { updatedById: user.id }
  if (typeof enabled === 'boolean') data.enabled = enabled
  if (adKey !== undefined) data.adKey = adKey || null
  if (adScriptSrc !== undefined) data.adScriptSrc = adScriptSrc || null
  if (adType !== undefined) data.adType = adType
  if (customCode !== undefined) data.customCode = customCode || null

  const updated = await db.adConfig.update({ where: { slotName }, data })
  return NextResponse.json({ config: updated })
}
